import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import ts from "typescript";

test("sync acknowledgement preserves transactions queued while the request is in flight", async () => {
  const storage = new Map<string, string>();
  let finish!: () => void;
  let invoked!: () => void;
  const started = new Promise<void>((resolve) => {
    invoked = resolve;
  });
  const pending = new Promise<void>((resolve) => {
    finish = resolve;
  });
  const source = readFileSync(
    new URL("../lib/transaction-sync.ts", import.meta.url),
    "utf8",
  ).replace(/^import .*;\s*$/gm, "");
  const exports: Record<string, (...args: any[]) => any> = {};
  runInNewContext(
    ts.transpileModule(source, {
      compilerOptions: {
        target: ts.ScriptTarget.ES2022,
        module: ts.ModuleKind.CommonJS,
      },
    }).outputText,
    {
      exports,
      console,
      localStorage: {
        getItem: (k: string) => storage.get(k),
        setItem: (k: string, v: string) => storage.set(k, v),
      },
      backend: () => ({
        auth: {
          getSession: async () => ({
            data: { session: { user: { id: "test" } } },
          }),
        },
        functions: {
          invoke: async () => {
            invoked();
            await pending;
            return { data: { synced: true } };
          },
        },
      }),
    },
  );
  const item = (signature: string) => ({
    signature,
    cluster: "devnet",
    action: "fund_escrow",
    escrowAddress: "test-address",
  });
  exports.enqueueTransactionSync(item("first"));
  const flush = exports.flushPendingTransactionSync();
  await started;
  exports.enqueueTransactionSync(item("second"));
  finish();
  await flush;
  const queue = JSON.parse([...storage.values()][0]);
  assert.deepEqual(
    queue.map((v: { signature: string }) => v.signature),
    ["second"],
  );
});

test("backend rejection never resolves as synced and retains the real receipt", async () => {
  const storage = new Map<string, string>();
  const source = readFileSync(
    new URL("../lib/transaction-sync.ts", import.meta.url),
    "utf8",
  ).replace(/^import .*;\s*$/gm, "");
  const exports: Record<string, (...args: any[]) => any> = {};
  runInNewContext(
    ts.transpileModule(source, {
      compilerOptions: {
        target: ts.ScriptTarget.ES2022,
        module: ts.ModuleKind.CommonJS,
      },
    }).outputText,
    {
      exports,
      console,
      localStorage: {
        getItem: (k: string) => storage.get(k),
        setItem: (k: string, v: string) => storage.set(k, v),
      },
      backend: () => ({
        auth: {
          getSession: async () => ({
            data: { session: { user: { id: "test" } } },
          }),
        },
        functions: {
          invoke: async () => ({ data: null, error: { message: "403" } }),
        },
      }),
    },
  );
  exports.enqueueTransactionSync({
    signature: "confirmed-receipt",
    cluster: "devnet",
    action: "fund_escrow",
    escrowAddress: "test-address",
  });
  await assert.rejects(
    exports.flushPendingTransactionSync(),
    /Do not repeat the payment/,
  );
  assert.equal(
    JSON.parse([...storage.values()][0])[0].signature,
    "confirmed-receipt",
  );
  await assert.rejects(exports.flushPendingTransactionSync(), /not confirmed/);
});

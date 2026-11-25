import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { webcrypto } from "node:crypto";
import { runInNewContext } from "node:vm";
import ts from "typescript";
import { utils } from "@coral-xyz/anchor";
// Execute the actual deployed handler source with mocked transport/storage, but REAL Ed25519.
// These unit tests do not impersonate accounts in the live project.
async function fixture(authenticated = true, owner = "unit-test-user") {
  const pair = await webcrypto.subtle.generateKey("Ed25519", true, [
    "sign",
    "verify",
  ]);
  if (!("publicKey" in pair)) throw new Error("Expected an Ed25519 key pair");
  const pub = new Uint8Array(
    await webcrypto.subtle.exportKey("raw", pair.publicKey),
  );
  const challenge = {
    public_key: utils.bytes.bs58.encode(pub),
    message: "Trustlayer test nonce with account and expiry binding",
    expires_at: new Date(Date.now() + 60000).toISOString(),
    consumed_at: null as string | null,
  };
  let writes = 0;
  let reads = 0;
  let handler: (req: Request) => Promise<Response> = () => {
    throw new Error("Handler not registered");
  };
  const client = {
    auth: {
      getUser: async () => ({
        data: { user: authenticated ? { id: "unit-test-user" } : null },
        error: authenticated ? null : new Error("invalid JWT"),
      }),
    },
    from: () => {
      reads++;
      const filters = new Map<string, string>();
      const chain = {
        select: () => chain,
        eq: (key: string, value: string) => {
          filters.set(key, value);
          return chain;
        },
        single: async () =>
          filters.get("user_id") === owner
            ? { data: challenge, error: null }
            : { data: null, error: new Error("not found") },
      };
      return chain;
    },
    rpc: async () => {
      if (challenge.consumed_at) return { error: new Error("consumed") };
      writes++;
      challenge.consumed_at = new Date().toISOString();
      return { error: null };
    },
  };
  const source = readFileSync(
    new URL(
      "../../../supabase/functions/trustlayer-verify-wallet/index.ts",
      import.meta.url,
    ),
    "utf8",
  ).replace(/^import .*;\s*$/gm, "");
  const compiled = ts.transpileModule(source, {
    compilerOptions: {
      target: ts.ScriptTarget.ES2022,
      module: ts.ModuleKind.None,
    },
  }).outputText;
  runInNewContext(compiled, {
    Deno: {
      env: { get: () => "unit-test-only" },
      serve: (fn: typeof handler) => {
        handler = fn;
      },
    },
    createClient: () => client,
    bs58: utils.bytes.bs58,
    crypto: webcrypto,
    Response,
    Uint8Array,
    TextEncoder,
    TextDecoder,
    atob,
    Date,
    JSON,
  });
  const signature = Buffer.from(
    await webcrypto.subtle.sign(
      "Ed25519",
      pair.privateKey,
      new TextEncoder().encode(challenge.message),
    ),
  ).toString("base64");
  function request(signatureValue = signature, bearer = true) {
    return new Request("https://unit.invalid", {
      method: "POST",
      headers: bearer ? { authorization: "Bearer test-only" } : {},
      body: JSON.stringify({
        challengeId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
        signature: signatureValue,
      }),
    });
  }
  return {
    handle: () => handler(request()),
    handler,
    request,
    challenge,
    writes: () => writes,
    reads: () => reads,
  };
}
test("Edge verifier validates real Ed25519 and consumes a proof only once", async () => {
  const f = await fixture();
  assert.equal((await f.handle()).status, 200);
  assert.equal(f.writes(), 1);
  assert.equal((await f.handle()).status, 400);
  assert.equal(f.writes(), 1);
});
test("Edge verifier rejects missing and invalid authentication before database reads", async () => {
  const f = await fixture(false);
  assert.equal((await f.handler(f.request("", false))).status, 401);
  assert.equal((await f.handle()).status, 401);
  assert.equal(f.reads(), 0);
});
test("Edge verifier rejects forged signatures and expired challenges without writes", async () => {
  const f = await fixture();
  assert.equal(
    (await f.handler(f.request(Buffer.alloc(64).toString("base64")))).status,
    400,
  );
  f.challenge.expires_at = new Date(0).toISOString();
  assert.equal((await f.handle()).status, 400);
  assert.equal(f.writes(), 0);
});

test("Edge verifier cannot access another account's challenge", async () => {
  const f = await fixture(true, "other-account");
  assert.equal((await f.handle()).status, 400);
  assert.equal(f.writes(), 0);
});

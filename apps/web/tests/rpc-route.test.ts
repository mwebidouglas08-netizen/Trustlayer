import { test } from "node:test";
import assert from "node:assert/strict";
import { NextRequest } from "next/server";
import { POST } from "../app/api/rpc/route";

test("RPC handler rejects bad methods, JSON, bodies and origins without upstream fetch", async () => {
  const original = globalThis.fetch;
  const cluster = process.env.NEXT_PUBLIC_SOLANA_CLUSTER;
  process.env.NEXT_PUBLIC_SOLANA_CLUSTER = "devnet";
  let calls = 0;
  globalThis.fetch = async () => {
    calls++;
    throw new Error("Upstream must not be called");
  };
  try {
    const cases: [string, number, string?][] = [
      [
        JSON.stringify({
          jsonrpc: "2.0",
          id: 1,
          method: "requestAirdrop",
          params: [],
        }),
        400,
      ],
      [JSON.stringify({ jsonrpc: "2.0", id: 1, method: "unknown" }), 400],
      ["{", 400],
      ["x".repeat(65537), 413],
      [
        JSON.stringify({ jsonrpc: "2.0", id: 1, method: "getHealth" }),
        403,
        "https://attacker.example",
      ],
    ];
    for (const [body, expected, origin] of cases) {
      const response = await POST(
        new NextRequest("http://localhost:3100/api/rpc", {
          method: "POST",
          body,
          headers: origin ? { origin } : {},
        }),
      );
      assert.equal(response.status, expected);
    }
    assert.equal(calls, 0);
  } finally {
    globalThis.fetch = original;
    if (cluster === undefined) delete process.env.NEXT_PUBLIC_SOLANA_CLUSTER;
    else process.env.NEXT_PUBLIC_SOLANA_CLUSTER = cluster;
  }
});

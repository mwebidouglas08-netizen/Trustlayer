import { test } from "node:test";
import assert from "node:assert/strict";
import { getSolanaCluster, explorer } from "../lib/solana/cluster";
test("network parsing fails closed instead of silently selecting devnet", () => {
  const previous = process.env.NEXT_PUBLIC_SOLANA_CLUSTER;
  try {
    process.env.NEXT_PUBLIC_SOLANA_CLUSTER = "devnet";
    assert.equal(getSolanaCluster(), "devnet");
    assert.equal(
      explorer("test/address", "tx"),
      "https://explorer.solana.com/tx/test%2Faddress?cluster=devnet",
    );
    process.env.NEXT_PUBLIC_SOLANA_CLUSTER = "mainnet";
    assert.throws(() => getSolanaCluster(), /Invalid/);
  } finally {
    if (previous === undefined) delete process.env.NEXT_PUBLIC_SOLANA_CLUSTER;
    else process.env.NEXT_PUBLIC_SOLANA_CLUSTER = previous;
  }
});

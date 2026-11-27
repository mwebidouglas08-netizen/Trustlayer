import { test } from "node:test";
import assert from "node:assert/strict";
import anchor from "@coral-xyz/anchor";
import { Connection, PublicKey } from "@solana/web3.js";
import { decodeConfig } from "./verify-devnet.mjs";

test("raw Anchor Config and snake_case fields decode to client names without RPC", async () => {
  const key = new PublicKey("7v6PxWejvNneG5TwZSntgj5ZjV6sgLSengjkVsct6V2G");
  const idl = {
    address: key.toBase58(),
    metadata: { name: "fixture", version: "0.1.0", spec: "0.1.0" },
    instructions: [],
    accounts: [{ name: "Config", discriminator: [1, 2, 3, 4, 5, 6, 7, 8] }],
    types: [
      {
        name: "Config",
        type: {
          kind: "struct",
          fields: [
            { name: "usdc_mint", type: "pubkey" },
            { name: "fee_bps", type: "u16" },
            { name: "paused", type: "bool" },
          ],
        },
      },
    ],
  };
  const raw = new anchor.BorshAccountsCoder(idl);
  const data = await raw.encode("Config", {
    usdc_mint: key,
    fee_bps: 100,
    paused: false,
  });
  assert.throws(() => raw.decode("config", data));
  const connection = new Connection("http://127.0.0.1:8899");
  const decoded = decodeConfig(idl, data, connection);
  assert.equal(decoded.usdcMint.toBase58(), key.toBase58());
  assert.equal(decoded.feeBps, 100);
  assert.equal(decoded.paused, false);
  const corrupt = Buffer.from(data);
  corrupt[0] ^= 255;
  assert.throws(() => decodeConfig(idl, corrupt, connection), /discriminator/i);
});

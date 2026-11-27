import { test } from "node:test";
import assert from "node:assert/strict";
import { Keypair } from "@solana/web3.js";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { BrowserWallet } from "../lib/escrow";
import { signInWithWallet } from "../lib/wallet-auth";

test("auth preserves wallet receiver, uses current origin and requires a real session", async () => {
  const wallet = {
    publicKey: Keypair.generate().publicKey,
    async signMessage() {
      assert.equal(this, wallet);
      return new Uint8Array(64);
    },
  } as Pick<BrowserWallet, "publicKey" | "signMessage">;
  const client = {
    auth: {
      async signInWithWeb3(input: any) {
        assert.equal(input.options.url, "https://example.com/app/profile");
        assert.equal(
          (await input.wallet.signMessage(new Uint8Array([1]))).length,
          64,
        );
        return { data: { session: null, user: null }, error: null };
      },
    },
  } as unknown as SupabaseClient;
  await assert.rejects(
    signInWithWallet(
      client,
      wallet,
      "https://example.com/app/profile?private=value",
    ),
    /did not return a session/,
  );
});

test("account switch while signing aborts before proof submission", async () => {
  const wallet = {
    publicKey: Keypair.generate().publicKey,
    async signMessage() {
      this.publicKey = Keypair.generate().publicKey;
      return new Uint8Array(64);
    },
  } as Pick<BrowserWallet, "publicKey" | "signMessage">;
  const client = {
    auth: {
      async signInWithWeb3(input: any) {
        await input.wallet.signMessage(new Uint8Array([1]));
        assert.fail("must not submit changed account proof");
      },
    },
  } as unknown as SupabaseClient;
  await assert.rejects(
    signInWithWallet(client, wallet, "https://example.com"),
    /account changed while signing/,
  );
});

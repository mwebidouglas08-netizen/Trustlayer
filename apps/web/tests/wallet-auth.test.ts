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
        assert.match(
          input.message,
          /URI: https:\/\/example.com\/app\/profile\nVersion: 1/,
        );
        assert.equal(input.signature.length, 64);
        assert.ok(!input.message.includes("private=value"));
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
      async signInWithWeb3() {
        assert.fail("must not submit changed account proof");
      },
    },
  } as unknown as SupabaseClient;
  await assert.rejects(
    signInWithWallet(client, wallet, "https://example.com"),
    /account changed while signing/,
  );
});

test("standard sign-in payload parses correctly and authenticates exact signed bytes", async () => {
  const { parseSignInMessageText } =
    await import("@solana/wallet-standard-util");
  const { generateKeyPairSync, sign, verify } = await import("node:crypto");
  const { PublicKey } = await import("@solana/web3.js");
  const keys = generateKeyPairSync("ed25519");
  const address = new PublicKey(
    keys.publicKey.export({ format: "der", type: "spki" }).subarray(-32),
  );
  let signed: Uint8Array;
  const wallet = {
    publicKey: address,
    async signMessage(bytes: Uint8Array) {
      signed = bytes;
      return new Uint8Array(sign(null, bytes, keys.privateKey));
    },
  };
  const client = {
    auth: {
      async signInWithWeb3(input: any) {
        const parsed = parseSignInMessageText(input.message);
        assert.equal(parsed?.uri, "https://example.com/app/profile");
        assert.equal(parsed?.domain, "example.com");
        assert.equal(parsed?.address, address.toBase58());
        assert.equal(parsed?.version, "1");
        assert.match(parsed!.nonce!, /^[a-zA-Z0-9]{32}$/);
        assert.equal(
          Date.parse(parsed!.expirationTime!) - Date.parse(parsed!.issuedAt!),
          300000,
        );
        assert.deepEqual(new TextEncoder().encode(input.message), signed);
        assert.ok(verify(null, signed, keys.publicKey, input.signature));
        assert.equal(
          verify(
            null,
            Buffer.from(input.message + "changed"),
            keys.publicKey,
            input.signature,
          ),
          false,
        );
        return {
          data: { session: null, user: null },
          error: { code: "test_rejection", message: "Test backend rejection" },
        };
      },
    },
  } as unknown as SupabaseClient;
  await assert.rejects(
    signInWithWallet(client, wallet, "https://example.com"),
    /test_rejection/,
  );
});

test("installed SDK wallet fallback has noncanonical SIWS field ordering", async () => {
  const { createClient } = await import("@supabase/supabase-js");
  const { createSignInMessageText } =
    await import("@solana/wallet-standard-util");
  const address = Keypair.generate().publicKey;
  let captured = "";
  const issuedAt = "2026-11-25T12:00:00.000Z";
  const expirationTime = "2026-11-25T12:05:00.000Z";
  const nonce = "0123456789abcdef";
  const client = createClient(
    "https://example.supabase.co",
    "test-public-key",
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
      global: {
        fetch: async () =>
          new Response(JSON.stringify({ error: "test rejection" }), {
            status: 400,
            headers: { "Content-Type": "application/json" },
          }),
      },
    },
  );
  await client.auth.signInWithWeb3({
    chain: "solana",
    statement: "Sign in to Trustlayer.",
    wallet: {
      publicKey: address,
      signMessage: async (bytes) => {
        captured = new TextDecoder().decode(bytes);
        return new Uint8Array(64);
      },
    },
    options: {
      url: "https://example.com/app/profile",
      signInWithSolana: { nonce, issuedAt, expirationTime },
    },
  });
  const standard = createSignInMessageText({
    domain: "example.com",
    address: address.toBase58(),
    statement: "Sign in to Trustlayer.",
    uri: "https://example.com/app/profile",
    version: "1",
    nonce,
    issuedAt,
    expirationTime,
  });
  assert.notEqual(captured, standard);
  assert.match(captured, /Version: 1\nURI:/);
  assert.match(
    standard,
    /URI: https:\/\/example.com\/app\/profile\nVersion: 1\nNonce:/,
  );
});

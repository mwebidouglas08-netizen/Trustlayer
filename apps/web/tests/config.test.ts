import { test } from "node:test";
import assert from "node:assert/strict";
import {
  getSolanaCluster,
  explorer,
  SOLANA_GENESIS_HASHES,
} from "../lib/solana/cluster";

test("network parsing validates supported clusters", () => {
  const previousCluster = process.env.NEXT_PUBLIC_SOLANA_CLUSTER;

  try {
    process.env.NEXT_PUBLIC_SOLANA_CLUSTER = "devnet";
    assert.equal(getSolanaCluster("development"), "devnet");

    assert.equal(
      explorer("test/address", "tx"),
      "https://explorer.solana.com/tx/test%2Faddress?cluster=devnet",
    );

    process.env.NEXT_PUBLIC_SOLANA_CLUSTER = "testnet";
    assert.equal(getSolanaCluster("development"), "testnet");

    process.env.NEXT_PUBLIC_SOLANA_CLUSTER = "mainnet";
    assert.throws(
      () => getSolanaCluster("development"),
      /Invalid/,
    );
  } finally {
    if (previousCluster === undefined)
      delete process.env.NEXT_PUBLIC_SOLANA_CLUSTER;
    else
      process.env.NEXT_PUBLIC_SOLANA_CLUSTER = previousCluster;
  }
});

test("Localnet is accepted only in development", () => {
  const previousCluster = process.env.NEXT_PUBLIC_SOLANA_CLUSTER;

  try {
    process.env.NEXT_PUBLIC_SOLANA_CLUSTER = "localnet";

    assert.equal(getSolanaCluster("development"), "localnet");

    assert.match(
      explorer("test-address", "address", "development"),
      /cluster=custom/,
    );

    assert.throws(
      () => getSolanaCluster("production"),
      /development/,
    );
  } finally {
    if (previousCluster === undefined)
      delete process.env.NEXT_PUBLIC_SOLANA_CLUSTER;
    else
      process.env.NEXT_PUBLIC_SOLANA_CLUSTER = previousCluster;
  }
});

test("Solana cluster genesis hashes are complete and correct", () => {
  assert.equal(
    SOLANA_GENESIS_HASHES.devnet,
    "EtWTRABZaYq6iMfeYKouRu166VU2xqa1wcaWoxPkrZBG",
  );
  assert.equal(
    SOLANA_GENESIS_HASHES.testnet,
    "4uhcVJyU9pJkvQyS88uRDiswHXSCkY3zQawwpjk2NsNY",
  );

  assert.equal(
    SOLANA_GENESIS_HASHES.localnet,
    "FyA1GKUaJFGhD9nGvgeNA7KTurYfKUzxgnCpjZR4cTUg",
  );
  assert.equal(
    SOLANA_GENESIS_HASHES["mainnet-beta"],
    "5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp",
  );
});

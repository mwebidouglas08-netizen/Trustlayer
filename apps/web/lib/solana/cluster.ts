export type SolanaCluster = "localnet" | "devnet" | "testnet" | "mainnet-beta";

export const SOLANA_GENESIS_HASHES: Record<SolanaCluster, string> = {
  localnet: "FyA1GKUaJFGhD9nGvgeNA7KTurYfKUzxgnCpjZR4cTUg",
  devnet: "EtWTRABZaYq6iMfeYKouRu166VU2xqa1wcaWoxPkrZBG",
  testnet: "4uhcVJyU9pJkvQyS88uRDiswHXSCkY3zQawwpjk2NsNY",
  "mainnet-beta": "5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp",
};

export function getSolanaCluster(
  nodeEnv = process.env.NODE_ENV,
): SolanaCluster {
  const cluster = process.env.NEXT_PUBLIC_SOLANA_CLUSTER || "devnet";

  if (
    cluster !== "devnet" &&
    cluster !== "testnet" &&
    cluster !== "mainnet-beta" &&
    cluster !== "localnet"
  ) {
    throw new Error("Invalid Solana cluster configuration.");
  }

  if (cluster === "localnet" && nodeEnv !== "development") {
    throw new Error("Localnet is only permitted in development.");
  }

  return cluster;
}

export function explorer(
  address: string,
  type: "address" | "tx" = "address",
  nodeEnv = process.env.NODE_ENV,
) {
  const cluster = getSolanaCluster(nodeEnv);

  const base = `https://explorer.solana.com/${type}/${encodeURIComponent(address)}`;

  if (cluster === "localnet") {
    return `${base}?cluster=custom&customUrl=${encodeURIComponent("http://127.0.0.1:8899")}`;
  }

  return `${base}?cluster=${cluster}`;
}

/** Fail closed; network identity comes from the RPC, never the wallet UI. */
export function assertRpcCluster(
  cluster: SolanaCluster,
  genesis: string,
): void {
  if (genesis === SOLANA_GENESIS_HASHES[cluster]) return;
  const observed =
    Object.entries(SOLANA_GENESIS_HASHES).find(
      ([, hash]) => hash === genesis,
    )?.[0] || "an unrecognized network";
  throw new Error(
    `RPC network mismatch: this app expects ${cluster}, but its server RPC reports ${observed}. ` +
      "Signing is disabled. The deployment operator must align SOLANA_RPC_URL with " +
      "NEXT_PUBLIC_SOLANA_CLUSTER and rebuild/redeploy. Changing the wallet network alone will not fix this.",
  );
}

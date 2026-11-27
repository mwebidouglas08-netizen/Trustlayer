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

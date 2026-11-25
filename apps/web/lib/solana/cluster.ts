export function getSolanaCluster(): "devnet" | "testnet" | "mainnet-beta" {
  const cluster = process.env.NEXT_PUBLIC_SOLANA_CLUSTER || "devnet";
  if (
    cluster !== "devnet" &&
    cluster !== "testnet" &&
    cluster !== "mainnet-beta"
  )
    throw new Error("Invalid Solana cluster configuration.");
  return cluster;
}
export function explorer(address: string, type: "address" | "tx" = "address") {
  return `https://explorer.solana.com/${type}/${encodeURIComponent(address)}?cluster=${getSolanaCluster()}`;
}

export const STATES = [
  "Awaiting funding",
  "Funded",
  "Delivery submitted",
  "In dispute",
  "Released",
  "Resolved to seller",
  "Refunded",
  "Cancelled",
] as const;
export const U64_MAX = 18446744073709551615n;
export function parseAmount(value: string): bigint {
  if (!/^(0|[1-9]\d*)(\.\d{1,6})?$/.test(value))
    throw new Error("Enter a positive USDC amount with at most 6 decimals.");
  const [whole, decimals = ""] = value.split(".");
  const amount = BigInt(whole) * 1000000n + BigInt(decimals.padEnd(6, "0"));
  if (amount <= 0n || amount > U64_MAX)
    throw new Error("Amount must be positive and fit in an on-chain u64.");
  return amount;
}
export function formatAmount(amount: bigint | string): string {
  const n = BigInt(amount);
  const fraction = (n % 1000000n)
    .toString()
    .padStart(6, "0")
    .replace(/0+$/, "");
  return `${(n / 1000000n).toLocaleString("en-US")}${fraction ? `.${fraction}` : ".00"}`;
}
export function feeAmount(amount: bigint, bps: number): bigint {
  if (!Number.isInteger(bps) || bps < 0 || bps > 100)
    throw new Error("Invalid fee configuration.");
  return (amount * BigInt(bps)) / 10000n;
}
export type Action =
  | "fundEscrow"
  | "releaseToSeller"
  | "markDeliverySubmitted"
  | "openDispute"
  | "cancelUnfunded"
  | "resolveDisputeRefundBuyer"
  | "resolveDisputePaySeller";
export function actionsFor(
  state: number,
  role: "buyer" | "seller" | "arbitrator" | "visitor",
  expired: boolean,
  paused: boolean,
): Action[] {
  if (state === 0 && (role === "buyer" || role === "seller"))
    return role === "buyer" && !expired && !paused
      ? ["fundEscrow", "cancelUnfunded"]
      : ["cancelUnfunded"];
  if (state === 1 || state === 2) {
    if (role === "buyer") return ["releaseToSeller", "openDispute"];
    if (role === "seller")
      return [
        ...(state === 1 ? ["markDeliverySubmitted" as const] : []),
        ...(expired ? ["openDispute" as const] : []),
      ];
  }
  if (state === 3 && role === "arbitrator")
    return ["resolveDisputeRefundBuyer", "resolveDisputePaySeller"];
  return [];
}
export function shortAddress(address: string): string {
  return `${address.slice(0, 4)}…${address.slice(-4)}`;
}
export function agreementText(
  seller: string,
  amount: string,
  deadline: number,
  terms: string,
): string {
  return JSON.stringify({
    version: 1,
    seller,
    amountBaseUnits: amount,
    deadlineUnix: deadline,
    terms: terms.trim(),
  });
}

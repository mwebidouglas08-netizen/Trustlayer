export function decodeClockTimestamp(data: Uint8Array): number {
  if (data.byteLength < 40)
    throw new Error("Solana Clock sysvar is unavailable or truncated.");
  const timestamp = Number(
    new DataView(data.buffer, data.byteOffset, data.byteLength).getBigInt64(
      32,
      true,
    ),
  );
  if (!Number.isSafeInteger(timestamp) || timestamp <= 0)
    throw new Error("Solana Clock timestamp is invalid.");
  return timestamp;
}
export function assertFutureDeadline(
  deadline: number,
  chainTime: number,
): void {
  if (!Number.isSafeInteger(deadline) || deadline <= chainTime)
    throw new Error(
      "The escrow deadline has passed according to Solana's clock. Funding is not allowed. Cancel the unfunded escrow and create a new agreement with an agreed future deadline.",
    );
}

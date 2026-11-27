import type { Agreement } from "./workspace";
import { agreementText, formatAmount } from "./protocol";
export function acceptedEscrowTerms(row: Agreement, userId: string) {
  if (row.creator_id !== userId)
    throw new Error("Only the agreement creator can create its buyer escrow.");
  if (row.status !== "accepted")
    throw new Error(
      "The seller must accept the proposal before creating escrow.",
    );
  const deadline = Date.parse(row.deadline) / 1000;
  if (!Number.isSafeInteger(deadline))
    throw new Error("Agreement deadline must use whole seconds.");
  return {
    seller: row.seller_wallet,
    amount: formatAmount(row.amount_text).replaceAll(",", ""),
    deadline,
    terms: row.terms,
    canonical: agreementText(
      row.seller_wallet,
      row.amount_text,
      deadline,
      row.terms,
    ),
  };
}
export function localDeadlineInput(seconds: number): string {
  const date = new Date(seconds * 1000);
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 19);
}

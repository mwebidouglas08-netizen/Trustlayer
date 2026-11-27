import { test } from "node:test";
import assert from "node:assert/strict";
import {
  acceptedEscrowTerms,
  localDeadlineInput,
} from "../lib/accepted-agreement";
import { agreementText, parseAmount } from "../lib/protocol";
import type { Agreement } from "../lib/workspace";
const row: Agreement = {
  id: "agreement",
  creator_id: "buyer-account",
  seller_wallet: "seller-wallet",
  title: "Delivery",
  amount_text: "1234567890",
  deadline: "2030-01-01T12:34:56Z",
  terms: "Accepted exact terms",
  status: "accepted",
  accepted_by: "seller-account",
  accepted_at: "2029-12-01T00:00:00Z",
  created_at: "2029-11-01T00:00:00Z",
  updated_at: "2029-12-01T00:00:00Z",
};
test("accepted agreement preserves exact amount, seller, deadline and hashed terms", () => {
  const terms = acceptedEscrowTerms(row, "buyer-account");
  assert.equal(parseAmount(terms.amount).toString(), row.amount_text);
  assert.equal(terms.seller, row.seller_wallet);
  assert.equal(
    terms.canonical,
    agreementText(
      row.seller_wallet,
      row.amount_text,
      Date.parse(row.deadline) / 1000,
      row.terms,
    ),
  );
  assert.equal(
    Date.parse(localDeadlineInput(terms.deadline)) / 1000,
    terms.deadline,
  );
});
test("only creator's accepted agreements can enter buyer escrow flow", () => {
  assert.throws(
    () => acceptedEscrowTerms(row, "seller-account"),
    /Only the agreement creator/,
  );
  for (const status of ["draft", "proposed", "cancelled"] as const)
    assert.throws(
      () => acceptedEscrowTerms({ ...row, status }, "buyer-account"),
      /must accept/,
    );
  assert.throws(
    () => acceptedEscrowTerms({ ...row, deadline: "invalid" }, "buyer-account"),
    /whole seconds/,
  );
});

import { test } from "node:test";
import assert from "node:assert/strict";
import {
  actionsFor,
  agreementText,
  feeAmount,
  formatAmount,
  parseAmount,
  U64_MAX,
} from "../lib/protocol";
test("amounts preserve six-decimal precision without floating point", () => {
  assert.equal(parseAmount("0.000001"), 1n);
  assert.equal(parseAmount("123.456789"), 123456789n);
  assert.equal(parseAmount("18446744073709.551615"), U64_MAX);
  assert.equal(formatAmount(123456789n), "123.456789");
});
test("invalid, negative, overflowing, exponent and overprecision values are rejected", () => {
  for (const value of [
    "",
    "0",
    "-1",
    "1e6",
    "01",
    "1.0000001",
    "18446744073709.551616",
    "NaN",
    " 1",
    ".1",
  ])
    assert.throws(() => parseAmount(value));
});
test("fees stay exact at u64 maximum and enforce program cap", () => {
  assert.equal(feeAmount(U64_MAX, 100), U64_MAX / 100n);
  assert.equal(feeAmount(99n, 100), 0n);
  assert.throws(() => feeAmount(100n, 101));
});
test("paused and expired escrows cannot be funded but exits remain available", () => {
  assert.deepEqual(actionsFor(0, "buyer", false, true), ["cancelUnfunded"]);
  assert.deepEqual(actionsFor(0, "buyer", true, false), ["cancelUnfunded"]);
  assert.deepEqual(actionsFor(1, "buyer", false, true), [
    "releaseToSeller",
    "openDispute",
  ]);
});
test("seller escalation only after deadline; terminal and visitor states have no actions", () => {
  assert.deepEqual(actionsFor(2, "seller", false, false), []);
  assert.deepEqual(actionsFor(2, "seller", true, false), ["openDispute"]);
  for (const state of [4, 5, 6, 7])
    assert.deepEqual(actionsFor(state, "buyer", true, false), []);
  assert.deepEqual(actionsFor(1, "visitor", true, false), []);
  assert.deepEqual(actionsFor(3, "arbitrator", true, false), [
    "resolveDisputeRefundBuyer",
    "resolveDisputePaySeller",
  ]);
});
test("agreement serialization is stable and includes all binding terms", () => {
  assert.equal(
    agreementText("seller", "100", 42, " terms "),
    '{"version":1,"seller":"seller","amountBaseUnits":"100","deadlineUnix":42,"terms":"terms"}',
  );
});

import { test } from "node:test";
import assert from "node:assert/strict";
import {
  decodeClockTimestamp,
  assertFutureDeadline,
} from "../lib/solana/clock";

test("Clock uses signed little-endian unix_timestamp at offset 32, including subarrays", () => {
  const buffer = Buffer.alloc(64);
  buffer.writeBigInt64LE(1800000000n, 40);
  assert.equal(decodeClockTimestamp(buffer.subarray(8)), 1800000000);
  assert.throws(() => decodeClockTimestamp(new Uint8Array(39)));
  assert.throws(() => decodeClockTimestamp(new Uint8Array(40)));
});
test("funding deadline matches contract strict inequality, independent of device time", () => {
  assert.doesNotThrow(() => assertFutureDeadline(1800000010, 1800000009));
  assert.throws(
    () => assertFutureDeadline(1800000010, 1800000010),
    /deadline has passed/,
  );
  assert.throws(
    () => assertFutureDeadline(1800000010, 1800000020),
    /Cancel the unfunded escrow/,
  );
});

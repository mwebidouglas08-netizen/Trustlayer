import { test } from "node:test";
import assert from "node:assert/strict";
import { validateSqlEncoding } from "./check-sql-encoding.mjs";

test("SQL encoding accepts plain UTF-8, including non-ASCII comments", () => {
  assert.doesNotThrow(() =>
    validateSqlEncoding(Buffer.from("-- café\nselect 1;"), "fixture.sql"),
  );
});
test("SQL encoding rejects the exact leading-BOM migration failure", () => {
  assert.throws(
    () =>
      validateSqlEncoding(
        Buffer.from("\ufeff-- schema\nselect 1;"),
        "fixture.sql",
      ),
    /BOM/,
  );
});
test("SQL encoding rejects embedded BOM, invalid UTF-8 and NUL", () => {
  for (const bytes of [
    Buffer.from("select 1;\ufeff"),
    Buffer.from([0xff]),
    Buffer.from("select\0"),
  ]) {
    assert.throws(() => validateSqlEncoding(bytes, "fixture.sql"));
  }
});

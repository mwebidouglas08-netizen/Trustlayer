import { test } from "node:test";
import assert from "node:assert/strict";
import { normalizeSignature, validateEvidence } from "../lib/workspace";
test("private evidence input enforces a bounded size, MIME allowlist and filename length", () => {
  assert.doesNotThrow(() =>
    validateEvidence({
      name: "invoice.pdf",
      size: 100,
      type: "application/pdf",
    }),
  );
  for (const file of [
    { name: "empty.txt", size: 0, type: "text/plain" },
    { name: "script.html", size: 10, type: "text/html" },
    { name: "large.pdf", size: 10485761, type: "application/pdf" },
    { name: "x".repeat(181), size: 10, type: "image/png" },
  ])
    assert.throws(() => validateEvidence(file));
});
test("wallet adapters normalize both Phantom and Solflare signatures and reject malformed output", () => {
  const proof = new Uint8Array(64);
  assert.equal(normalizeSignature(proof), proof);
  assert.equal(normalizeSignature({ signature: proof }), proof);
  assert.throws(() => normalizeSignature(new Uint8Array(63)));
});

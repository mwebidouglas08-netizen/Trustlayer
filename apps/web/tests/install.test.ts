import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import manifest from "../app/manifest";

test("install manifest stays same-origin and supplies standard PNG icon sizes", () => {
  const value = manifest();
  assert.equal(value.start_url, "/app");
  assert.equal(value.scope, "/");
  assert.equal(value.display, "standalone");
  for (const icon of value.icons!) {
    const bytes = readFileSync(
      new URL(`../public${icon.src}`, import.meta.url),
    );
    assert.equal(bytes.subarray(1, 4).toString(), "PNG");
    const size = bytes.readUInt32BE(16);
    assert.equal(bytes.readUInt32BE(20), size);
    assert.equal(icon.sizes, `${size}x${size}`);
  }
});
test("service worker never caches private data or fabricates offline success", () => {
  const source = readFileSync(
    new URL("../public/sw.js", import.meta.url),
    "utf8",
  );
  assert.ok(!source.includes("caches."));
  assert.ok(!source.includes("respondWith"));
});

import { test } from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { safeFilename, jsonExport, downloadBlob } from "../lib/download";

test("export filenames cannot contain path separators, controls or bidi overrides", () => {
  assert.equal(
    safeFilename("../../secret\u202efile.json"),
    "_.._secret_file.json",
  );
  assert.equal(safeFilename(""), "trustlayer-export");
  assert.equal(safeFilename("a".repeat(250)).length, 180);
});
test("agreement export preserves exact UTF-8 bytes and SHA256 including whitespace", async () => {
  const text = '{"terms":"Café — Nairobi"}\n';
  const blob = jsonExport(text);
  assert.equal(await blob.text(), text);
  assert.equal(
    createHash("sha256")
      .update(Buffer.from(await blob.arrayBuffer()))
      .digest("hex"),
    createHash("sha256").update(text).digest("hex"),
  );
});
test("download attaches link, removes it and defers URL cleanup for browser consumption", () => {
  const originalDocument = Object.getOwnPropertyDescriptor(
    globalThis,
    "document",
  );
  const create = URL.createObjectURL,
    revoke = URL.revokeObjectURL,
    timer = globalThis.setTimeout;
  const events: string[] = [];
  let cleanup: () => void = () => {};
  const link = {
    href: "",
    download: "",
    rel: "",
    style: { display: "" },
    click() {
      events.push("click");
    },
    remove() {
      events.push("remove");
    },
  };
  try {
    Object.defineProperty(globalThis, "document", {
      configurable: true,
      value: {
        createElement: () => link,
        body: { appendChild: () => events.push("append") },
      },
    });
    URL.createObjectURL = () => "blob:test";
    URL.revokeObjectURL = () => {
      events.push("revoke");
    };
    globalThis.setTimeout = ((fn: () => void, delay: number) => {
      assert.equal(delay, 60000);
      cleanup = fn;
      return 1;
    }) as unknown as typeof setTimeout;
    downloadBlob("terms.json", jsonExport("{}"));
    assert.deepEqual(events, ["append", "click", "remove"]);
    assert.equal(link.download, "terms.json");
    cleanup();
    assert.equal(events.at(-1), "revoke");
  } finally {
    URL.createObjectURL = create;
    URL.revokeObjectURL = revoke;
    globalThis.setTimeout = timer;
    if (originalDocument)
      Object.defineProperty(globalThis, "document", originalDocument);
    else Reflect.deleteProperty(globalThis, "document");
  }
});

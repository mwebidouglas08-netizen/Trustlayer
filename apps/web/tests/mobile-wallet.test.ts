import { test } from "node:test";
import assert from "node:assert/strict";
import {
  isMobileWalletBrowser,
  walletBrowserLinks,
} from "../lib/mobile-wallet";

test("wallet handoffs preserve HTTPS path but never forward auth parameters", () => {
  const links = walletBrowserLinks(
    "https://example.com/app/profile?token=secret#access_token=private",
  );
  assert.equal(
    links.phantom,
    "https://phantom.app/ul/browse/https%3A%2F%2Fexample.com%2Fapp%2Fprofile?ref=https%3A%2F%2Fexample.com",
  );
  assert.ok(links.solflare.startsWith("https://solflare.com/ul/v1/browse/"));
  assert.ok(!JSON.stringify(links).includes("secret"));
  assert.ok(!JSON.stringify(links).includes("private"));
  assert.throws(() => walletBrowserLinks("javascript:alert(1)"));
  assert.throws(() => walletBrowserLinks("http://example.com"));
});
test("mobile detection is a UI hint, not installed-app detection", () => {
  assert.equal(isMobileWalletBrowser("iPhone Safari"), true);
  assert.equal(isMobileWalletBrowser("Android Chrome"), true);
  assert.equal(isMobileWalletBrowser("Windows Chrome"), false);
});

import { test, expect } from "@playwright/test";
test("landing opens honest disconnected workspace without invented balances", async ({
  page,
}, info) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "A good deal",
  );
  await page.getByRole("link", { name: "Enter your workspace" }).click();
  await expect(
    page.getByRole("heading", { name: "Trade with confidence." }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Your wallet. Your workspace." }),
  ).toBeVisible();
  await expect(page.getByText("Preview · no program configured")).toBeVisible();
  await page.screenshot({
    path: `test-results/workspace-${info.project.name}.png`,
    fullPage: true,
  });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBeTruthy();
  expect(errors).toEqual([]);
});
test("missing wallet is an actionable error, not a fake connection", async ({
  page,
}) => {
  await page.goto("/app");
  await page.getByRole("button", { name: "Connect wallet" }).first().click();
  await expect(page.locator(".notice[role=alert]")).toContainText(
    "Install Phantom or Solflare",
  );
});
test("new transaction is gated by real deployment and operator screen does not expose data", async ({
  page,
}) => {
  await page.goto("/app/transactions/new");
  await expect(
    page.getByRole("heading", { name: "Create a protected transaction" }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Sign & create escrow" }),
  ).toHaveCount(0);
  await page.goto("/staff");
  await expect(
    page.getByRole("heading", { name: "Operator console" }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Pause new deposits" }),
  ).toHaveCount(0);
});
test("wallet rejection is surfaced without creating a session", async ({
  page,
}) => {
  await page.addInitScript(() => {
    Object.assign(window, {
      phantom: {
        solana: {
          publicKey: null,
          connect: async () => {
            throw new Error("User rejected the request.");
          },
        },
      },
    });
  });
  await page.goto("/app");
  await page.getByRole("button", { name: "Connect wallet" }).first().click();
  await expect(page.locator(".notice[role=alert]")).toContainText(
    "User rejected",
  );
});
test("mobile navigation works and configuration is visible", async ({
  page,
}, info) => {
  await page.goto("/app");
  if (info.project.name === "mobile")
    await page.getByRole("button", { name: "Open navigation" }).click();
  await page.getByRole("link", { name: "Settings", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Network & settings" }),
  ).toBeVisible();
  await expect(page.getByText("Disabled in this release")).toBeVisible();
});
test("RPC rejects unsupported methods without reaching an upstream", async ({
  request,
}) => {
  const result = await request.post("/api/rpc", {
    data: { jsonrpc: "2.0", id: 1, method: "requestAirdrop", params: [] },
  });
  expect(result.status()).toBe(400);
  const badOrigin = await request.post("/api/rpc", {
    headers: { Origin: "https://attacker.example" },
    data: { jsonrpc: "2.0", id: 1, method: "getHealth" },
  });
  expect(badOrigin.status()).toBe(403);
});

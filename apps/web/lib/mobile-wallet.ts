export function isMobileWalletBrowser(userAgent: string): boolean {
  return /Android|iPhone|iPad|iPod/i.test(userAgent);
}

export function walletBrowserLinks(pageUrl: string) {
  const page = new URL(pageUrl);
  if (page.protocol !== "https:")
    throw new Error("Open the HTTPS production site to use a mobile wallet.");
  // Never forward auth tokens, query parameters or fragments into wallet links.
  page.search = "";
  page.hash = "";
  const target = encodeURIComponent(page.href);
  const origin = encodeURIComponent(page.origin);
  return {
    phantom: `https://phantom.app/ul/browse/${target}?ref=${origin}`,
    solflare: `https://solflare.com/ul/v1/browse/${target}?ref=${origin}`,
  };
}

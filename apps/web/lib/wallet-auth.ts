import { createSignInMessageText } from "@solana/wallet-standard-util";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { BrowserWallet } from "./escrow";
import { normalizeSignature } from "./workspace";

export async function signInWithWallet(
  client: SupabaseClient,
  wallet: Pick<BrowserWallet, "publicKey" | "signMessage">,
  pageUrl: string,
) {
  const publicKey = wallet.publicKey;
  if (!publicKey || !wallet.signMessage)
    throw new Error("Connect a wallet with message-signing support first.");
  const address = publicKey.toBase58();
  const url = new URL("/app/profile", pageUrl);
  const issuedAt = new Date();
  const message = createSignInMessageText({
    domain: url.host,
    address,
    uri: url.href,
    version: "1",
    statement:
      "Sign in to Trustlayer. This signature creates an account session, not a payment.",
    nonce: crypto.randomUUID().replaceAll("-", ""),
    issuedAt: issuedAt.toISOString(),
    expirationTime: new Date(issuedAt.getTime() + 300000).toISOString(),
  });
  if (wallet.publicKey?.toBase58() !== address)
    throw new Error("Wallet account changed. Reconnect before signing in.");
  const signature = normalizeSignature(
    await wallet.signMessage(new TextEncoder().encode(message), "utf8"),
  );
  if (wallet.publicKey?.toBase58() !== address)
    throw new Error("Wallet account changed while signing. Please retry.");
  // Submit exactly the bytes the wallet approved; bypass only the SDK formatter,
  // never Supabase's server-side signature/domain/expiry verification.
  const result = await client.auth.signInWithWeb3({
    chain: "solana",
    message,
    signature,
  });
  if (result.error) {
    const code = result.error.code || "auth_error";
    throw new Error(`Solana sign-in failed (${code}): ${result.error.message}`);
  }
  if (!result.data.session || !result.data.user)
    throw new Error("Sign-in did not return a session. Please retry.");
  return result.data.session;
}

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
  const result = await client.auth.signInWithWeb3({
    chain: "solana",
    wallet: {
      publicKey,
      signMessage: async (bytes) => {
        if (wallet.publicKey?.toBase58() !== address)
          throw new Error(
            "Wallet account changed. Reconnect before signing in.",
          );
        const proof = normalizeSignature(
          await wallet.signMessage!(bytes, "utf8"),
        );
        if (wallet.publicKey?.toBase58() !== address)
          throw new Error(
            "Wallet account changed while signing. Please retry.",
          );
        return proof;
      },
    },
    statement:
      "Sign in to Trustlayer. This signature creates an account session, not a payment.",
    options: {
      url: url.href,
      signInWithSolana: {
        nonce: crypto.randomUUID().replaceAll("-", ""),
        expirationTime: new Date(Date.now() + 300000).toISOString(),
      },
    },
  });
  if (result.error) {
    const code = result.error.code || "auth_error";
    throw new Error(`Solana sign-in failed (${code}): ${result.error.message}`);
  }
  if (!result.data.session || !result.data.user)
    throw new Error("Sign-in did not return a session. Please retry.");
  return result.data.session;
}

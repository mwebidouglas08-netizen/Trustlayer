"use client";
import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import {
  ArrowUpRight,
  Fingerprint,
  ShieldCheck,
  UserRound,
  Wallet,
} from "lucide-react";
import { PageHeading } from "./Dashboard";
import { useAccount } from "./AccountProvider";
import { useDapp } from "./DappProvider";
import { backend } from "@/lib/supabase/client";
import { availableWallets } from "@/lib/escrow";
import { normalizeSignature } from "@/lib/workspace";
export function AccountGate() {
  const { loading, authError } = useAccount();
  return (
    <div className="empty-state">
      <span className="empty-icon">
        <Fingerprint size={28} />
      </span>
      <h2>
        {loading
          ? "Restoring your secure session…"
          : "A workspace that stays with you."}
      </h2>
      <p>
        {authError ||
          "Sign in with a wallet signature to save agreements, invite counterparties, and share files privately. Connecting a wallet alone does not sign you in."}
      </p>
      {!loading && (
        <Link href="/app/profile" className="btn primary">
          Sign in to your account <ArrowUpRight size={16} />
        </Link>
      )}
    </div>
  );
}
export function AccountPage() {
  const a = useAccount();
  const d = useDapp();
  const [name, setName] = useState("");
  const [business, setBusiness] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [walletChoice, setWalletChoice] = useState("");
  const [walletNames, setWalletNames] = useState<string[]>([]);
  useEffect(() => {
    setWalletNames(availableWallets().map((w) => w.name));
  }, []);
  const [wallets, setWallets] = useState<
    { public_key: string; verified_at: string }[]
  >([]);
  useEffect(() => {
    let active = true;
    setName("");
    setBusiness("");
    setWallets([]);
    if (a.session) {
      void Promise.all([
        backend()
          .from("profiles")
          .select("display_name,business_name")
          .eq("id", a.session.user.id)
          .single(),
        backend().from("wallets").select("public_key,verified_at"),
      ]).then(([profile, links]) => {
        if (!active) return;
        if (profile.error || links.error) {
          setError(
            profile.error?.message ||
              links.error?.message ||
              "Unable to load profile",
          );
          return;
        }
        setName(profile.data?.display_name || "");
        setBusiness(profile.data?.business_name || "");
        setWallets(links.data || []);
      });
    }
    return () => {
      active = false;
    };
  }, [a.session]);
  async function run(task: () => Promise<void>) {
    setBusy(true);
    setError("");
    setMessage("");
    try {
      await task();
    } catch (e) {
      setError(
        e && typeof e === "object" && "message" in e
          ? String(e.message)
          : "Request failed. Please retry.",
      );
    } finally {
      setBusy(false);
    }
  }
  async function signIn() {
    if (!d.wallet?.publicKey || !d.wallet.signMessage)
      throw new Error(
        "Connect Phantom or Solflare with message-signing support first.",
      );
    const signer = d.wallet;
    const result = await backend().auth.signInWithWeb3({
      chain: "solana",
      wallet: {
        publicKey: signer.publicKey!,
        signMessage: async (bytes) =>
          normalizeSignature(await signer.signMessage!(bytes, "utf8")),
      },
      statement:
        "Sign in to Trustlayer. This signature creates an account session, not a payment.",
      options: {
        signInWithSolana: {
          nonce: crypto.randomUUID().replaceAll("-", ""),
          expirationTime: new Date(Date.now() + 300000).toISOString(),
        },
      },
    });
    if (result.error) throw result.error;
    setMessage(
      "Signed in securely. Verify your wallet below to receive private invitations.",
    );
  }
  async function linkWallet() {
    if (!a.session || !d.wallet?.publicKey || !d.wallet.signMessage)
      throw new Error("Sign in and connect a message-signing wallet first.");
    const signer = d.wallet;
    const { data, error } = await backend().rpc("issue_wallet_challenge", {
      p_key: signer.publicKey!.toBase58(),
    });
    if (error) throw error;
    const challenge = data?.[0];
    if (!challenge) throw new Error("No challenge returned.");
    const proof = normalizeSignature(
      await signer.signMessage!(
        new TextEncoder().encode(challenge.message),
        "utf8",
      ),
    );
    const { data: verified, error: verifyError } =
      await backend().functions.invoke("trustlayer-verify-wallet", {
        body: {
          challengeId: challenge.id,
          signature: btoa(String.fromCharCode(...proof)),
        },
      });
    if (verifyError) {
      let detail =
        "Wallet verification failed. The proof may have expired or the wallet may belong to another account.";
      try {
        const response = await verifyError.context?.json();
        if (response?.error) detail = response.error;
      } catch {}
      throw new Error(detail);
    }
    if (!verified?.verified) throw new Error("Verification was not confirmed.");
    const links = await backend()
      .from("wallets")
      .select("public_key,verified_at");
    if (links.error) throw links.error;
    setWallets(links.data || []);
    setMessage(
      "Wallet ownership verified by the backend. Private invitations for this address are now available.",
    );
  }
  function save(event: FormEvent) {
    event.preventDefault();
    void run(async () => {
      const { error } = await backend()
        .from("profiles")
        .update({
          display_name: name.trim(),
          business_name: business.trim() || null,
        })
        .eq("id", a.session!.user.id);
      if (error) throw error;
      setMessage("Profile saved to your account.");
    });
  }
  return (
    <>
      <PageHeading
        eyebrow="YOUR IDENTITY, YOUR CONTROL"
        title={a.session ? "Account & identity" : "Welcome to your workspace."}
        description="A signed wallet session. Private agreements. No seed phrases or passwords to share."
      />
      {error && (
        <div role="alert" className="notice danger">
          {error}
        </div>
      )}
      {message && (
        <div role="status" className="notice">
          {message}
        </div>
      )}
      {a.loading ? (
        <section className="panel">
          <AccountGate />
        </section>
      ) : !a.session ? (
        <div className="identity-grid">
          <section className="panel identity-card">
            <span className="identity-symbol">
              <Fingerprint size={36} />
            </span>
            <span className="eyebrow">SIGN IN SECURELY</span>
            <h2>
              Your signature.
              <br />
              Your workspace.
            </h2>
            <p>
              Connect your wallet, then sign a one-time login message. Supabase
              verifies the signature and creates your private account session.
            </p>
            <div className="action-stack">
              {!d.address && walletNames.length > 1 && (
                <label>
                  Choose your wallet
                  <select
                    value={walletChoice}
                    onChange={(e) => setWalletChoice(e.target.value)}
                  >
                    <option value="">Select a wallet</option>
                    {walletNames.map((name) => (
                      <option key={name} value={name}>
                        {name}
                      </option>
                    ))}
                  </select>
                </label>
              )}
              {!d.address ? (
                <button
                  className="btn primary"
                  disabled={d.busy || (walletNames.length > 1 && !walletChoice)}
                  onClick={() => void d.connect(walletChoice || undefined)}
                >
                  <Wallet size={17} />
                  Connect wallet
                </button>
              ) : (
                <button
                  className="btn primary"
                  disabled={busy}
                  onClick={() => void run(signIn)}
                >
                  <Fingerprint size={17} />
                  {busy ? "Waiting for signature…" : "Sign in with Solana"}
                </button>
              )}
              <small>
                Signing in does not authorize token transfers or escrow
                creation.
              </small>
            </div>
            <p className="muted">
              By continuing, review our{" "}
              <Link className="text-link" href="/terms">
                terms
              </Link>{" "}
              and{" "}
              <Link className="text-link" href="/privacy">
                privacy notice
              </Link>
              . Use the same wallet to return to this account.
            </p>
          </section>
          <section className="identity-story">
            <span className="eyebrow">MORE THAN A WALLET CONNECTION</span>
            <h2>
              A clear record.
              <br />A confident next step.
            </h2>
            <ul>
              <li>
                <ShieldCheck />
                <div>
                  <strong>Private by default</strong>
                  <p>
                    Only you and the verified counterparty can read shared
                    agreements.
                  </p>
                </div>
              </li>
              <li>
                <Fingerprint />
                <div>
                  <strong>Ownership, verified</strong>
                  <p>
                    Wallet links use expiring, single-use cryptographic
                    challenges.
                  </p>
                </div>
              </li>
              <li>
                <UserRound />
                <div>
                  <strong>Continuity across devices</strong>
                  <p>
                    Agreements and attachments are stored in your Supabase
                    workspace.
                  </p>
                </div>
              </li>
            </ul>
            <div className="notice">
              Payments are a separate system. Escrow funding stays disabled
              until the Solana program is deployed and verified.
            </div>
          </section>
        </div>
      ) : (
        <div className="detail-grid">
          <section className="panel form-panel">
            <h2>Profile</h2>
            <form className="form-stack" onSubmit={save}>
              <label>
                Display name
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  minLength={2}
                  maxLength={80}
                />
              </label>
              <label>
                Business name <small>Optional</small>
                <input
                  value={business}
                  onChange={(e) => setBusiness(e.target.value)}
                  maxLength={160}
                />
              </label>
              <button className="btn primary" disabled={busy}>
                Save profile
              </button>
            </form>
            <hr />
            <p className="muted break-address">
              Account ID: {a.session.user.id}
            </p>
            <button
              className="btn secondary"
              disabled={busy}
              onClick={() => void run(a.signOut)}
            >
              Sign out of this device
            </button>
          </section>
          <section className="panel form-panel">
            <h2>Verified wallets</h2>
            <p className="muted">
              Link the connected wallet with a separate verification signature.
              Never sign a message you don’t recognize.
            </p>
            {wallets.map((w) => (
              <div className="verified-wallet" key={w.public_key}>
                <ShieldCheck size={17} />
                <div>
                  <strong className="break-address">{w.public_key}</strong>
                  <small>
                    Verified {new Date(w.verified_at).toLocaleDateString()}
                  </small>
                </div>
              </div>
            ))}
            <div className="action-stack">
              {!d.address ? (
                <button
                  className="btn secondary"
                  onClick={() => void d.connect()}
                >
                  Connect wallet
                </button>
              ) : (
                <button
                  className="btn primary"
                  disabled={busy}
                  onClick={() => void run(linkWallet)}
                >
                  {busy ? "Verifying…" : "Verify connected wallet"}
                </button>
              )}
              <Link className="text-link" href="/app/agreements">
                Open saved agreements <ArrowUpRight size={15} />
              </Link>
            </div>
            <p className="muted">
              Wallet connection and account sign-in are separate. Signing out
              does not cancel escrow or disconnect your extension.
            </p>
          </section>
        </div>
      )}
    </>
  );
}

"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { backend } from "@/lib/supabase/client";
import { Agreement, AGREEMENT_FIELDS } from "@/lib/workspace";
import { acceptedEscrowTerms } from "@/lib/accepted-agreement";
import { useAccount } from "./AccountProvider";
import { AccountGate } from "./AccountPage";
import { useDapp, ConnectionGate } from "./DappProvider";
import { NewTransaction } from "./TransactionFlow";

export function AgreementEscrow({ id }: { id: string }) {
  const { session } = useAccount();
  const d = useDapp();
  const [row, setRow] = useState<Agreement | null>(null);
  const [matches, setMatches] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    let active = true;
    setRow(null);
    setMatches([]);
    setError("");
    setLoading(true);
    if (!session || !d.client || !d.address) return;
    const userId = session.user.id;
    const client = d.client;
    const address = d.address;
    void (async () => {
      const { data, error } = await backend()
        .from("agreements")
        .select(AGREEMENT_FIELDS)
        .eq("id", id)
        .single();
      if (error)
        throw new Error(
          "Unable to read this agreement with your signed-in account.",
        );
      const terms = acceptedEscrowTerms(data, userId);
      const wallet = await backend()
        .from("wallets")
        .select("public_key")
        .eq("user_id", userId)
        .eq("public_key", address)
        .not("verified_at", "is", null)
        .maybeSingle();
      if (wallet.error || !wallet.data)
        throw new Error(
          "Verify this buyer wallet in Profile before creating escrow from this agreement.",
        );
      const hash = Array.from(
        new Uint8Array(
          await crypto.subtle.digest(
            "SHA-256",
            new TextEncoder().encode(terms.canonical),
          ),
        ),
      )
        .map((v) => v.toString(16).padStart(2, "0"))
        .join("");
      const escrows = await client.list();
      const found = escrows.filter(
        (e) =>
          e.buyer === address && e.seller === terms.seller && e.hash === hash,
      );
      if (active) {
        setRow(data);
        setMatches(found.map((e) => e.address));
      }
    })()
      .catch((e) => {
        if (active)
          setError(
            e instanceof Error ? e.message : "Unable to prepare escrow.",
          );
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [id, session, d.client, d.address, retry]);
  if (!session) return <AccountGate />;
  if (!d.client) return <ConnectionGate />;
  if (loading)
    return (
      <p role="status">
        Checking accepted terms and existing on-chain escrows…
      </p>
    );
  if (error)
    return (
      <section className="panel">
        <p role="alert">{error}</p>
        <Link href="/app/profile">Open Profile</Link>
        <button className="btn" onClick={() => setRetry((v) => v + 1)}>
          Retry
        </button>
      </section>
    );
  if (matches.length)
    return (
      <section className="panel">
        <h2>Matching on-chain escrow</h2>
        <p>
          Review the existing escrow before creating another. Funding is
          available to its buyer while it remains unfunded and before the
          deadline.
        </p>
        {matches.map((address) => (
          <p key={address}>
            <Link className="btn primary" href={`/app/transactions/${address}`}>
              Open escrow · {address.slice(0, 8)}
            </Link>
          </p>
        ))}
      </section>
    );
  return row ? (
    <NewTransaction key={`${row.id}:${d.address}`} acceptedAgreement={row} />
  ) : null;
}

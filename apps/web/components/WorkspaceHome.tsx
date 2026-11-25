"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import {
  ArrowUpRight,
  CheckCheck,
  FileText,
  Plus,
  ShieldCheck,
} from "lucide-react";
import { backend } from "@/lib/supabase/client";
import { Agreement, AGREEMENT_FIELDS } from "@/lib/workspace";
import { formatAmount } from "@/lib/protocol";
import { useAccount } from "./AccountProvider";
import { AccountGate } from "./AccountPage";
import { AgreementStatus } from "./AgreementWorkspace";
import { BackendStatus } from "./BackendStatus";
import { PageHeading } from "./Dashboard";
export function WorkspaceHome() {
  const { session } = useAccount();
  const [rows, setRows] = useState<Agreement[]>([]);
  const [counts, setCounts] = useState<{
    all: number;
    proposed: number;
    accepted: number;
  } | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    let active = true;
    setRows([]);
    setCounts(null);
    setError("");
    if (!session) {
      setLoading(false);
      return;
    }
    setLoading(true);
    void Promise.all([
      backend()
        .from("agreements")
        .select(AGREEMENT_FIELDS, { count: "exact" })
        .order("created_at", { ascending: false })
        .limit(5),
      backend()
        .from("agreements")
        .select("id", { head: true, count: "exact" })
        .eq("status", "proposed"),
      backend()
        .from("agreements")
        .select("id", { head: true, count: "exact" })
        .eq("status", "accepted"),
    ]).then(([all, proposed, accepted]) => {
      if (!active) return;
      setLoading(false);
      const issue = all.error || proposed.error || accepted.error;
      if (issue) {
        setError(issue.message);
        return;
      }
      setRows((all.data || []) as Agreement[]);
      setCounts({
        all: all.count || 0,
        proposed: proposed.count || 0,
        accepted: accepted.count || 0,
      });
    });
    return () => {
      active = false;
    };
  }, [session]);
  return (
    <>
      <PageHeading
        eyebrow="YOUR TRUSTLAYER WORKSPACE"
        title="Trade with confidence."
        description="Clear agreements. Verified counterparties. A record you can return to."
      />
      <section className="workspace-welcome">
        <div>
          <span className="eyebrow">A SHARED UNDERSTANDING STARTS HERE</span>
          <h2>
            Your next agreement.
            <br />
            <em>Built on clarity.</em>
          </h2>
          <p>
            Save the details, invite your counterparty, and keep every document
            in one private workspace.
          </p>
          <div className="button-row">
            <Link
              className="btn primary"
              href={session ? "/app/agreements/new" : "/app/profile"}
            >
              {session ? "Create an agreement" : "Set up your workspace"}
              <ArrowUpRight size={16} />
            </Link>
            <Link className="text-link" href="/app/agreements">
              Browse agreements ↗
            </Link>
          </div>
        </div>
        <div className="welcome-seal" aria-hidden="true">
          <ShieldCheck size={54} strokeWidth={1} />
          <span>CLARITY · CONTROL · CONFIDENCE</span>
        </div>
      </section>
      <BackendStatus />
      {error && (
        <div role="alert" className="notice danger">
          {error}
        </div>
      )}
      <div className="workspace-metrics">
        {[
          {
            title: "Saved agreements",
            value: counts?.all,
            caption: "Private records in your account",
            icon: FileText,
          },
          {
            title: "Awaiting acceptance",
            value: counts?.proposed,
            caption: "Proposals shared with a counterparty",
            icon: ShieldCheck,
          },
          {
            title: "Terms accepted",
            value: counts?.accepted,
            caption: "Agreements accepted—not funded",
            icon: CheckCheck,
          },
        ].map(({ title, value, caption, icon: Icon }) => (
          <section className="stat-card" key={title}>
            <div className="metric-title">
              <span className="stat-icon">
                <Icon size={19} />
              </span>
              <p>{title}</p>
            </div>
            <h2>{value ?? "—"}</h2>
            <small>{session ? caption : "Sign in to load your records"}</small>
          </section>
        ))}
      </div>
      <div className="dashboard-columns">
        <section className="panel">
          <div className="panel-heading">
            <div>
              <h2>Recent agreements</h2>
              <p>The details behind your next deal.</p>
            </div>
            <Link className="text-link" href="/app/agreements">
              View all <ArrowUpRight size={14} />
            </Link>
          </div>
          {!session ? (
            <AccountGate />
          ) : loading ? (
            <div className="empty-state" role="status">
              Loading your saved agreements…
            </div>
          ) : rows.length ? (
            <div className="table-scroll">
              <table>
                <thead>
                  <tr>
                    <th>Agreement</th>
                    <th>Amount</th>
                    <th>Stage</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr key={row.id}>
                      <td>
                        <Link
                          className="transaction-cell"
                          href={`/app/agreements/${row.id}`}
                        >
                          <span className="transaction-icon">
                            <FileText size={17} />
                          </span>
                          <span>
                            <strong>{row.title}</strong>
                            <small>
                              {new Date(row.created_at).toLocaleDateString()}
                            </small>
                          </span>
                        </Link>
                      </td>
                      <td>
                        <strong>{formatAmount(row.amount_text)}</strong>
                        <small>USDC · not deposited</small>
                      </td>
                      <td>
                        <AgreementStatus status={row.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="empty-state">
              <span className="empty-icon">
                <FileText size={28} />
              </span>
              <h2>Your next deal deserves a clear agreement.</h2>
              <p>
                Start with a private draft. Set expectations together before
                making any payment.
              </p>
              <Link className="btn secondary" href="/app/agreements/new">
                <Plus size={15} />
                Create your first agreement
              </Link>
            </div>
          )}
        </section>
        <aside className="panel how-panel">
          <span className="small-tag">THE TRUSTLAYER WAY</span>
          <h2>
            Good agreements.
            <br />
            Better beginnings.
          </h2>
          <ol>
            <li>
              <span>01</span>
              <div>
                <strong>Put it in writing</strong>
                <p>Define the scope, amount and delivery expectations.</p>
              </div>
            </li>
            <li>
              <span>02</span>
              <div>
                <strong>Know who can see it</strong>
                <p>Share privately with a signature-verified wallet.</p>
              </div>
            </li>
            <li>
              <span>03</span>
              <div>
                <strong>Keep the record</strong>
                <p>Acceptance and attachments stay in your shared workspace.</p>
              </div>
            </li>
          </ol>
          <Link className="text-link" href="/app/help">
            How the workspace works <ArrowUpRight size={15} />
          </Link>
        </aside>
      </div>
      <div className="trust-strip">
        <ShieldCheck size={23} />
        <div>
          <strong>Agreement acceptance is not a payment.</strong>
          <p>
            Solana escrow remains unavailable until deployment and security
            verification are complete.
          </p>
        </div>
        <Link href="/app/settings">Check readiness ↗</Link>
      </div>
    </>
  );
}

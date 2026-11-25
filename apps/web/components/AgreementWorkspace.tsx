"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import { PublicKey } from "@solana/web3.js";
import {
  ArrowLeft,
  ArrowUpRight,
  CheckCircle2,
  Copy,
  Download,
  FileText,
  FolderLock,
  Plus,
  RefreshCw,
  Search,
  Upload,
} from "lucide-react";
import { useAccount } from "./AccountProvider";
import { AccountGate } from "./AccountPage";
import { PageHeading } from "./Dashboard";
import { backend } from "@/lib/supabase/client";
import {
  Agreement,
  AgreementEvent,
  AgreementFile,
  AGREEMENT_FIELDS,
  validateEvidence,
} from "@/lib/workspace";
import { formatAmount, parseAmount, shortAddress } from "@/lib/protocol";
import { BACKEND } from "@/lib/supabase/deployment";
function fail(error: unknown): string {
  return error && typeof error === "object" && "message" in error
    ? String(error.message)
    : "The request could not be completed. Please retry.";
}
export function AgreementStatus({ status }: { status: string }) {
  return (
    <span className={`agreement-status ${status}`}>
      <span />
      {status === "proposed"
        ? "Awaiting acceptance"
        : status === "accepted"
          ? "Terms accepted"
          : status === "cancelled"
            ? "Cancelled"
            : "Private draft"}
    </span>
  );
}
export function AgreementList({
  invitations = false,
}: {
  invitations?: boolean;
}) {
  const { session, loading: authLoading } = useAccount();
  const [rows, setRows] = useState<Agreement[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [reload, setReload] = useState(0);
  useEffect(() => {
    let active = true;
    setRows([]);
    setError("");
    if (!session) {
      setLoading(false);
      return;
    }
    setLoading(true);
    let query = backend()
      .from("agreements")
      .select(AGREEMENT_FIELDS)
      .order("created_at", { ascending: false })
      .range(page * 25, page * 25 + 24);
    if (invitations)
      query = query
        .neq("creator_id", session.user.id)
        .in("status", ["proposed", "accepted"]);
    void query.then(({ data, error }) => {
      if (!active) return;
      setLoading(false);
      if (error) setError(error.message);
      else setRows((data || []) as Agreement[]);
    });
    return () => {
      active = false;
    };
  }, [session, invitations, page, reload]);
  const filtered = rows.filter((a) =>
    `${a.title} ${a.seller_wallet}`
      .toLowerCase()
      .includes(search.toLowerCase()),
  );
  return (
    <>
      <PageHeading
        eyebrow="PRIVATE COLLABORATION · STORED IN SUPABASE"
        title={
          invitations ? "Your invitations" : "Every good deal starts here."
        }
        description={
          invitations
            ? "Proposals addressed to your signature-verified wallets. No email address or public link grants access."
            : "Agree on the details, share supporting files, and keep a clear record—before any payment."
        }
      />
      <div className="workspace-section-nav">
        <div className="section-tabs">
          <Link
            className={!invitations ? "selected" : ""}
            href="/app/agreements"
          >
            All agreements
          </Link>
          <Link
            className={invitations ? "selected" : ""}
            href="/app/invitations"
          >
            Invitations
          </Link>
        </div>
        <Link className="btn primary" href="/app/agreements/new">
          <Plus size={16} />
          New agreement
        </Link>
      </div>
      {error && (
        <div className="notice danger" role="alert">
          {error}
        </div>
      )}
      {!session || authLoading ? (
        <section className="panel">
          <AccountGate />
        </section>
      ) : (
        <section className="panel">
          <div className="table-toolbar">
            <div>
              <h2>
                {invitations ? "Incoming proposals" : "Agreement library"}
              </h2>
              <p className="muted">
                Off-chain records. Acceptance does not fund escrow.
              </p>
            </div>
            <label className="search-field">
              <Search size={16} />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                aria-label="Search saved agreements"
                placeholder="Search this page…"
              />
            </label>
            <button
              className="icon-btn"
              disabled={loading}
              onClick={() => setReload((n) => n + 1)}
              aria-label="Refresh saved agreements"
            >
              <RefreshCw size={17} />
            </button>
          </div>
          {loading ? (
            <div className="empty-state" role="status">
              Loading your private agreements…
            </div>
          ) : filtered.length ? (
            <div className="table-scroll">
              <table>
                <thead>
                  <tr>
                    <th>Agreement</th>
                    <th>Agreed amount</th>
                    <th>Stage</th>
                    <th>Deadline</th>
                    <th aria-label="Details" />
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((a) => (
                    <tr key={a.id}>
                      <td>
                        <Link
                          href={`/app/agreements/${a.id}`}
                          className="transaction-cell"
                        >
                          <span className="transaction-icon">
                            <FileText size={18} />
                          </span>
                          <span>
                            <strong>{a.title}</strong>
                            <small>
                              Seller {shortAddress(a.seller_wallet)}
                            </small>
                          </span>
                        </Link>
                      </td>
                      <td>
                        <strong>{formatAmount(a.amount_text)}</strong>
                        <small>USDC · not a deposit</small>
                      </td>
                      <td>
                        <AgreementStatus status={a.status} />
                      </td>
                      <td>{new Date(a.deadline).toLocaleDateString()}</td>
                      <td>
                        <Link
                          className="icon-btn"
                          href={`/app/agreements/${a.id}`}
                          aria-label={`Open ${a.title}`}
                        >
                          <ArrowUpRight size={17} />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="empty-state">
              <span className="empty-icon">
                <FolderLock size={28} />
              </span>
              <h2>
                {search
                  ? "No matching agreements"
                  : invitations
                    ? "No invitations yet"
                    : "Make your next deal a clear one."}
              </h2>
              <p>
                {invitations
                  ? "Verify your wallet in Account & identity to receive proposals for that address."
                  : "Create a private draft. When the details are ready, send it to your counterparty’s verified wallet."}
              </p>
              <Link
                className="btn secondary"
                href={invitations ? "/app/profile" : "/app/agreements/new"}
              >
                {invitations ? "Verify wallet" : "Create an agreement"}
                <ArrowUpRight size={15} />
              </Link>
            </div>
          )}
          <div className="table-footer pagination">
            <span>Page {page + 1} · up to 25 records per page</span>
            <div className="button-row">
              <button
                className="btn secondary"
                disabled={page === 0 || loading}
                onClick={() => setPage((p) => p - 1)}
              >
                Previous
              </button>
              <button
                className="btn secondary"
                disabled={rows.length < 25 || loading}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </button>
            </div>
          </div>
        </section>
      )}
    </>
  );
}
function decimal(amount: string) {
  const n = BigInt(amount);
  return `${n / 1000000n}.${(n % 1000000n).toString().padStart(6, "0")}`;
}
export function AgreementForm({
  initial,
  onSaved,
}: {
  initial?: Agreement;
  onSaved?: (id: string) => void;
}) {
  const { session } = useAccount();
  const router = useRouter();
  const [title, setTitle] = useState(initial?.title || "");
  const [seller, setSeller] = useState(initial?.seller_wallet || "");
  const [amount, setAmount] = useState(
    initial ? decimal(initial.amount_text) : "",
  );
  const [deadline, setDeadline] = useState(
    initial
      ? new Date(
          new Date(initial.deadline).getTime() -
            new Date(initial.deadline).getTimezoneOffset() * 60000,
        )
          .toISOString()
          .slice(0, 16)
      : "",
  );
  const [terms, setTerms] = useState(initial?.terms || "");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const lock = useRef(false);
  async function save(e: FormEvent) {
    e.preventDefault();
    if (lock.current) return;
    lock.current = true;
    setBusy(true);
    setError("");
    try {
      const key = new PublicKey(seller.trim());
      if (!PublicKey.isOnCurve(key.toBytes()))
        throw new Error(
          "Use the seller’s actual wallet address, not a program account.",
        );
      const value = parseAmount(amount);
      const date = new Date(deadline);
      if (!Number.isFinite(date.getTime()) || date.getTime() <= Date.now())
        throw new Error("Choose a future delivery deadline.");
      if (terms.trim().length < 10)
        throw new Error("Describe the agreement in at least 10 characters.");
      const { data, error } = await backend().rpc("save_agreement", {
        p_title: title,
        p_seller: key.toBase58(),
        p_amount: value.toString(),
        p_deadline: date.toISOString(),
        p_terms: terms,
        p_id: initial?.id || null,
      });
      if (error) throw error;
      if (!data)
        throw new Error("The database did not confirm a saved agreement.");
      if (onSaved) onSaved(data);
      else router.push(`/app/agreements/${data}`);
    } catch (e) {
      setError(fail(e));
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }
  if (!session)
    return (
      <section className="panel">
        <AccountGate />
      </section>
    );
  return (
    <div className="form-grid">
      <section className="panel form-panel">
        <form className="form-stack" onSubmit={save}>
          <label>
            Agreement title
            <input
              required
              minLength={3}
              maxLength={160}
              placeholder="e.g. Website design and development"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </label>
          <label>
            Seller’s Solana wallet
            <input
              required
              placeholder="Confirm this address with your counterparty"
              value={seller}
              onChange={(e) => setSeller(e.target.value)}
              maxLength={44}
            />
            <small>
              Only an account that proves ownership of this wallet can accept
              the proposal.
            </small>
          </label>
          <div className="field-grid">
            <label>
              Agreed amount (USDC)
              <input
                required
                inputMode="decimal"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </label>
            <label>
              Delivery deadline (local time)
              <input
                required
                type="datetime-local"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
              />
            </label>
          </div>
          <label>
            Terms & acceptance criteria
            <textarea
              required
              minLength={10}
              maxLength={10000}
              rows={7}
              placeholder="Define scope, delivery, quality standards, and how both sides will confirm completion."
              value={terms}
              onChange={(e) => setTerms(e.target.value)}
            />
            <small>
              Do not include passwords, seed phrases, or unnecessary personal
              information.
            </small>
          </label>
          {error && (
            <div role="alert" className="notice danger">
              {error}
            </div>
          )}
          <button className="btn primary" disabled={busy}>
            {busy ? "Saving to your account…" : "Save private draft"}
            <ArrowUpRight size={16} />
          </button>
        </form>
      </section>
      <aside className="panel guide-panel">
        <FolderLock size={28} />
        <h2>
          Private now.
          <br />
          Shared when you’re ready.
        </h2>
        <p>
          Your draft is visible only to your signed-in account. Sending the
          proposal shares its terms and attachments with the verified seller.
        </p>
        <hr />
        <ol className="agreement-checklist">
          <li>Save and review your draft.</li>
          <li>Verify your wallet to send it.</li>
          <li>Ask your counterparty to sign in and verify their wallet.</li>
          <li>Receive a locked acceptance record.</li>
        </ol>
        <div className="notice">
          This saves an agreement, not a blockchain transaction. No tokens are
          moved. Payment activation requires the separately deployed escrow
          program.
        </div>
      </aside>
    </div>
  );
}
export function NewAgreement() {
  return (
    <>
      <Link className="back-link" href="/app/agreements">
        <ArrowLeft size={15} />
        All agreements
      </Link>
      <PageHeading
        eyebrow="START WITH CLARITY"
        title="Put the details in writing."
        description="A private draft today. A shared understanding tomorrow."
      />
      <AgreementForm />
    </>
  );
}
export function AgreementDetail({ id }: { id: string }) {
  const { session } = useAccount();
  const [row, setRow] = useState<Agreement | null>(null);
  const [files, setFiles] = useState<AgreementFile[]>([]);
  const [events, setEvents] = useState<AgreementEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [action, setAction] = useState<"propose" | "accept" | "cancel" | null>(
    null,
  );
  const [editing, setEditing] = useState(false);
  const generation = useRef(0);
  const lock = useRef(false);
  const load = useCallback(async () => {
    const current = ++generation.current;
    if (!session) {
      setRow(null);
      setFiles([]);
      setEvents([]);
      return;
    }
    setLoading(true);
    try {
      const [a, f, e] = await Promise.all([
        backend()
          .from("agreements")
          .select(AGREEMENT_FIELDS)
          .eq("id", id)
          .single(),
        backend()
          .from("agreement_files")
          .select("*")
          .eq("agreement_id", id)
          .order("created_at"),
        backend()
          .from("agreement_events")
          .select("*")
          .eq("agreement_id", id)
          .order("created_at", { ascending: false })
          .limit(50),
      ]);
      if (a.error || f.error || e.error) throw a.error || f.error || e.error;
      if (current === generation.current) {
        setRow(a.data as Agreement);
        setFiles(f.data || []);
        setEvents(e.data || []);
      }
    } catch (e) {
      if (current === generation.current) {
        setRow(null);
        setError(fail(e));
      }
    } finally {
      if (current === generation.current) setLoading(false);
    }
  }, [session, id]);
  const invalidate = useCallback(() => {
    generation.current++;
  }, []);
  useEffect(() => {
    setError("");
    setMessage("");
    setRow(null);
    setFiles([]);
    setEvents([]);
    void load();
    return invalidate;
  }, [load, invalidate]);
  async function run(task: () => Promise<void>) {
    if (lock.current) return;
    lock.current = true;
    setBusy(true);
    setError("");
    setMessage("");
    try {
      await task();
      await load();
    } catch (e) {
      setError(fail(e));
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }
  async function act() {
    if (!action) return;
    const { error } = await backend().rpc("agreement_action", {
      p_id: id,
      p_action: action,
    });
    if (error) throw error;
    setMessage(
      action === "accept"
        ? "Your acceptance is saved. No payment was made."
        : action === "propose"
          ? "Proposal sent. The verified seller can now read the agreement and attachments."
          : "The proposal has been cancelled.",
    );
    setAction(null);
  }
  async function upload(file: File) {
    validateEvidence(file);
    const path = `${id}/${session!.user.id}/${crypto.randomUUID()}`;
    const { error } = await backend()
      .storage.from("trustlayer-evidence")
      .upload(path, file, { contentType: file.type, upsert: false });
    if (error) throw error;
    const metadata = await backend().from("agreement_files").insert({
      agreement_id: id,
      storage_path: path,
      filename: file.name,
      byte_size: file.size,
    });
    if (metadata.error)
      throw new Error(
        "The private file uploaded, but its record could not be saved. Contact the operator with this recovery path: " +
          path,
      );
    setMessage("File stored privately and added to the agreement record.");
  }
  async function downloadFile(file: AgreementFile) {
    const { data, error } = await backend()
      .storage.from("trustlayer-evidence")
      .createSignedUrl(file.storage_path, 60, { download: file.filename });
    if (error) throw error;
    if (!data?.signedUrl) throw new Error("No download URL returned.");
    const link = document.createElement("a");
    link.href = data.signedUrl;
    link.rel = "noreferrer";
    link.click();
  }
  if (!session)
    return (
      <section className="panel">
        <AccountGate />
      </section>
    );
  if (loading && !row)
    return (
      <div className="empty-state" role="status">
        Loading your agreement…
      </div>
    );
  if (!row)
    return (
      <section className="panel empty-state">
        <FolderLock size={32} />
        <h2>Agreement unavailable</h2>
        <p>
          {error ||
            "This agreement is private. Sign in to the right account and verify the invited wallet."}
        </p>
        <button className="btn secondary" onClick={() => void load()}>
          Retry
        </button>
        <Link className="text-link" href="/app/profile">
          Account & identity ↗
        </Link>
      </section>
    );
  const owner = row.creator_id === session.user.id;
  return (
    <>
      <Link className="back-link" href="/app/agreements">
        <ArrowLeft size={15} />
        All agreements
      </Link>
      <PageHeading
        eyebrow="PRIVATE AGREEMENT · NOT AN ESCROW DEPOSIT"
        title={row.title}
        description={`Created ${new Date(row.created_at).toLocaleDateString()} · ${owner ? "Your proposal" : "Shared with your verified wallet"}`}
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
      {editing ? (
        <>
          <button className="btn secondary" onClick={() => setEditing(false)}>
            Back to agreement
          </button>
          <AgreementForm
            key={row.updated_at}
            initial={row}
            onSaved={() => {
              setEditing(false);
              void load();
            }}
          />
        </>
      ) : (
        <>
          <div className="detail-grid">
            <section className="panel form-panel">
              <div className="detail-summary">
                <div>
                  <p className="eyebrow">AGREED AMOUNT</p>
                  <h2>
                    {formatAmount(row.amount_text)} <span>USDC</span>
                  </h2>
                </div>
                <AgreementStatus status={row.status} />
              </div>
              <dl className="detail-list">
                <div>
                  <dt>Seller wallet</dt>
                  <dd className="break-address">{row.seller_wallet}</dd>
                </div>
                <div>
                  <dt>Delivery deadline</dt>
                  <dd>{new Date(row.deadline).toLocaleString()}</dd>
                </div>
                <div>
                  <dt>Payment status</dt>
                  <dd>No on-chain funding linked or verified</dd>
                </div>
                {row.accepted_at && (
                  <div>
                    <dt>Terms accepted</dt>
                    <dd>{new Date(row.accepted_at).toLocaleString()}</dd>
                  </div>
                )}
              </dl>
              <h3>Terms & acceptance criteria</h3>
              <pre className="agreement-preview">{row.terms}</pre>
              <div className="button-row">
                <button
                  className="btn secondary"
                  onClick={() =>
                    void navigator.clipboard
                      .writeText(`${BACKEND.siteUrl}/app/agreements/${id}`)
                      .then(() =>
                        setMessage(
                          "Private agreement link copied. The recipient must sign in with the verified seller wallet.",
                        ),
                      )
                      .catch(() =>
                        setError(
                          "Clipboard unavailable. Copy the URL from your browser.",
                        ),
                      )
                  }
                >
                  <Copy size={15} />
                  Copy private link
                </button>
                <button
                  className="btn secondary"
                  onClick={() => {
                    const url = URL.createObjectURL(
                      new Blob([JSON.stringify(row, null, 2)], {
                        type: "application/json",
                      }),
                    );
                    const link = document.createElement("a");
                    link.href = url;
                    link.download = `agreement-${id}.json`;
                    link.click();
                    setTimeout(() => URL.revokeObjectURL(url), 1000);
                  }}
                >
                  <Download size={15} />
                  Export record
                </button>
              </div>
            </section>
            <aside className="panel form-panel">
              <h2>Move forward, deliberately.</h2>
              <p className="muted">
                Sending locks the terms. Acceptance records the verified
                counterparty’s decision, not delivery or payment.
              </p>
              <div className="action-stack">
                {owner && row.status === "draft" && (
                  <>
                    <button
                      className="btn secondary"
                      onClick={() => setEditing(true)}
                    >
                      Edit draft
                    </button>
                    <button
                      className="btn primary"
                      disabled={busy}
                      onClick={() => setAction("propose")}
                    >
                      Send proposal <ArrowUpRight size={15} />
                    </button>
                  </>
                )}
                {!owner && row.status === "proposed" && (
                  <button
                    className="btn primary"
                    disabled={busy}
                    onClick={() => setAction("accept")}
                  >
                    <CheckCircle2 size={16} />
                    Accept these terms
                  </button>
                )}
                {owner && ["draft", "proposed"].includes(row.status) && (
                  <button
                    className="btn secondary"
                    disabled={busy}
                    onClick={() => setAction("cancel")}
                  >
                    Cancel proposal
                  </button>
                )}
                {row.status === "accepted" && (
                  <div className="notice">
                    Terms accepted and locked. Escrow payments are not activated
                    for this deployment.
                  </div>
                )}
              </div>
              {action && (
                <div className="confirm-box">
                  <h3>
                    {action === "propose"
                      ? "Share this proposal?"
                      : action === "accept"
                        ? "Accept these exact terms?"
                        : "Cancel this proposal?"}
                  </h3>
                  <p>
                    {action === "propose"
                      ? "The verified seller will be able to read these terms and all attachments. Terms cannot be edited after sending."
                      : action === "accept"
                        ? "Your acceptance will be permanently recorded for both participants. This does not send tokens or promise an escrow service."
                        : "This cannot be undone. No funds will be moved."}
                  </p>
                  <div className="button-row">
                    <button
                      className="btn secondary"
                      disabled={busy}
                      onClick={() => setAction(null)}
                    >
                      Back
                    </button>
                    <button
                      className="btn primary"
                      disabled={busy}
                      onClick={() => void run(act)}
                    >
                      Confirm
                    </button>
                  </div>
                </div>
              )}
              <hr />
              <h3>Account-backed activity</h3>
              <ul className="timeline">
                {events.map((e) => (
                  <li key={e.id}>
                    <strong>{e.action.replaceAll("_", " ")}</strong>
                    <br />
                    {new Date(e.created_at).toLocaleString()}
                  </li>
                ))}
              </ul>
            </aside>
          </div>
          <section className="panel form-panel agreement-panel">
            <div className="panel-heading attachments-heading">
              <div>
                <h2>
                  <FolderLock size={20} />
                  Private attachments
                </h2>
                <p>
                  PDF, PNG, JPEG or text · 10 MB per file · participant-only
                  access
                </p>
              </div>
              <label className={`btn secondary ${busy ? "disabled" : ""}`}>
                <Upload size={15} />
                Add file
                <input
                  className="sr-only"
                  type="file"
                  disabled={busy}
                  accept=".pdf,.png,.jpg,.jpeg,.txt"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    e.target.value = "";
                    if (file) void run(() => upload(file));
                  }}
                />
              </label>
            </div>
            <p className="muted">
              Share only information needed for this agreement. Files are not
              malware-scanned or independently verified. Shared evidence cannot
              be silently overwritten or deleted; contact the operator for
              retention requests.
            </p>
            {files.length ? (
              <ul className="file-list">
                {files.map((f) => (
                  <li key={f.id}>
                    <FileText size={21} />
                    <div>
                      <strong>{f.filename}</strong>
                      <small>
                        {(f.byte_size / 1024).toFixed(1)} KB ·{" "}
                        {new Date(f.created_at).toLocaleDateString()}
                      </small>
                    </div>
                    <button
                      className="btn secondary"
                      disabled={busy}
                      onClick={() => void run(() => downloadFile(f))}
                    >
                      <Download size={14} />
                      Download
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="empty-state compact">
                <h3>No files shared yet</h3>
                <p>
                  Add specifications, delivery notes, or supporting documents.
                  Downloads use short-lived private links.
                </p>
              </div>
            )}
          </section>
        </>
      )}
    </>
  );
}
export function SavedActivity() {
  const { session } = useAccount();
  const [events, setEvents] = useState<AgreementEvent[]>([]);
  const [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    setEvents([]);
    if (session)
      void backend()
        .from("agreement_events")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(30)
        .then(({ data, error }) => {
          if (active) {
            setEvents(data || []);
            setError(error?.message || "");
          }
        });
    return () => {
      active = false;
    };
  }, [session]);
  return (
    <section className="panel form-panel agreement-panel">
      <h2>Saved workspace activity</h2>
      <p className="muted">
        Persistent records for agreements you can access. Separate from wallet
        transaction receipts.
      </p>
      {error && <div className="notice danger">{error}</div>}
      {!session ? (
        <AccountGate />
      ) : events.length ? (
        <ul className="activity-list">
          {events.map((e) => (
            <li key={e.id}>
              <CheckCircle2 size={17} />
              <div>
                <Link
                  className="text-link"
                  href={`/app/agreements/${e.agreement_id}`}
                >
                  {e.action.replaceAll("_", " ")} ↗
                </Link>
                <p className="muted">
                  {new Date(e.created_at).toLocaleString()}
                </p>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="muted">No saved activity yet.</p>
      )}
    </section>
  );
}

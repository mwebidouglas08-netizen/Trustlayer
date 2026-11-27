"use client";
import Link from "next/link";
import { FormEvent, useCallback, useEffect, useState } from "react";
import {
  ArrowLeft,
  ArrowUpRight,
  CheckCircle2,
  Copy,
  Download,
  FileCheck2,
  ShieldCheck,
} from "lucide-react";
import { useDapp, ConnectionGate, Receipt } from "./DappProvider";
import { PageHeading, Status } from "./Dashboard";
import {
  Action,
  actionsFor,
  agreementText,
  feeAmount,
  formatAmount,
  parseAmount,
} from "@/lib/protocol";
import { Escrow } from "@/lib/escrow";
import { explorer, getSolanaCluster } from "@/lib/solana/cluster";
import { useAccount } from "./AccountProvider";
import {
  enqueueTransactionSync,
  flushPendingTransactionSync,
  SyncAction,
} from "@/lib/transaction-sync";

function useTransactionSyncRetry() {
  const { session } = useAccount();
  const accessToken = session?.access_token;

  useEffect(() => {
    if (!accessToken) return;

    const retry = () => {
      void flushPendingTransactionSync();
    };

    retry();
    window.addEventListener("focus", retry);
    window.addEventListener("online", retry);

    return () => {
      window.removeEventListener("focus", retry);
      window.removeEventListener("online", retry);
    };
  }, [accessToken]);
}


function download(name: string, text: string) {
  const url = URL.createObjectURL(
    new Blob([text], { type: "application/json" }),
  );
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export function NewTransaction() {
  const d = useDapp();
  useTransactionSyncRetry();

  const [title, setTitle] = useState("");
  const [transactionType, setTransactionType] =
    useState<"goods" | "service">("service");
  const [seller, setSeller] = useState("");
  const [amount, setAmount] = useState("");
  const [deadline, setDeadline] = useState("");
  const [terms, setTerms] = useState("");
  const [review, setReview] = useState(false);
  const [agreementSaved, setAgreementSaved] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<{
    address: string;
    signature: string;
    agreement: string;
  } | null>(null);
  function next(event: FormEvent) {
    event.preventDefault();
    try {
      parseAmount(amount);
      if (
        Date.parse(deadline) <= Date.now() ||
        !Number.isFinite(Date.parse(deadline))
      )
        throw new Error("Choose a future deadline.");
      setError("");
      setAgreementSaved(false);
      setReview(true);
    } catch (e) {
      setError((e as Error).message);
    }
  }
  async function create() {
    if (!d.client) return;
    const result = await d.run(
      () =>
        d.client!.create(
          seller.trim(),
          amount,
          Math.floor(Date.parse(deadline) / 1000),
          terms,
        ),
      "Escrow created and confirmed. It is not funded yet.",
    );
    if (result) {
      setResult(result);

      try {
        enqueueTransactionSync({
          signature: result.signature,
          cluster: "devnet",
          action: "create_escrow",
          escrowAddress: result.address,
          metadata: {
            title: title.trim(),
            transactionType,
          },
        });

        await flushPendingTransactionSync();
      } catch (syncError) {
        console.error("Could not queue creation synchronization:", syncError);
        d.notify(
          "Escrow created on-chain. History synchronization is pending; keep this browser data.",
        );
      }

      try {
        localStorage.setItem(
          `trustlayer:${getSolanaCluster()}:${result.address}`,
          result.agreement,
        );
      } catch {
        d.notify(
          "Browser storage unavailable. Download your agreement now to retain its terms.",
        );
      }
    }
  }
  if (result)
    return (
      <>
        <PageHeading
          eyebrow="CONFIRMED ON SOLANA"
          title="Your agreement is on-chain."
          description="The escrow is created. No USDC has been deposited yet."
        />
        <section className="panel success-panel">
          <CheckCircle2 size={48} />
          <h2>Next: save your agreement and fund escrow</h2>
          <p>
            Only the agreement hash is on-chain. Download these terms and share
            them with your seller. Browser storage is not a backup.
          </p>
          <code className="break-address">{result.address}</code>
          <div className="button-row">
            <button
              className="btn secondary"
              onClick={() =>
                download(`trustlayer-${result.address}.json`, result.agreement)
              }
            >
              <Download size={16} />
              Download agreement
            </button>
            <Link
              className="btn primary"
              href={`/app/transactions/${result.address}`}
            >
              View & fund escrow <ArrowUpRight size={16} />
            </Link>
          </div>
          <Receipt signature={result.signature} />
        </section>
      </>
    );
  return (
    <>
      <Link className="back-link" href="/app/transactions">
        <ArrowLeft size={15} />
        All transactions
      </Link>
      <PageHeading
        eyebrow="A CLEAR AGREEMENT COMES FIRST"
        title="Create a protected transaction"
        description="Set the terms now. Approve the USDC deposit separately in your wallet."
      />
      {!d.client ? (
        <section className="panel">
          <ConnectionGate />
        </section>
      ) : (
        <div className="form-grid">
          <section className="panel form-panel">
            <div className="steps">
              <span className={!review ? "current" : ""}>
                1 · Agreement details
              </span>
              <span className={review ? "current" : ""}>
                2 · Review & create
              </span>
            </div>
            {!review ? (
              <form onSubmit={next} className="form-stack">
                <label>
                  Transaction title
                  <input
                    required
                    maxLength={120}
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="What is this agreement for?"
                  />
                </label>
                <label>
                  Transaction type
                  <select
                    value={transactionType}
                    onChange={(e) =>
                      setTransactionType(e.target.value as "goods" | "service")
                    }
                  >
                    <option value="goods">Goods</option>
                    <option value="service">Services</option>
                  </select>
                </label>
                <label>
                  Seller wallet address
                  <input
                    required
                    value={seller}
                    onChange={(e) => setSeller(e.target.value)}
                    placeholder="Solana public key"
                    autoComplete="off"
                  />
                  <small>
                    Verify this address with your seller through a trusted
                    channel.
                  </small>
                </label>
                <div className="field-grid">
                  <label>
                    Amount (USDC)
                    <input
                      required
                      inputMode="decimal"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="0.00"
                    />
                  </label>
                  <label>
                    Delivery deadline (your local time)
                    <input
                      required
                      type="datetime-local"
                      value={deadline}
                      onChange={(e) => setDeadline(e.target.value)}
                    />
                  </label>
                </div>
                <label>
                  Agreement & acceptance criteria
                  <textarea
                    required
                    maxLength={10000}
                    rows={6}
                    value={terms}
                    onChange={(e) => setTerms(e.target.value)}
                    placeholder="Describe what will be delivered, when, and what counts as successful delivery. Do not include private personal information."
                  />
                  <small>
                    {terms.length}/10,000 · Terms stay in this browser and your
                    downloaded file. Only their SHA-256 hash is public.
                  </small>
                </label>
                {error && (
                  <p className="form-error" role="alert">
                    {error}
                  </p>
                )}
                <button
                  className="btn primary"
                  type="submit"
                  disabled={d.client.config.paused}
                >
                  Review agreement <ArrowUpRight size={16} />
                </button>
                {d.client.config.paused && (
                  <p className="form-error">
                    New deposits and escrows are paused by the operator.
                  </p>
                )}
              </form>
            ) : (
              <div className="form-stack">
                <h2>Check every detail before signing.</h2>
                <dl className="detail-list">
                  <div>
                    <dt>Transaction</dt>
                    <dd>{title}</dd>
                  </div>
                  <div>
                    <dt>Type</dt>
                    <dd>{transactionType === "goods" ? "Goods" : "Services"}</dd>
                  </div>
                  <div>
                    <dt>Seller</dt>
                    <dd className="break-address">{seller}</dd>
                  </div>
                  <div>
                    <dt>Escrow amount</dt>
                    <dd>{formatAmount(parseAmount(amount))} USDC</dd>
                  </div>
                  <div>
                    <dt>Platform fee on payout</dt>
                    <dd>
                      {formatAmount(
                        feeAmount(parseAmount(amount), d.client.config.feeBps),
                      )}{" "}
                      USDC ({d.client.config.feeBps / 100}%)
                    </dd>
                  </div>
                  <div>
                    <dt>Seller receives if released</dt>
                    <dd>
                      {formatAmount(
                        parseAmount(amount) -
                          feeAmount(
                            parseAmount(amount),
                            d.client.config.feeBps,
                          ),
                      )}{" "}
                      USDC
                    </dd>
                  </div>
                  <div>
                    <dt>Delivery deadline</dt>
                    <dd>{new Date(deadline).toLocaleString()}</dd>
                  </div>
                </dl>
                <pre className="agreement-preview">{terms}</pre>
                <p className="muted">
                  Creation costs SOL for network fees and account rent. It does
                  not move USDC. The seller can escalate to arbitration after
                  the deadline; refunds are not automatic.
                </p>
                <div className="button-row">
                  <button
                    className="btn secondary"
                    disabled={d.busy}
                    onClick={() => setReview(false)}
                  >
                    Edit details
                  </button>
                  <button
                    className="btn secondary"
                    onClick={() => {
                      download(
                        "trustlayer-agreement.json",
                        agreementText(
                          seller.trim(),
                          parseAmount(amount).toString(),
                          Math.floor(Date.parse(deadline) / 1000),
                          terms,
                        ),
                      );
                      setAgreementSaved(true);
                    }}
                  >
                    <Download size={15} />
                    {agreementSaved ? "Download again" : "Save agreement first"}
                  </button>
                  <button
                    className="btn primary"
                    disabled={d.busy || !agreementSaved}
                    onClick={() => void create()}
                  >
                    {d.busy ? "Confirming…" : "Sign & create escrow"}
                  </button>
                </div>
              </div>
            )}
          </section>
          <aside className="panel guide-panel">
            <ShieldCheck size={30} />
            <h2>Clarity protects both sides.</h2>
            <p>
              Use specific delivery terms, an agreed deadline, and a wallet
              address you’ve independently verified.
            </p>
            <hr />
            <h3>Before you continue</h3>
            <ul>
              <li>You’ll need SOL for network fees and rent.</li>
              <li>USDC stays in your wallet until you fund the escrow.</li>
              <li>
                On-chain creation is not proof the seller accepted the terms.
              </li>
              <li>Share and agree on the downloaded terms before funding.</li>
              <li>
                An authorized arbitrator settles disputes; there is no automatic
                refund.
              </li>
            </ul>
          </aside>
        </div>
      )}
    </>
  );
}
const labels: Record<Action, string> = {
  fundEscrow: "Fund escrow",
  releaseToSeller: "Accept & release payment",
  markDeliverySubmitted: "Mark delivery submitted",
  openDispute: "Open dispute",
  cancelUnfunded: "Cancel unfunded escrow",
  resolveDisputeRefundBuyer: "Resolve: refund buyer",
  resolveDisputePaySeller: "Resolve: pay seller",
};
const warnings: Record<Action, string> = {
  fundEscrow:
    "This transfers the full USDC amount from your associated token account into the escrow vault. Make sure both sides have agreed to the terms.",
  releaseToSeller:
    "This irreversibly releases USDC to the recorded seller, less the disclosed fee. Only continue if you accept delivery.",
  markDeliverySubmitted:
    "This records a delivery claim, not proof of physical delivery. Send supporting evidence to your buyer separately.",
  openDispute:
    "This prevents ordinary release and requires the configured arbitrator to settle. This app does not provide evidence hosting or a staffed arbitration service; arrange a review channel with the operator.",
  cancelUnfunded:
    "This permanently cancels the unfunded escrow. Network fees and rent are not refunded.",
  resolveDisputeRefundBuyer:
    "This irreversibly refunds the escrow amount to the recorded buyer. Confirm your decision and evidence review first.",
  resolveDisputePaySeller:
    "This irreversibly pays the recorded seller, less the recorded fee. Confirm your decision and evidence review first.",
};
export function TransactionDetail({ id }: { id: string }) {
  const d = useDapp();
  useTransactionSyncRetry();

  const [row, setRow] = useState<Escrow | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [action, setAction] = useState<Action | null>(null);
  const [agreement, setAgreement] = useState("");
  const [verified, setVerified] = useState(false);
  const [signature, setSignature] = useState("");
  const load = useCallback(async () => {
    if (!d.client) return;
    setLoading(true);
    setError("");
    try {
      setRow(await d.client.fetch(id));
    } catch {
      setRow(null);
      setError(
        "Escrow not found, invalid address, or RPC unavailable. Check the address and network, then retry.",
      );
    } finally {
      setLoading(false);
    }
  }, [d.client, id]);
  useEffect(() => {
    void load();
  }, [load]);
  useEffect(() => {
    try {
      setAgreement(
        localStorage.getItem(`trustlayer:${getSolanaCluster()}:${id}`) || "",
      );
    } catch {
      /* Downloads remain available. */
    }
  }, [id]);
  useEffect(() => {
    let active = true;
    setVerified(false);
    if (agreement && row)
      void crypto.subtle
        .digest("SHA-256", new TextEncoder().encode(agreement))
        .then((hash) => {
          if (active)
            setVerified(
              Array.from(new Uint8Array(hash))
                .map((b) => b.toString(16).padStart(2, "0"))
                .join("") === row.hash,
            );
        });
    return () => {
      active = false;
    };
  }, [agreement, row]);
  if (!d.client)
    return (
      <section className="panel">
        <ConnectionGate />
      </section>
    );
  if (loading)
    return (
      <div className="empty-state" role="status">
        Reading escrow account…
      </div>
    );
  if (error || !row)
    return (
      <div className="empty-state">
        <h2>Unable to load escrow</h2>
        <p>{error}</p>
        <button className="btn secondary" onClick={() => void load()}>
          Retry
        </button>
      </div>
    );
  const arbitrator =
    d.address === d.client.config.arbitrationAuthority.toBase58();
  const role =
    row.state === 3 && arbitrator
      ? "arbitrator"
      : row.buyer === d.address
        ? "buyer"
        : row.seller === d.address
          ? "seller"
          : "visitor";
  const actions = actionsFor(
    row.state,
    role,
    Date.now() >= row.deadline * 1000,
    d.client.config.paused,
  );
  async function execute() {
    if (!action || !row || !d.client) return;
    const result = await d.run(
      () => d.client!.act(action, row),
      `${labels[action]} confirmed on-chain.`,
    );
    if (result) {
      setSignature(result);
      setAction(null);

      const syncActions: Record<Action, SyncAction> = {
        fundEscrow: "fund_escrow",
        releaseToSeller: "release_to_seller",
        markDeliverySubmitted: "mark_delivery_submitted",
        openDispute: "open_dispute",
        cancelUnfunded: "cancel_unfunded",
        resolveDisputeRefundBuyer: "resolve_dispute_refund_buyer",
        resolveDisputePaySeller: "resolve_dispute_pay_seller",
      };

      try {
        enqueueTransactionSync({
          signature: result,
          cluster: "devnet",
          action: syncActions[action],
          escrowAddress: row.address,
        });

        await flushPendingTransactionSync();
      } catch (syncError) {
        console.error("Could not queue action synchronization:", syncError);
        d.notify(
          "Solana action confirmed. Transaction history synchronization is pending.",
        );
      }

      await load();
    }
  }
  return (
    <>
      <Link className="back-link" href="/app/transactions">
        <ArrowLeft size={15} />
        All transactions
      </Link>
      <PageHeading
        eyebrow={`ESCROW · YOU ARE ${role.toUpperCase()}`}
        title="Agreement details"
        description="Account state is read directly from the configured Solana program."
      />
      <div className="detail-grid">
        <section className="panel form-panel">
          <div className="detail-summary">
            <div>
              <p className="eyebrow">PROTECTED AMOUNT</p>
              <h2>
                {formatAmount(row.amount)} <span>USDC</span>
              </h2>
            </div>
            <Status state={row.state} />
          </div>
          <dl className="detail-list">
            {[
              ["Escrow account", row.address],
              ["Buyer wallet", row.buyer],
              ["Seller wallet", row.seller],
              ["Vault account", row.vault],
              ["Token mint", row.mint],
            ].map(([label, value]) => (
              <div key={label}>
                <dt>{label}</dt>
                <dd>
                  <a
                    className="address-link"
                    href={explorer(value)}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {value}
                    <ArrowUpRight size={14} />
                  </a>
                </dd>
              </div>
            ))}
            <div>
              <dt>Delivery deadline</dt>
              <dd>{new Date(row.deadline * 1000).toLocaleString()}</dd>
            </div>
            <div>
              <dt>Platform fee on payout</dt>
              <dd>
                {formatAmount(feeAmount(BigInt(row.amount), row.feeBps))} USDC (
                {row.feeBps / 100}%)
              </dd>
            </div>
            <div>
              <dt>Agreement SHA-256</dt>
              <dd className="break-address">{row.hash}</dd>
            </div>
          </dl>
          <div className="button-row">
            <button
              className="btn secondary"
              onClick={() => {
                void navigator.clipboard
                  .writeText(window.location.href)
                  .then(() => d.notify("Escrow link copied."))
                  .catch(() =>
                    d.notify("Copy the link from your browser address bar."),
                  );
              }}
            >
              <Copy size={15} />
              Copy escrow link
            </button>
            <a
              className="btn secondary"
              href={explorer(id)}
              target="_blank"
              rel="noreferrer"
            >
              Solana Explorer <ArrowUpRight size={15} />
            </a>
          </div>
        </section>
        <aside className="panel form-panel">
          <h2>Next steps</h2>
          <p className="muted">
            Only actions permitted for your wallet and this escrow state are
            shown. The program enforces authorization.
          </p>
          {actions.length ? (
            <div className="action-stack">
              {actions.map((value) => (
                <button
                  className={`btn ${value === "releaseToSeller" || value === "fundEscrow" ? "primary" : "secondary"}`}
                  key={value}
                  disabled={d.busy}
                  onClick={() => setAction(value)}
                >
                  {labels[value]}
                </button>
              ))}
            </div>
          ) : (
            <p className="notice">
              {role === "visitor"
                ? "This is a public on-chain record. Your wallet is not authorized to act on it."
                : "No action is currently required from this wallet. Refresh after the counterparty acts."}
            </p>
          )}
          {action && (
            <div
              className="confirm-box"
              role="region"
              aria-label="Confirm transaction"
            >
              <h3>{labels[action]}?</h3>
              <p>{warnings[action]}</p>
              <div className="button-row">
                <button
                  className="btn secondary"
                  disabled={d.busy}
                  onClick={() => setAction(null)}
                >
                  Back
                </button>
                <button
                  className="btn primary"
                  disabled={d.busy}
                  onClick={() => void execute()}
                >
                  Confirm in wallet
                </button>
              </div>
            </div>
          )}
          {signature && <Receipt signature={signature} />}
          <hr />
          <h3>On-chain timeline</h3>
          <ul className="timeline">
            <li>Escrow created</li>
            {row.fundedAt > 0 && (
              <li>Funded · {new Date(row.fundedAt * 1000).toLocaleString()}</li>
            )}
            {row.disputedAt > 0 && (
              <li>
                Disputed · {new Date(row.disputedAt * 1000).toLocaleString()}
              </li>
            )}
            {row.settledAt > 0 && (
              <li>
                Settled · {new Date(row.settledAt * 1000).toLocaleString()}
              </li>
            )}
          </ul>
        </aside>
      </div>
      <section className="panel form-panel agreement-panel">
        <h2>
          <FileCheck2 size={20} />
          Verify agreement terms
        </h2>
        <p className="muted">
          Import the exact JSON agreement downloaded by the creator. A matching
          hash proves these bytes match the recorded agreement—not that either
          party performed it.
        </p>
        <label className="file-label">
          Import agreement JSON
          <input
            type="file"
            accept=".json,application/json"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              if (file.size > 65536) {
                d.notify("Agreement file too large (maximum 64 KB).");
                return;
              }
              void file.text().then(setAgreement);
            }}
          />
        </label>
        {agreement && (
          <>
            <p className={verified ? "verified-message" : "form-error"}>
              {verified
                ? "✓ Hash verified — exact match to the on-chain agreement"
                : "Hash mismatch — do not rely on these terms"}
            </p>
            <pre className="agreement-preview">{agreement}</pre>
            <button
              className="btn secondary"
              onClick={() => download(`trustlayer-${id}.json`, agreement)}
            >
              <Download size={15} />
              Download terms
            </button>
          </>
        )}
      </section>
    </>
  );
}

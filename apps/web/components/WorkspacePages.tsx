"use client";
import Link from "next/link";
import { FormEvent, useState } from "react";
import {
  ArrowUpRight,
  Copy,
  ExternalLink,
  ShieldCheck,
  Wallet,
} from "lucide-react";
import { useDapp, ConnectionGate, Receipt } from "./DappProvider";
import { PageHeading } from "./Dashboard";
import { formatAmount } from "@/lib/protocol";
import { explorer, getSolanaCluster } from "@/lib/solana/cluster";
export function WalletPage() {
  const d = useDapp();
  return (
    <>
      <PageHeading
        eyebrow="SELF-CUSTODY, ALWAYS"
        title="Your wallet"
        description="Trustlayer never asks for your seed phrase or holds your private keys."
      />
      {!d.address ? (
        <section className="panel">
          <ConnectionGate />
          <div className="button-row wallet-options">
            <button
              className="btn secondary"
              onClick={() => void d.connect("Phantom")}
            >
              Connect Phantom
            </button>
            <button
              className="btn secondary"
              onClick={() => void d.connect("Solflare")}
            >
              Connect Solflare
            </button>
          </div>
        </section>
      ) : (
        <div className="detail-grid">
          <section className="panel form-panel">
            <div className="wallet-avatar">
              <Wallet size={30} />
            </div>
            <h2>Connected Solana wallet</h2>
            <p className="break-address muted">{d.address}</p>
            <div className="button-row">
              <button
                className="btn secondary"
                onClick={() =>
                  void navigator.clipboard
                    .writeText(d.address!)
                    .then(() => d.notify("Wallet address copied."))
                    .catch(() =>
                      d.notify("Copy your address from the text above."),
                    )
                }
              >
                <Copy size={15} />
                Copy address
              </button>
              <a
                className="btn secondary"
                href={explorer(d.address)}
                target="_blank"
                rel="noreferrer"
              >
                Explorer <ExternalLink size={15} />
              </a>
            </div>
            <dl className="detail-list">
              <div>
                <dt>USDC token balance</dt>
                <dd>
                  {d.balance
                    ? `${formatAmount(d.balance.usdc)} USDC`
                    : "Unavailable until deployment is configured"}
                </dd>
              </div>
              <div>
                <dt>Network fee balance</dt>
                <dd>{d.balance ? `${d.balance.sol.toFixed(6)} SOL` : "—"}</dd>
              </div>
              <div>
                <dt>Network</dt>
                <dd>{getSolanaCluster()}</dd>
              </div>
            </dl>
            <button
              className="btn secondary"
              disabled={d.busy}
              onClick={() => void d.disconnect()}
            >
              Disconnect wallet
            </button>
          </section>
          <aside className="panel guide-panel">
            <ShieldCheck size={28} />
            <h2>Before your first transaction</h2>
            <p>
              Use test tokens only. Configure your wallet for the same network
              shown here.
            </p>
            <ul>
              <li>SOL pays network fees and account rent.</li>
              <li>
                Funding uses USDC in your associated token account. Other token
                accounts contribute to the displayed total but must be
                consolidated before funding.
              </li>
              <li>Disconnecting does not cancel on-chain escrows.</li>
              <li>Only approve transactions you understand.</li>
            </ul>
            <a
              href="https://faucet.solana.com/"
              target="_blank"
              rel="noreferrer"
              className="text-link"
            >
              Solana test SOL faucet <ArrowUpRight size={15} />
            </a>
          </aside>
        </div>
      )}
    </>
  );
}
export function SettingsPage() {
  const d = useDapp();
  const rows = [
    ["Network", getSolanaCluster()],
    [
      "Program ID",
      process.env.NEXT_PUBLIC_TRUSTLAYER_PROGRAM_ID || "Not configured",
    ],
    ["USDC mint", process.env.NEXT_PUBLIC_USDC_MINT || "Not configured"],
    ["Mainnet payments", "Disabled in this release"],
    ["Chain reads", "Confirmed commitment · same-origin RPC proxy"],
    ["Database", "Not used for wallet-first escrow state"],
    [
      "Arbitrator",
      d.client?.config.arbitrationAuthority.toBase58() ||
        "Unavailable until program connects",
    ],
    [
      "New deposits",
      d.client
        ? d.client.config.paused
          ? "Paused by operator"
          : "Enabled"
        : "Unavailable",
    ],
  ];
  return (
    <>
      <PageHeading
        eyebrow="TRANSPARENT BY DEFAULT"
        title="Network & settings"
        description="Check exactly which program and token you are interacting with."
      />
      <section className="panel form-panel">
        <h2>Deployment configuration</h2>
        <dl className="detail-list">
          {rows.map(([key, value]) => (
            <div key={key}>
              <dt>{key}</dt>
              <dd className="break-address">{value}</dd>
            </div>
          ))}
        </dl>
        <p className="muted">
          Network and program settings are deployment-controlled, not changed by
          a browser toggle. This prevents accidentally signing against another
          escrow program.
        </p>
      </section>
      <section className="panel form-panel agreement-panel">
        <h2>Local agreement files</h2>
        <p className="muted">
          Agreement terms you create are saved only in this browser, when
          browser storage permits it. Download a copy from the escrow detail
          page. Clearing site data removes local terms, not on-chain funds.
        </p>
        <Link className="text-link" href="/app/transactions">
          View agreements <ArrowUpRight size={15} />
        </Link>
      </section>
    </>
  );
}
export function NotificationsPage() {
  const d = useDapp();
  return (
    <>
      <PageHeading
        eyebrow="THIS BROWSER SESSION"
        title="Activity"
        description="Wallet action receipts and errors from this session. This is not a complete chain history."
      />
      <section className="panel form-panel">
        {d.notices.length ? (
          <ul className="activity-list">
            {d.notices.map((n) => (
              <li key={n.id}>
                <span className={n.error ? "form-error" : "verified-message"}>
                  {n.error ? "!" : "✓"}
                </span>
                <div>
                  <strong>{n.message}</strong>
                  <p className="muted">{new Date(n.id).toLocaleString()}</p>
                  {n.signature && <Receipt signature={n.signature} />}
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <div className="empty-state">
            <h2>You’re all caught up</h2>
            <p>
              Your wallet action receipts will appear here. Existing escrows are
              available under Transactions.
            </p>
          </div>
        )}
      </section>
    </>
  );
}
export function HelpPage() {
  return (
    <>
      <PageHeading
        eyebrow="A LITTLE CLARITY GOES A LONG WAY"
        title="Help & resources"
        description="Understand what happens before you connect, sign, or release."
      />
      <div className="help-grid">
        {[
          [
            "How do I get started?",
            "Install Phantom or Solflare, connect your wallet, and check the network and mint under Settings. A deployment operator must configure the program first. You need test SOL and the configured six-decimal test token.",
          ],
          [
            "Does connecting move my funds?",
            "No. Connecting reveals your public wallet address. Each create, deposit, release, or dispute requires a separate wallet signature.",
          ],
          [
            "How do agreement terms work?",
            "The buyer creates the agreement and downloads its exact JSON. Share it with the seller before funding. Import it on the detail page to verify its SHA-256 hash against the on-chain record. The app does not host private evidence or certify seller consent.",
          ],
          [
            "What if delivery goes wrong?",
            "A buyer can open a dispute while funded. A seller can escalate after the delivery deadline. The configured arbitrator can refund the buyer or pay the seller. There are no automatic refunds, appeals, or staffed case-management services in this release.",
          ],
          [
            "What if a transaction times out?",
            "A confirmation timeout does not mean failure. Check the submitted signature in Solana Explorer, refresh the escrow, and only retry once you know the previous transaction did not succeed.",
          ],
          [
            "What are the fees and risks?",
            "The on-chain fee is capped at 1% and snapshotted for each escrow. SOL network fees and rent apply separately. This program is unaudited; mainnet payments are disabled. Authorities and RPC infrastructure remain trust dependencies.",
          ],
        ].map(([title, text]) => (
          <section className="panel form-panel" key={title}>
            <h2>{title}</h2>
            <p className="muted">{text}</p>
          </section>
        ))}
      </div>
      <div className="trust-strip">
        <ShieldCheck size={24} />
        <div>
          <strong>Never share a seed phrase.</strong>
          <p>Trustlayer support will never need your private keys.</p>
        </div>
        <Link href="/risk-disclosure">Read the risks ↗</Link>
      </div>
    </>
  );
}
export function OperatorPage() {
  const d = useDapp();
  const [id, setId] = useState("");
  const [confirmPause, setConfirmPause] = useState(false);
  const authority =
    !!d.client && d.address === d.client.config.authority.toBase58();
  const arbitrator =
    !!d.client && d.address === d.client.config.arbitrationAuthority.toBase58();
  function lookup(event: FormEvent) {
    event.preventDefault();
    window.location.assign(
      `/app/transactions/${encodeURIComponent(id.trim())}`,
    );
  }
  return (
    <>
      <PageHeading
        eyebrow="ON-CHAIN AUTHORITY REQUIRED"
        title="Operator console"
        description="Authorization is enforced by program account constraints, not by hidden UI controls."
      />
      {!d.client ? (
        <section className="panel">
          <ConnectionGate />
        </section>
      ) : !authority && !arbitrator ? (
        <section className="panel empty-state">
          <ShieldCheck size={35} />
          <h2>This wallet is not an operator</h2>
          <p>
            Connect the configured management or arbitration authority. No
            privileged database data is served here.
          </p>
        </section>
      ) : (
        <div className="detail-grid">
          <section className="panel form-panel">
            <h2>Dispute resolution</h2>
            <p className="muted">
              Open a specific escrow to inspect its on-chain state. Only the
              configured arbitration signer can execute a resolution. Evidence
              review must be arranged outside this app.
            </p>
            <form className="form-stack" onSubmit={lookup}>
              <label>
                Escrow address
                <input
                  required
                  value={id}
                  onChange={(e) => setId(e.target.value)}
                  placeholder="Public escrow account"
                />
              </label>
              <button className="btn primary">Inspect escrow</button>
            </form>
          </section>
          {authority && (
            <section className="panel form-panel">
              <h2>Emergency controls</h2>
              <p className="muted">
                Pausing stops new escrows and deposits. Releases, disputes,
                refunds, and cancellations remain available.
              </p>
              <button
                className="btn secondary"
                onClick={() => setConfirmPause(true)}
              >
                {d.client.config.paused
                  ? "Resume new deposits"
                  : "Pause new deposits"}
              </button>
              {confirmPause && (
                <div className="confirm-box">
                  <p>
                    Confirm the change with the management authority wallet.
                  </p>
                  <div className="button-row">
                    <button
                      className="btn secondary"
                      onClick={() => setConfirmPause(false)}
                    >
                      Cancel
                    </button>
                    <button
                      disabled={d.busy}
                      className="btn primary"
                      onClick={() =>
                        void d
                          .run(
                            () => d.client!.pause(!d.client!.config.paused),
                            "Program pause state updated.",
                          )
                          .then(() => setConfirmPause(false))
                      }
                    >
                      Confirm in wallet
                    </button>
                  </div>
                </div>
              )}
              <p className="muted">
                Authority rotation requires both old and new management
                signatures; use the documented operator procedure. This browser
                console does not support multisig proposal execution.
              </p>
            </section>
          )}
        </div>
      )}
    </>
  );
}

"use client";
import Link from "next/link";
import { useState } from "react";
import {
  ArrowDownLeft,
  ArrowUpRight,
  CheckCheck,
  Plus,
  Search,
  ShieldCheck,
  Wallet,
} from "lucide-react";
import { ConnectionGate, useDapp } from "./DappProvider";
import { Escrow } from "@/lib/escrow";
import { formatAmount, shortAddress, STATES } from "@/lib/protocol";
export function Status({ state }: { state: number }) {
  return (
    <span className={`status status-${state}`}>
      <span />
      {STATES[state] || "Unknown"}
    </span>
  );
}
export function PageHeading({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow: string;
  title: string;
  description: string;
  action?: boolean;
}) {
  return (
    <div className="page-heading">
      <div>
        <p className="eyebrow">{eyebrow}</p>
        <h1>{title}</h1>
        <p className="subheading">{description}</p>
      </div>
      {action && (
        <Link className="btn primary" href="/app/transactions/new">
          <Plus size={17} />
          New transaction
        </Link>
      )}
    </div>
  );
}
export function TransactionTable({
  rows,
  compact = false,
}: {
  rows: Escrow[];
  compact?: boolean;
}) {
  const { address } = useDapp();
  return (
    <div className="table-scroll">
      <table>
        <thead>
          <tr>
            <th>Transaction / counterparty</th>
            <th>Amount</th>
            <th>Status</th>
            {!compact && <th>Delivery deadline</th>}
            <th aria-label="Details" />
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.address}>
              <td>
                <Link
                  className="transaction-cell"
                  href={`/app/transactions/${row.address}`}
                >
                  <span
                    className={`transaction-icon ${row.buyer === address ? "outgoing" : "incoming"}`}
                  >
                    {row.buyer === address ? (
                      <ArrowUpRight size={19} />
                    ) : (
                      <ArrowDownLeft size={19} />
                    )}
                  </span>
                  <span>
                    <strong>
                      {row.buyer === address ? "Payment to" : "Payment from"}{" "}
                      {shortAddress(
                        row.buyer === address ? row.seller : row.buyer,
                      )}
                    </strong>
                    <small>
                      Escrow {shortAddress(row.address)} ·{" "}
                      {row.buyer === address ? "Buying" : "Selling"}
                    </small>
                  </span>
                </Link>
              </td>
              <td>
                <strong>{formatAmount(row.amount)}</strong>
                <small>USDC</small>
              </td>
              <td>
                <Status state={row.state} />
              </td>
              {!compact && (
                <td>{new Date(row.deadline * 1000).toLocaleDateString()}</td>
              )}
              <td>
                <Link
                  className="icon-btn"
                  href={`/app/transactions/${row.address}`}
                  aria-label={`View escrow ${row.address}`}
                >
                  <ArrowUpRight size={18} />
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
export function Dashboard() {
  const d = useDapp();
  const locked = d.escrows
    .filter((e) => [1, 2, 3].includes(e.state))
    .reduce((sum, e) => sum + BigInt(e.amount), 0n);
  const completed = d.escrows.filter((e) => [4, 5, 6].includes(e.state)).length;
  return (
    <>
      <PageHeading
        eyebrow="YOUR TRUSTLAYER"
        title="Trade with confidence."
        description="Your agreements, payments, and peace of mind. All in one place."
        action
      />
      <div className="overview-grid">
        <section className="balance-card">
          <div className="card-top">
            <span>
              <span className="token-icon">$</span>YOUR USDC BALANCE
            </span>
            <Wallet size={20} />
          </div>
          <div className="balance-number">
            {d.balance ? formatAmount(d.balance.usdc) : "—"}
            <span>USDC</span>
          </div>
          <p>
            {d.address
              ? "Confirmed token balance on your connected wallet"
              : "Connect your wallet to see your balance"}
          </p>
          <div className="balance-bottom">
            <span>
              <span className="live-dot" />
              Wallet-held · non-custodial
            </span>
            <Link href="/app/wallet">
              Wallet details <ArrowUpRight size={15} />
            </Link>
          </div>
        </section>
        <section className="stat-card">
          <span className="stat-icon">
            <ShieldCheck size={21} />
          </span>
          <p>Protected in escrow</p>
          <h2>
            {d.client ? formatAmount(locked) : "—"}
            <span>USDC</span>
          </h2>
          <small>
            {d.client
              ? `${d.escrows.filter((e) => [1, 2, 3].includes(e.state)).length} active escrows`
              : "Live on-chain data, never simulated"}
          </small>
        </section>
        <section className="stat-card">
          <span className="stat-icon purple">
            <CheckCheck size={21} />
          </span>
          <p>Completed transactions</p>
          <h2>{d.client ? completed : "—"}</h2>
          <small>Released or refunded on-chain</small>
        </section>
      </div>
      <div className="dashboard-columns">
        <section className="panel transactions-panel">
          <div className="panel-heading">
            <div>
              <h2>Recent transactions</h2>
              <p>A clear view of every agreement.</p>
            </div>
            <Link href="/app/transactions" className="text-link">
              View all <ArrowUpRight size={14} />
            </Link>
          </div>
          {!d.client ? (
            <ConnectionGate />
          ) : d.escrows.length ? (
            <TransactionTable rows={d.escrows.slice(0, 5)} compact />
          ) : (
            <div className="empty-state">
              <span className="empty-icon">
                <ShieldCheck size={28} />
              </span>
              <h2>Your first agreement starts here</h2>
              <p>
                Create an escrow, share the agreement with your seller, and fund
                it only when you’re ready.
              </p>
              <Link className="btn secondary" href="/app/transactions/new">
                Create a transaction <Plus size={16} />
              </Link>
            </div>
          )}
        </section>
        <aside className="panel how-panel">
          <span className="small-tag">THE TRUSTLAYER WAY</span>
          <h2>
            A safer way
            <br />
            to make a deal.
          </h2>
          <ol>
            <li>
              <span>01</span>
              <div>
                <strong>Agree on the details</strong>
                <p>Set the amount, delivery deadline, and clear terms.</p>
              </div>
            </li>
            <li>
              <span>02</span>
              <div>
                <strong>Secure your payment</strong>
                <p>USDC stays in a program-controlled escrow vault.</p>
              </div>
            </li>
            <li>
              <span>03</span>
              <div>
                <strong>Release with confidence</strong>
                <p>Approve delivery, or open a dispute for review.</p>
              </div>
            </li>
          </ol>
          <Link className="text-link" href="/app/help">
            Learn how escrow works <ArrowUpRight size={15} />
          </Link>
        </aside>
      </div>
      <div className="trust-strip">
        <ShieldCheck size={22} />
        <div>
          <strong>Your funds follow the agreement.</strong>
          <p>Wallet-signed payments. Transparent fees. Verifiable on Solana.</p>
        </div>
        <Link href="/security">
          Our security approach <ArrowUpRight size={14} />
        </Link>
      </div>
    </>
  );
}
export function Transactions({
  mode = "all",
}: {
  mode?: "all" | "disputes" | "invitations";
}) {
  const d = useDapp();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const base = d.escrows.filter((e) =>
    mode === "disputes"
      ? e.state === 3
      : mode === "invitations"
        ? e.state === 0 && e.seller === d.address
        : true,
  );
  const rows = base.filter(
    (e) =>
      (filter === "all" ||
        (filter === "active"
          ? [0, 1, 2, 3].includes(e.state)
          : [4, 5, 6, 7].includes(e.state))) &&
      `${e.address} ${e.buyer} ${e.seller}`
        .toLowerCase()
        .includes(search.toLowerCase()),
  );
  return (
    <>
      <PageHeading
        eyebrow="YOUR WORKSPACE"
        title={
          mode === "disputes"
            ? "Disputes"
            : mode === "invitations"
              ? "Awaiting funding"
              : "Transactions"
        }
        description={
          mode === "disputes"
            ? "Track escrows awaiting a decision from the configured arbitrator."
            : mode === "invitations"
              ? "On-chain agreements that name you as the seller. Review terms with the buyer before funding."
              : "Every agreement. Every payment. Verified directly on-chain."
        }
        action
      />
      {!d.client ? (
        <section className="panel">
          <ConnectionGate />
        </section>
      ) : (
        <section className="panel">
          <div className="table-toolbar">
            <div className="tabs">
              {["all", "active", "completed"].map((value) => (
                <button
                  key={value}
                  className={filter === value ? "selected" : ""}
                  onClick={() => setFilter(value)}
                >
                  {value[0].toUpperCase() + value.slice(1)}
                </button>
              ))}
            </div>
            <label className="search-field">
              <Search size={17} />
              <input
                aria-label="Search by escrow or wallet address"
                placeholder="Search wallet or escrow…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </label>
          </div>
          {rows.length ? (
            <TransactionTable rows={rows} />
          ) : (
            <div className="empty-state">
              <h2>
                {search ? "No matching transactions" : "Nothing here yet"}
              </h2>
              <p>
                {search
                  ? "Try another wallet or escrow address."
                  : "Confirmed escrows associated with your wallet will appear here."}
              </p>
            </div>
          )}
          <div className="table-footer">
            {rows.length} transaction{rows.length === 1 ? "" : "s"} · Confirmed
            on Solana
          </div>
        </section>
      )}
    </>
  );
}

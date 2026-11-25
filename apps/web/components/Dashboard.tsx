"use client";
import Link from "next/link";
import { useState } from "react";
import { ArrowDownLeft, ArrowUpRight, Plus, Search } from "lucide-react";
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

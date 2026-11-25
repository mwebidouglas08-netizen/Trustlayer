"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ReactNode, useState } from "react";
import {
  ArrowUpRight,
  Bell,
  ChevronDown,
  CircleHelp,
  FileText,
  LayoutDashboard,
  Menu,
  RefreshCw,
  Settings,
  ShieldCheck,
  Wallet,
  X,
  Scale,
  Inbox,
  ExternalLink,
  LogOut,
} from "lucide-react";
import { useDapp } from "./DappProvider";
import { shortAddress } from "@/lib/protocol";
const links = [
  { href: "/app", label: "Overview", icon: LayoutDashboard },
  { href: "/app/transactions", label: "Transactions", icon: FileText },
  { href: "/app/invitations", label: "Awaiting funding", icon: Inbox },
  { href: "/app/wallet", label: "My wallet", icon: Wallet },
  { href: "/app/disputes", label: "Disputes", icon: Scale },
];
export function AppShell({ children }: { children: ReactNode }) {
  const path = usePathname();
  const [menu, setMenu] = useState(false);
  const [walletMenu, setWalletMenu] = useState(false);
  const d = useDapp();
  return (
    <div className="app-shell">
      <aside className={`sidebar ${menu ? "open" : ""}`}>
        <Link href="/" className="brand">
          <span className="brand-mark">
            <ShieldCheck size={21} />
          </span>
          trustlayer<span className="brand-dot">.</span>
        </Link>
        <div className="workspace-label">
          YOUR WORKSPACE{" "}
          <button
            className="mobile-only icon-btn"
            aria-label="Close menu"
            onClick={() => setMenu(false)}
          >
            <X size={18} />
          </button>
        </div>
        <nav aria-label="Workspace">
          {links.map(({ href, label, icon: Icon }) => (
            <Link
              onClick={() => setMenu(false)}
              key={href}
              href={href}
              className={`nav-item ${(href === "/app" ? path === href : path.startsWith(href)) ? "active" : ""}`}
            >
              <Icon size={19} />
              {label}
              {href === "/app/transactions" && d.client && (
                <span className="nav-count">{d.escrows.length}</span>
              )}
            </Link>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="network-card">
            <span className="live-dot" />
            <strong>Solana test network</strong>
            <p>
              Real transactions. Test tokens.
              <br />
              Mainnet payments disabled.
            </p>
            <Link href="/app/settings">
              View configuration <ArrowUpRight size={13} />
            </Link>
          </div>
          <Link className="nav-item" href="/app/settings">
            <Settings size={19} />
            Settings
          </Link>
          <Link className="nav-item" href="/app/help">
            <CircleHelp size={19} />
            Help & resources
          </Link>
          <Link className="nav-item" href="/staff">
            <Scale size={19} />
            Operator console <ExternalLink size={13} />
          </Link>
          <div className="sidebar-foot">
            <ShieldCheck size={14} />
            Built for trust. Secured on-chain.
          </div>
        </div>
      </aside>
      {menu && (
        <button
          className="sidebar-overlay"
          aria-label="Close menu"
          onClick={() => setMenu(false)}
        />
      )}
      <div className="app-main">
        <header className="app-topbar">
          <div className="topbar-left">
            <button
              className="icon-btn mobile-only"
              aria-label="Open navigation"
              onClick={() => setMenu(true)}
            >
              <Menu size={22} />
            </button>
            <span className="breadcrumb">
              Workspace <span>/</span>{" "}
              <strong>
                {path.startsWith("/staff")
                  ? "Operator console"
                  : links.find(
                      (l) => l.href !== "/app" && path.startsWith(l.href),
                    )?.label || "Overview"}
              </strong>
            </span>
          </div>
          <div className="topbar-actions">
            <span className="network-pill">
              <span className="live-dot" />
              Testnet mode
            </span>
            <button
              className={`icon-btn ${d.loading ? "spinning" : ""}`}
              aria-label="Refresh chain data"
              disabled={d.loading || d.busy}
              onClick={() => void d.refresh()}
            >
              <RefreshCw size={18} />
            </button>
            <Link
              className="icon-btn"
              aria-label="Session activity"
              href="/app/notifications"
            >
              <Bell size={19} />
              {d.notices.length > 0 && <span className="notification-dot" />}
            </Link>
            <div className="wallet-control">
              <button
                className="btn wallet-btn"
                disabled={d.busy}
                onClick={() =>
                  d.address ? setWalletMenu(!walletMenu) : void d.connect()
                }
              >
                <Wallet size={16} />
                {d.address ? shortAddress(d.address) : "Connect wallet"}
                <ChevronDown size={14} />
              </button>
              {walletMenu && d.address && (
                <div className="wallet-dropdown">
                  <Link href="/app/wallet" onClick={() => setWalletMenu(false)}>
                    Wallet details
                  </Link>
                  <button
                    onClick={() => {
                      setWalletMenu(false);
                      void d.disconnect();
                    }}
                  >
                    <LogOut size={15} />
                    Disconnect
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>
        <main id="main-content" className="workspace-content">
          {d.issue && (
            <div className="notice warning">
              <ShieldCheck size={18} />
              <div>
                <strong>Preview · no program configured</strong>
                <p>{d.issue}</p>
              </div>
              <Link href="/app/settings">Setup ↗</Link>
            </div>
          )}
          {d.error && (
            <div className="notice danger" role="alert">
              <strong>Action needed</strong>
              <p>{d.error}</p>
            </div>
          )}
          {d.busy && (
            <div className="notice" role="status">
              Waiting for your wallet and on-chain confirmation. Keep this page
              open. Do not submit again.
            </div>
          )}
          {children}
          <footer className="workspace-footer">
            <span>Non-custodial by design. You approve every transaction.</span>
            <Link href="/risk-disclosure">Understand the risks ↗</Link>
          </footer>
        </main>
      </div>
    </div>
  );
}

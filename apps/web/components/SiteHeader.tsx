"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowUpRight, ShieldCheck } from "lucide-react";
export function SiteHeader() {
  const path = usePathname();
  if (path.startsWith("/app") || path.startsWith("/staff")) return null;
  return (
    <header className="marketing-header">
      <Link href="/" className="brand">
        <span className="brand-mark">
          <ShieldCheck size={21} />
        </span>
        trustlayer<span className="brand-dot">.</span>
      </Link>
      <nav aria-label="Main navigation">
        <Link href="/how-it-works">How it works</Link>
        <Link href="/security">Security</Link>
        <Link href="/fees">Fees</Link>
        <Link href="/app/help">Resources</Link>
        <Link href="/app/profile">Sign in</Link>
      </nav>
      <Link className="btn primary" href="/app">
        Open app <ArrowUpRight size={16} />
      </Link>
    </header>
  );
}

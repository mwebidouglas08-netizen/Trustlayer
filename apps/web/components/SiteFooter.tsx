"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
export function SiteFooter() {
  const path = usePathname();
  if (path.startsWith("/app") || path.startsWith("/staff")) return null;
  return (
    <footer className="marketing-footer">
      <strong>trustlayer.</strong>
      <span>Private workspace · Escrow activation pending</span>
      <nav>
        <Link href="/privacy">Privacy</Link>
        <Link href="/terms">Terms</Link>
        <Link href="/risk-disclosure">Risks</Link>
        <Link href="/app/help">Help</Link>
      </nav>
    </footer>
  );
}

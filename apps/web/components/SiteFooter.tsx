import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="border-t border-slate-200 bg-white">
      <div className="trust-container py-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-4 text-sm">
        <div>
          <p className="font-semibold text-ink-900">TRUSTLAYER</p>
          <p className="mt-2 text-slate-600">Trade with confidence.</p>
          <p className="mt-3 text-xs text-slate-500 leading-relaxed">
            Non-custodial escrow on Solana (USDC). Not a marketplace, not legal or financial advice.
          </p>
        </div>
        <div>
          <p className="font-semibold text-ink-900">Product</p>
          <ul className="mt-2 space-y-2 text-slate-600">
            <li><Link className="hover:text-ink-900 focus:outline-none focus-visible:underline" href="/how-it-works">How it works</Link></li>
            <li><Link className="hover:text-ink-900 focus:outline-none focus-visible:underline" href="/security">Security</Link></li>
            <li><Link className="hover:text-ink-900 focus:outline-none focus-visible:underline" href="/fees">Fees</Link></li>
          </ul>
        </div>
        <div>
          <p className="font-semibold text-ink-900">Policies</p>
          <ul className="mt-2 space-y-2 text-slate-600">
            <li><Link className="hover:text-ink-900 focus:outline-none focus-visible:underline" href="/terms">Terms</Link></li>
            <li><Link className="hover:text-ink-900 focus:outline-none focus-visible:underline" href="/privacy">Privacy</Link></li>
            <li><Link className="hover:text-ink-900 focus:outline-none focus-visible:underline" href="/risk-disclosure">Risk disclosure</Link></li>
            <li><Link className="hover:text-ink-900 focus:outline-none focus-visible:underline" href="/disputes">Dispute policy</Link></li>
          </ul>
        </div>
        <div>
          <p className="font-semibold text-ink-900">Support</p>
          <ul className="mt-2 space-y-2 text-slate-600">
            <li><Link className="hover:text-ink-900 focus:outline-none focus-visible:underline" href="/support">Support</Link></li>
            <li><Link className="hover:text-ink-900 focus:outline-none focus-visible:underline" href="/status">Status</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-slate-200 py-6 text-center text-xs text-slate-500">
        © {new Date().getFullYear()} TRUSTLAYER. Draft materials require legal review before production launch.
      </div>
    </footer>
  );
}

import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="border-t border-slate-200/80 bg-white/60 backdrop-blur">
      <div className="trust-container py-12 grid gap-10 sm:grid-cols-2 lg:grid-cols-4 text-sm">
        <div className="lg:col-span-1">
          <p className="font-[family-name:var(--font-display)] font-semibold text-slate-900">TRUSTLAYER</p>
          <p className="mt-2 text-slate-600">Trade with confidence on Solana.</p>
          <p className="mt-4 text-xs text-slate-500 leading-relaxed">
            Non-custodial USDC escrow. You sign every action. Not legal or financial advice.
          </p>
        </div>
        <div>
          <p className="font-semibold text-slate-900">Product</p>
          <ul className="mt-3 space-y-2 text-slate-600">
            <li><Link href="/how-it-works" className="hover:text-slate-900">How it works</Link></li>
            <li><Link href="/security" className="hover:text-slate-900">Security</Link></li>
            <li><Link href="/fees" className="hover:text-slate-900">Fees</Link></li>
          </ul>
        </div>
        <div>
          <p className="font-semibold text-slate-900">Policies</p>
          <ul className="mt-3 space-y-2 text-slate-600">
            <li><Link href="/terms" className="hover:text-slate-900">Terms</Link></li>
            <li><Link href="/privacy" className="hover:text-slate-900">Privacy</Link></li>
            <li><Link href="/risk-disclosure" className="hover:text-slate-900">Risk disclosure</Link></li>
            <li><Link href="/disputes" className="hover:text-slate-900">Dispute policy</Link></li>
          </ul>
        </div>
        <div>
          <p className="font-semibold text-slate-900">Support</p>
          <ul className="mt-3 space-y-2 text-slate-600">
            <li><Link href="/support" className="hover:text-slate-900">Support</Link></li>
            <li><Link href="/status" className="hover:text-slate-900">Status</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-slate-200/80 py-6 text-center text-xs text-slate-500">
        © {new Date().getFullYear()} TRUSTLAYER.
      </div>
    </footer>
  );
}

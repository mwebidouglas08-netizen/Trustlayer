import Link from "next/link";

const nav = [
  { href: "/how-it-works", label: "How it works" },
  { href: "/security", label: "Security" },
  { href: "/fees", label: "Fees" },
  { href: "/disputes", label: "Disputes" },
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/70 backdrop-blur-xl">
      <div className="trust-container flex h-16 items-center justify-between gap-3">
        <Link href="/" className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-trust-700 to-teal-600 text-sm font-bold text-white shadow-lg shadow-trust-700/20">TL</span>
          <span className="font-[family-name:var(--font-display)] text-lg font-semibold tracking-tight text-slate-900">TRUSTLAYER</span>
        </Link>
        <nav className="hidden md:flex items-center gap-8 text-sm text-slate-600">
          {nav.map((item) => (
            <Link key={item.href} href={item.href} className="transition hover:text-slate-900">
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2 sm:gap-3">
          <Link
            href="/app"
            className="text-sm font-medium text-slate-700 transition hover:text-slate-900 px-2 py-2"
          >
            App
          </Link>
          <Link
            href="/app/transactions/new"
            className="rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-slate-900/15 transition hover:bg-slate-800"
          >
            New transaction
          </Link>
        </div>
      </div>
    </header>
  );
}

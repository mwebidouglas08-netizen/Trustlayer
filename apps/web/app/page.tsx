import Link from "next/link";

export default function HomePage() {
  return (
    <>
      <section className="relative overflow-hidden">
        <div className="trust-container pt-12 pb-16 sm:pt-20 sm:pb-24 lg:pt-28 lg:pb-32">
          <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-trust-200 bg-trust-50/80 px-3 py-1 text-xs font-semibold text-trust-800">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Non-custodial · Solana USDC
              </div>
              <h1 className="mt-6 font-[family-name:var(--font-display)] text-4xl font-semibold tracking-tight text-slate-900 sm:text-5xl lg:text-6xl leading-[1.1]">
                Trade with
                <span className="block bg-gradient-to-r from-trust-700 via-teal-600 to-emerald-600 bg-clip-text text-transparent">confidence on-chain.</span>
              </h1>
              <p className="mt-6 text-lg text-slate-600 leading-relaxed max-w-xl">
                Agree on terms, lock USDC in a program-controlled escrow, then release or resolve disputes with transparent rules. Built for deals that start anywhere—WhatsApp, socials, referrals.
              </p>
              <div className="mt-10 flex flex-col sm:flex-row gap-4">
                <Link
                  href="/app/transactions/new"
                  className="inline-flex items-center justify-center rounded-xl bg-slate-900 px-7 py-3.5 text-sm font-semibold text-white shadow-xl shadow-slate-900/20 transition hover:bg-slate-800"
                >
                  Create protected transaction
                </Link>
                <Link
                  href="/how-it-works"
                  className="inline-flex items-center justify-center rounded-xl border border-slate-300/90 bg-white/80 px-7 py-3.5 text-sm font-semibold text-slate-800 backdrop-blur transition hover:border-slate-400 hover:bg-white"
                >
                  How it works
                </Link>
              </div>
              <div className="mt-10 flex flex-wrap items-center gap-x-8 gap-y-3 text-sm text-slate-500">
                <span className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-emerald-500" /> You control your wallet</span>
                <span className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-trust-500" /> On-chain settlement</span>
              </div>
            </div>
            <div className="relative lg:pl-8">
              <div className="absolute -inset-4 rounded-3xl bg-gradient-to-tr from-trust-200/40 via-teal-100/30 to-emerald-100/40 blur-2xl" aria-hidden />
              <div className="relative glass-panel p-6 sm:p-8">
                <div className="flex items-center justify-between border-b border-slate-200/80 pb-4">
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Escrow preview</span>
                  <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-medium text-emerald-800">Devnet ready</span>
                </div>
                <div className="mt-6 space-y-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Asset</span>
                    <span className="font-medium text-slate-900">USDC (Solana)</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Model</span>
                    <span className="font-medium text-slate-900">Program-controlled vault</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Settlement</span>
                    <span className="font-medium text-slate-900">Release or dispute flow</span>
                  </div>
                </div>
                <div className="mt-8 rounded-xl border border-dashed border-slate-300 bg-slate-50/80 p-4 text-xs text-slate-600 leading-relaxed">
                  Connect a wallet, agree on terms off-chain first, then fund only after you review amount, mint, and network in-app.
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-slate-200/80 bg-white/50">
        <div className="trust-container py-14 sm:py-20">
          <p className="text-center text-sm font-medium text-slate-500 max-w-2xl mx-auto">
            A protection layer for direct deals—not a marketplace. You bring the counterparty; we bring structured escrow and auditability.
          </p>
          <div className="mt-12 grid gap-6 sm:grid-cols-3">
            {[
              { title: "Agree", body: "Clear terms, deadlines, and acceptance criteria hashed into the agreement version you both sign off on." },
              { title: "Secure", body: "Buyer funds a non-custodial vault. The seller cannot withdraw without the agreed on-chain path." },
              { title: "Settle", body: "Release on acceptance or use the documented dispute process with authorized resolution on-chain." },
            ].map((step, i) => (
              <div key={step.title} className="glass-panel p-6 sm:p-8">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-900 text-sm font-semibold text-white">{i + 1}</div>
                <h3 className="mt-5 font-[family-name:var(--font-display)] text-xl font-semibold text-slate-900">{step.title}</h3>
                <p className="mt-3 text-sm text-slate-600 leading-relaxed">{step.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="trust-container py-14 sm:py-20">
        <div className="grid gap-12 lg:grid-cols-2 lg:items-start">
          <div>
            <h2 className="font-[family-name:var(--font-display)] text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
              Built for real-world trust gaps
            </h2>
            <p className="mt-4 text-slate-600 leading-relaxed max-w-lg">
              From social commerce to freelance milestones, TRUSTLAYER keeps payment security, evidence, and outcomes in one verifiable flow.
            </p>
          </div>
          <ul className="grid gap-4 sm:grid-cols-2">
            {[
              "No custody by TRUSTLAYER",
              "USDC on Solana (MVP)",
              "Private evidence off-chain",
              "Human-reviewed disputes",
            ].map((t) => (
              <li key={t} className="flex items-start gap-3 rounded-xl border border-slate-200/80 bg-white/80 p-4 text-sm text-slate-700">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 text-xs">✓</span>
                {t}
              </li>
            ))}
          </ul>
        </div>
        <div className="mt-14 flex flex-col sm:flex-row flex-wrap items-center justify-center gap-4 rounded-2xl border border-slate-200 bg-gradient-to-r from-slate-50 to-white p-8 sm:p-10 text-center">
          <div>
            <p className="font-[family-name:var(--font-display)] text-xl font-semibold text-slate-900">Ready to protect your next deal?</p>
            <p className="mt-1 text-sm text-slate-600">Start in minutes. Review every on-chain step before you sign.</p>
          </div>
          <Link href="/app/transactions/new" className="inline-flex rounded-xl bg-trust-700 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-trust-700/25 hover:bg-trust-800">
            Get started
          </Link>
        </div>
      </section>
    </>
  );
}

import Link from "next/link";

export default function HomePage() {
  return (
    <>
      <section className="border-b border-slate-200 bg-white">
        <div className="trust-container py-12 sm:py-16 lg:py-20">
          <p className="text-sm font-semibold tracking-wide text-trust-700 uppercase">TRUSTLAYER</p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-ink-900 sm:text-4xl lg:text-5xl max-w-3xl">
            Trade with confidence.
          </h1>
          <p className="mt-6 text-lg text-slate-600 max-w-2xl leading-relaxed">
            Agree on terms, secure payment in a non-custodial Solana USDC escrow, and complete transactions with
            clear evidence and settlement rules. Designed for deals that begin on messaging apps, social media, or referrals.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row flex-wrap gap-3 sm:gap-4">
            <Link
              href="/app/transactions/new"
              className="inline-flex items-center justify-center rounded-md bg-trust-700 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-trust-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-trust-500 focus-visible:ring-offset-2 w-full sm:w-auto"
            >
              Create a protected transaction
            </Link>
            <Link
              href="/how-it-works"
              className="inline-flex items-center justify-center rounded-md border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-ink-800 hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-trust-500 focus-visible:ring-offset-2 w-full sm:w-auto"
            >
              See how it works
            </Link>
          </div>
        </div>
      </section>
      <section className="trust-container py-12 sm:py-16" aria-labelledby="how-heading">
        <h2 id="how-heading" className="text-2xl font-semibold text-ink-900">How it works</h2>
        <div className="mt-8 grid gap-6 sm:gap-8 sm:grid-cols-3">
          <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-xs font-semibold text-trust-700 uppercase tracking-wide">Step 1</p>
            <h3 className="mt-2 text-lg font-semibold text-ink-900">Agree</h3>
            <p className="mt-2 text-sm text-slate-600 leading-relaxed">
              Buyer and seller confirm terms, USDC amount, deadlines, and acceptance criteria before funding.
            </p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-xs font-semibold text-trust-700 uppercase tracking-wide">Step 2</p>
            <h3 className="mt-2 text-lg font-semibold text-ink-900">Secure</h3>
            <p className="mt-2 text-sm text-slate-600 leading-relaxed">
              Buyer funds a program-controlled escrow on Solana. The seller cannot withdraw funds directly.
            </p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-xs font-semibold text-trust-700 uppercase tracking-wide">Step 3</p>
            <h3 className="mt-2 text-lg font-semibold text-ink-900">Complete</h3>
            <p className="mt-2 text-sm text-slate-600 leading-relaxed">
              Buyer releases after acceptance, or disputes follow the published policy with authorized on-chain resolution.
            </p>
          </div>
        </div>
      </section>
      <section className="border-t border-slate-200 bg-slate-100/50" aria-labelledby="trust-heading">
        <div className="trust-container py-12 sm:py-16">
          <h2 id="trust-heading" className="text-2xl font-semibold text-ink-900">Built for clarity and safety</h2>
          <ul className="mt-6 grid gap-4 sm:grid-cols-2 text-sm text-slate-700 list-disc list-inside max-w-4xl leading-relaxed">
            <li>You sign with your own wallet; TRUSTLAYER does not hold your keys.</li>
            <li>USDC on Solana in the initial product flow, with clear network fee guidance.</li>
            <li>Private evidence is stored off-chain with access controls, not on public chain data.</li>
            <li>Disputes are human-reviewed under policy; AI may assist summaries only.</li>
          </ul>
          <p className="mt-8 text-sm text-slate-600 flex flex-wrap gap-x-2 gap-y-1">
            <Link className="text-trust-700 underline focus:outline-none focus-visible:ring-2 focus-visible:ring-trust-500 rounded-sm" href="/security">Security model</Link>
            <span aria-hidden="true">·</span>
            <Link className="text-trust-700 underline focus:outline-none focus-visible:ring-2 focus-visible:ring-trust-500 rounded-sm" href="/fees">Fees</Link>
            <span aria-hidden="true">·</span>
            <Link className="text-trust-700 underline focus:outline-none focus-visible:ring-2 focus-visible:ring-trust-500 rounded-sm" href="/risk-disclosure">Risk disclosure</Link>
          </p>
        </div>
      </section>
    </>
  );
}

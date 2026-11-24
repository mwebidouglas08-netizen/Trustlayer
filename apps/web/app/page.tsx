export default function HomePage() {
  return (
    <>
      <section className="border-b border-slate-200 bg-white">
        <div className="trust-container py-10 sm:py-16 lg:py-24">
          <p className="text-xs sm:text-sm font-semibold tracking-wide text-trust-700 uppercase">TRUSTLAYER</p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-ink-900 sm:text-4xl lg:text-5xl max-w-3xl text-balance">
            Trade with confidence.
          </h1>
          <p className="mt-5 sm:mt-6 text-base sm:text-lg text-slate-600 max-w-2xl leading-relaxed">
            Agree on the terms. Secure the payment in Solana USDC escrow. Complete the deal with evidence
            and clear settlement rules. Built for direct transactions that start on WhatsApp, social media,
            or referrals.
          </p>
          <div className="mt-8 sm:mt-10 flex flex-col sm:flex-row flex-wrap gap-3 sm:gap-4">
            <a
              href="/app/transactions/new"
              className="inline-flex items-center justify-center rounded-md bg-trust-700 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-trust-800 focus:outline-none focus:ring-2 focus:ring-trust-500 focus:ring-offset-2 w-full sm:w-auto"
            >
              Create a protected transaction
            </a>
            <a
              href="/how-it-works"
              className="inline-flex items-center justify-center rounded-md border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-ink-800 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-trust-500 focus:ring-offset-2 w-full sm:w-auto"
            >
              See how it works
            </a>
          </div>
        </div>
      </section>
      <section className="trust-container py-12 sm:py-16">
        <h2 className="text-xl sm:text-2xl font-semibold text-ink-900">How it works</h2>
        <div className="mt-6 sm:mt-8 grid gap-6 sm:gap-8 sm:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-lg border border-slate-200 bg-white p-5 sm:p-6 shadow-sm">
            <p className="text-xs font-semibold text-trust-700 uppercase tracking-wide">Step 1</p>
            <h3 className="mt-2 text-lg font-semibold text-ink-900">Agree</h3>
            <p className="mt-2 text-sm text-slate-600 leading-relaxed">
              Buyer and seller confirm terms, amount in USDC, deadlines, and acceptance criteria before
              funding.
            </p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white p-5 sm:p-6 shadow-sm">
            <p className="text-xs font-semibold text-trust-700 uppercase tracking-wide">Step 2</p>
            <h3 className="mt-2 text-lg font-semibold text-ink-900">Secure</h3>
            <p className="mt-2 text-sm text-slate-600 leading-relaxed">
              Buyer funds a non-custodial Solana escrow vault controlled by the program. Seller cannot
              withdraw directly.
            </p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white p-5 sm:p-6 shadow-sm sm:col-span-2 lg:col-span-1">
            <p className="text-xs font-semibold text-trust-700 uppercase tracking-wide">Step 3</p>
            <h3 className="mt-2 text-lg font-semibold text-ink-900">Complete</h3>
            <p className="mt-2 text-sm text-slate-600 leading-relaxed">
              Buyer releases after acceptance, or a disclosed dispute process handles outcomes under policy.
            </p>
          </div>
        </div>
      </section>
      <section className="border-t border-slate-200 bg-slate-100/50">
        <div className="trust-container py-12 sm:py-16">
          <h2 className="text-xl sm:text-2xl font-semibold text-ink-900">Built for clarity and safety</h2>
          <ul className="mt-6 grid gap-3 sm:gap-4 sm:grid-cols-2 text-sm text-slate-700 list-disc list-inside max-w-4xl leading-relaxed">
            <li>No custody by TRUSTLAYER: you sign with your own wallet.</li>
            <li>USDC on Solana only in MVP (with clear network fee guidance).</li>
            <li>Private evidence stored securely; not written to public chain data.</li>
            <li>Disputes are human-reviewed under a published policy — AI assists summaries only.</li>
          </ul>
          <p className="mt-8 text-sm text-slate-600 flex flex-wrap gap-x-2 gap-y-1">
            <a className="text-trust-700 underline" href="/security">Security model</a>
            <span aria-hidden="true">·</span>
            <a className="text-trust-700 underline" href="/fees">Fees</a>
            <span aria-hidden="true">·</span>
            <a className="text-trust-700 underline" href="/risk-disclosure">Risk disclosure</a>
          </p>
        </div>
      </section>
    </>
  );
}

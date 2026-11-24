export default function NewTransactionPage() {
  return (
    <div className="trust-container py-10 max-w-2xl">
      <h1 className="text-2xl font-semibold text-ink-900">Create protected transaction</h1>
      <p className="mt-2 text-sm text-slate-600 leading-relaxed">
        This is a draft interface. Full flow (validation, invitations, agreement hashing, on-chain funding) requires backend and wallet integration.
      </p>
      <form className="mt-8 space-y-6" action="#" aria-describedby="new-tx-note">
        <div>
          <label className="block text-sm font-medium text-ink-800" htmlFor="title">Title</label>
          <input id="title" name="title" className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-trust-500" placeholder="e.g. MacBook Pro sale" disabled />
        </div>
        <div>
          <label className="block text-sm font-medium text-ink-800" htmlFor="amount">Amount (USDC)</label>
          <input id="amount" name="amount" inputMode="decimal" className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-trust-500" placeholder="0.00" disabled />
        </div>
        <p id="new-tx-note" className="text-xs text-slate-500 leading-relaxed">
          Do not enter sensitive personal data here in this draft. Final implementation must validate server-side, hash agreements, and never store private evidence on-chain.
        </p>
        <button type="button" disabled className="rounded-md bg-slate-300 px-4 py-2 text-sm font-semibold text-slate-600 cursor-not-allowed" aria-disabled="true">
          Save draft (connect backend)
        </button>
      </form>
    </div>
  );
}

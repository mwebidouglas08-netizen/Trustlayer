"use client";
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <main id="main-content" className="empty-state">
      <h1>Something didn’t load</h1>
      <p>
        Your funds remain on-chain. Check any pending transaction in Explorer
        before retrying.
      </p>
      <button className="btn primary" onClick={reset}>
        Try again
      </button>
    </main>
  );
}

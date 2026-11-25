import Link from "next/link";
export default function NotFound() {
  return (
    <main id="main-content" className="empty-state">
      <h1>Page not found</h1>
      <p>That page doesn’t exist. Your wallet workspace is one click away.</p>
      <Link className="btn primary" href="/app">
        Back to workspace
      </Link>
    </main>
  );
}

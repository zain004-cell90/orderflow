"use client";
import Link from "next/link";
export default function ErrorPage({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="error-recovery">
      <div className="card">
        <h1>We could not load this page.</h1>
        <p>Try the action again or return to the homepage.</p>
        <div>
          <button className="btn-primary" onClick={reset}>
            Try again
          </button>
          <Link className="btn-secondary" href="/">
            Go home
          </Link>
        </div>
      </div>
    </main>
  );
}

"use client";
import Link from "next/link";
export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body>
        <main className="error-recovery">
          <div className="card">
            <span>OrderFlow</span>
            <h1>Something went wrong.</h1>
            <p>
              We could not load this page. Your locally saved data has not been
              removed.
            </p>
            <button className="btn-primary" onClick={reset}>
              Try again
            </button>
            <Link className="btn-secondary" href="/">
              Go home
            </Link>
          </div>
        </main>
      </body>
    </html>
  );
}

"use client";

import { useEffect } from "react";
import Link from "next/link";

/**
 * The route error boundary.
 *
 * Reached when a route throws while rendering. That should be rare here —
 * `getSiteContent()` and `getBookingConfig()` both swallow backend failure and
 * fall back rather than throwing — so this covers the genuinely unexpected, and
 * says so rather than guessing at a cause it does not know.
 *
 * `error.digest` is deliberately the only detail shown. Next replaces the real
 * message with that hash in production precisely so a stack trace does not
 * reach the browser; printing `error.message` would either be the same hash or,
 * in development, an internal detail a customer cannot use. The digest is worth
 * showing because it is the one thing that lets someone match this screen to a
 * line in the server log.
 *
 * Must be a client component — the boundary needs `reset`, and Next requires it.
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // The server log has the real trace; this is the browser-side half, and it
    // is what makes a client-only fault visible at all. Kept to the console
    // rather than sent anywhere — there is no error reporting service wired up.
    console.error("[route error]", error);
  }, [error]);

  return (
    <main className="flex flex-1 items-center justify-center bg-[#0a0a0a] px-5 py-28 sm:py-32">
      <div className="w-full max-w-[520px] text-center">
        <h1 className="text-foreground text-[clamp(28px,5.5vw,44px)] leading-[1.1] font-bold">
          Something went wrong
        </h1>
        <p className="text-muted-foreground mt-4 text-[15px] leading-relaxed">
          This is a fault on our side, not something you did. Trying again often
          clears it — if it does not, please call us and we will help directly.
        </p>

        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <button
            type="button"
            onClick={reset}
            className="bg-primary text-primary-foreground rounded-full px-8 py-3 text-sm font-bold transition-opacity hover:opacity-90"
          >
            Try again
          </button>
          <Link
            href="/"
            className="border-border text-foreground hover:border-foreground/40 rounded-full border px-8 py-3 text-sm font-bold transition-colors"
          >
            Back to home
          </Link>
        </div>

        {error.digest ? (
          <p className="text-muted-foreground mt-10 font-mono text-xs">
            Reference {error.digest}
          </p>
        ) : null}
      </div>
    </main>
  );
}

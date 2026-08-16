import type { Metadata } from "next";
import Link from "next/link";

/**
 * 404.
 *
 * The root layout still renders around this — header, footer and all — so a
 * mistyped URL keeps the site's navigation instead of dropping the visitor onto
 * a bare page with no way out. This file supplies only the body.
 *
 * The links are the two a lost visitor actually wants: back to the front, or
 * straight to booking, which is what the site is for.
 */

export const metadata: Metadata = {
  title: "Page not found",
  // A 404 in the index is a bad search result whatever it says.
  robots: { index: false, follow: true },
};

export default function NotFound() {
  return (
    <main className="flex flex-1 items-center justify-center bg-[#0a0a0a] px-5 py-28 sm:py-32">
      <div className="w-full max-w-[520px] text-center">
        <p className="text-primary font-mono text-sm font-bold tracking-[0.2em] uppercase">
          404
        </p>
        <h1 className="text-foreground mt-4 text-[clamp(30px,6vw,48px)] leading-[1.1] font-bold">
          We could not find that page
        </h1>
        <p className="text-muted-foreground mt-4 text-[15px] leading-relaxed">
          The link may be out of date, or the page may have moved. Everything
          else is still where you left it.
        </p>

        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <Link
            href="/"
            className="bg-primary text-primary-foreground rounded-full px-8 py-3 text-sm font-bold transition-opacity hover:opacity-90"
          >
            Back to home
          </Link>
          <Link
            href="/contact"
            className="border-border text-foreground hover:border-foreground/40 rounded-full border px-8 py-3 text-sm font-bold transition-colors"
          >
            Contact us
          </Link>
        </div>
      </div>
    </main>
  );
}

/**
 * Shown when a page's content has never loaded from the backend — a genuine
 * outage, or the very first render before Django is reachable. Deliberately
 * honest and small: it says the page is updating rather than dressing the
 * screen in invented content. Once the backend answers once, ISR serves the
 * real, cached page and this is not reached again.
 *
 * Not an error page. The nav and footer around it still render (the layout
 * keeps a minimal structural chrome), so a visitor can move elsewhere and the
 * page quietly fills in on the next successful revalidation.
 */
export function ContentUnavailable({
  what = "This page",
}: {
  what?: string;
}) {
  return (
    <main className="flex-1">
      <section className="container-edge below-header flex min-h-[60svh] flex-col items-center justify-center gap-4 py-24 text-center">
        <p className="text-accent font-display text-sm font-bold tracking-[0.2em] uppercase">
          One moment
        </p>
        <h1 className="max-w-[24ch] text-[clamp(24px,5vw,40px)] leading-tight font-bold text-white">
          {what} is updating
        </h1>
        <p className="text-muted max-w-[48ch] text-[clamp(14px,2.2vw,18px)] leading-relaxed">
          We&rsquo;re fetching the latest from the salon. Please refresh in a
          moment.
        </p>
      </section>
    </main>
  );
}

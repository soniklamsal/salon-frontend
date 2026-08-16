/**
 * The site's own canonical origin.
 *
 * Distinct from `SALON_API_URL`, which is where the Django backend lives — this
 * is where *this* app is served from, and it is what `metadataBase`, the
 * sitemap and robots.txt all resolve their absolute URLs against.
 *
 * Server-only (no `NEXT_PUBLIC_` prefix) because nothing in the browser needs
 * it: metadata, `sitemap.ts` and `robots.ts` all run on the server.
 *
 * The default is the dev origin, which keeps `next build` working in a checkout
 * with no `.env.local`. In production this must be set — an unset value would
 * publish `http://localhost:3000` as the canonical URL in every Open Graph tag
 * and sitemap entry, which is worse than having no tags at all. That is not a
 * hypothetical: it is what the site was doing before `warnIfUnconfigured()`
 * below existed, and nothing said so.
 */
export const SITE_URL = (
  process.env.SALON_SITE_URL ?? "http://localhost:3000"
).replace(/\/$/, "");

/** Whether `SALON_SITE_URL` was actually configured, as opposed to defaulted. */
export const SITE_URL_CONFIGURED = Boolean(process.env.SALON_SITE_URL);

/**
 * Complain, loudly and once, if a production build is about to publish
 * localhost as the site's identity.
 *
 * Deliberately a warning rather than a thrown error. Failing the build would
 * make `next build` impossible in a checkout that only wants to typecheck, and
 * the person who needs to see this is deploying — so it is written to land in
 * the deploy log next to the build output. Called from `generateMetadata`,
 * `sitemap` and `robots`, which are the three places the value escapes into
 * something a crawler reads.
 */
let warned = false;
export function warnIfUnconfigured() {
  if (SITE_URL_CONFIGURED || warned || process.env.NODE_ENV !== "production") {
    return;
  }
  warned = true;
  console.warn(
    "[site] SALON_SITE_URL is not set. Canonical URLs, Open Graph tags, the " +
      `sitemap and robots.txt will all publish ${SITE_URL}, which no crawler ` +
      "can reach. Set SALON_SITE_URL to the production origin before deploying."
  );
}

/**
 * The absolute URL for a site-relative path.
 *
 * One place that knows how to join the two, so a canonical tag and the sitemap
 * entry for the same route cannot disagree about the trailing slash. `/` maps
 * to the bare origin, which is what the homepage's canonical was already doing
 * and what Next emits for `metadataBase` on its own.
 */
export function absoluteUrl(path: string): string {
  if (path === "/") return SITE_URL;
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

/**
 * The `alternates` + `openGraph.url` pair for one route.
 *
 * Both have to be set per route and both were previously inherited from the
 * root layout, so every page on the site declared the homepage as its canonical
 * and its share URL. A crawler reads that as "this page is a duplicate of the
 * homepage" and drops it from the index — which it had already started doing.
 *
 * Returned as a fragment to spread into a route's `Metadata`, rather than a
 * whole `Metadata` object, so a route keeps control of its own title and
 * description.
 */
export function canonicalMetadata(path: string) {
  return {
    alternates: { canonical: path },
    openGraph: { url: absoluteUrl(path) },
  };
}

/**
 * Routes worth listing in the sitemap.
 *
 * Only the public ones. `/services` and `/status` need an account, and
 * `/sign-in` and `/sign-up` are plumbing — none of them belong in an index.
 * Kept in step with `PRIVATE_ROUTES` below: between them they must cover every
 * route the app serves, or a new page silently gets neither treatment.
 */
export const PUBLIC_ROUTES = ["/", "/about-us", "/contact"] as const;

/**
 * Routes that must not be indexed, and the `robots` directive that says so.
 *
 * robots.txt already disallows these, but a disallowed URL can still be indexed
 * without its content if something links to it — and a crawler that is refused
 * the page never reads a meta tag on it. Setting the directive here covers the
 * case where the route is reachable (a signed-in crawler, a changed
 * robots.txt), and costs nothing where it is not.
 */
export const NOINDEX = {
  robots: { index: false, follow: false },
} as const;

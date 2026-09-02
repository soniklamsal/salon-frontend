import type { SiteContent } from "@/lib/types/content-types";

/**
 * Server-side reader for the Django backend.
 *
 * One request serves the whole page: `/api/v1/homepage/` returns every band in
 * a single payload, and Next memoizes identical `fetch` calls within a render
 * pass, so the layout and the page can each call `getSiteContent()` and only
 * one request leaves the process.
 *
 * Returns `null` when the backend cannot be reached, rather than inventing
 * content. The old behaviour substituted a bundled copy, which is exactly what
 * this removes: a customer must see the salon's real content or a clear
 * loading/updating state, never a made-up hero, gallery or price. Callers
 * decide what a `null` looks like — a page renders `ContentUnavailable`, the
 * layout falls back to a minimal structural chrome so the nav and footer still
 * render. Successful renders are cached (ISR, below), so a brief outage or a
 * Render cold-start keeps serving the last real page rather than nothing.
 */

const API_BASE = (
  process.env.NEXT_PUBLIC_SALON_API_URL ?? "http://localhost:8000/api/v1"
).replace(/\/$/, "");

// Seconds. The page is prerendered and refreshed on this interval, so an admin
// edit shows up within a minute without a redeploy. It is also what makes the
// site resilient: the last good render is served while a new one is fetched.
const REVALIDATE_SECONDS = Number(process.env.SALON_API_REVALIDATE ?? 60);

// A stopped backend should fail fast rather than hold the render open. A cold
// Render free-tier instance can take longer than this to wake; that first
// request then serves the cached page (or the loading skeleton) while the
// background revalidation waits for the backend.
const TIMEOUT_MS = Number(process.env.SALON_API_TIMEOUT_MS ?? 4000);

/** The array bands the page and layout iterate. Guaranteed present so a
 *  backend that omits one degrades to an empty section, never a crash. */
function normalize(payload: Partial<SiteContent>): SiteContent {
  return {
    ...(payload as SiteContent),
    navLinks: payload.navLinks ?? [],
    footerLinks: payload.footerLinks ?? [],
    socialLinks: payload.socialLinks ?? [],
  };
}

export async function getSiteContent(): Promise<SiteContent | null> {
  try {
    const response = await fetch(`${API_BASE}/homepage/`, {
      headers: { Accept: "application/json" },
      // Not `no-store`: the content changes when someone edits it, not on every
      // request, so the page is worth prerendering and caching.
      next: { revalidate: REVALIDATE_SECONDS, tags: ["site-content"] },
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });

    if (!response.ok) {
      throw new Error(`${response.status} ${response.statusText}`);
    }

    return normalize((await response.json()) as Partial<SiteContent>);
  } catch (error) {
    // Warn, and return null. The page shows a loading/updating state and, once
    // it has rendered once, the cached copy keeps serving.
    console.warn(
      `[content] ${API_BASE}/homepage/ unavailable (${
        error instanceof Error ? error.message : String(error)
      }) — no cached content to serve yet.`
    );
    return null;
  }
}

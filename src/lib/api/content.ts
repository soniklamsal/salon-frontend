import type { SiteContent } from "@/lib/types/content-types";
import fallbackHomepage from "@/lib/data/fallback-homepage.json";

/**
 * Server-side reader for the Django backend.
 *
 * One request serves the whole page: `/api/v1/homepage/` returns every band in
 * a single payload, and Next memoizes identical `fetch` calls within a render
 * pass, so the layout and the page can each call `getSiteContent()` and only
 * one request leaves the process.
 *
 * FALLBACK BEHAVIOR: When the backend is unreachable, returns static fallback
 * data captured from the live backend. This ensures the site remains functional
 * and displays real content even during backend maintenance or connectivity issues.
 * The fallback data is stored in `lib/data/fallback-homepage.json` and should be
 * updated periodically to reflect current salon information.
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

// Enable/disable fallback data when backend is unavailable
const USE_FALLBACK_DATA = process.env.NEXT_PUBLIC_USE_FALLBACK_DATA !== "false";

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
    console.warn(
      `[content] ${API_BASE}/homepage/ unavailable (${
        error instanceof Error ? error.message : String(error)
      }) — ${USE_FALLBACK_DATA ? "serving fallback data" : "no cached content to serve yet"}.`
    );
    
    // Return fallback data when backend is unavailable
    if (USE_FALLBACK_DATA) {
      console.info("[content] Using fallback homepage data");
      return normalize(fallbackHomepage as Partial<SiteContent>);
    }
    
    return null;
  }
}

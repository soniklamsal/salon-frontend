import { FALLBACK_CONTENT } from "@/lib/fallbacks/content-fallback";
import type { SiteContent } from "@/lib/types/content-types";

/**
 * Server-side reader for the Django backend.
 *
 * One request serves the whole page: `/api/v1/homepage/` returns every band in
 * a single payload, and Next memoizes identical `fetch` calls within a render
 * pass, so the layout and the page can each call `getSiteContent()` and only
 * one request leaves the process.
 *
 * Failure is never fatal. Anything short of a well-formed 200 falls back to
 * `FALLBACK_CONTENT` — the copy the site shipped with — so a stopped backend
 * costs you the ability to edit content, not the ability to serve the site.
 * That also means `next build` works with nothing else running.
 */

const API_BASE = (
  process.env.SALON_API_URL ?? "http://127.0.0.1:8001/api/v1"
).replace(/\/$/, "");

// Seconds. The page is prerendered and refreshed on this interval, so an admin
// edit shows up within a minute without a redeploy.
const REVALIDATE_SECONDS = Number(process.env.SALON_API_REVALIDATE ?? 60);

// A stopped backend should fail fast rather than hold the render open.
const TIMEOUT_MS = Number(process.env.SALON_API_TIMEOUT_MS ?? 4000);

/** Uses `fallback` when the API omits a key entirely; an empty array is a real answer. */
function pick<T>(value: T | undefined | null, fallback: T): T {
  return value === undefined || value === null ? fallback : value;
}

/**
 * Fills gaps in a payload from the fallback, one section at a time.
 *
 * A backend that grows a field before this app knows about it is harmless; a
 * backend that is missing one this app renders would otherwise throw deep
 * inside a component. Object sections are merged key-by-key so a partial
 * section still renders, arrays are taken whole.
 */
function withFallbacks(payload: Partial<SiteContent>): SiteContent {
  const f = FALLBACK_CONTENT;
  return {
    site: { ...f.site, ...payload.site },
    navLinks: pick(payload.navLinks, f.navLinks),
    footerLinks: pick(payload.footerLinks, f.footerLinks),
    socialLinks: pick(payload.socialLinks, f.socialLinks),
    hero: { ...f.hero, ...payload.hero },
    whoWeAre: { ...f.whoWeAre, ...payload.whoWeAre },
    motivation: { ...f.motivation, ...payload.motivation },
    gallery: { ...f.gallery, ...payload.gallery },
    classes: { ...f.classes, ...payload.classes },
    ourStory: { ...f.ourStory, ...payload.ourStory },
    asSeenOn: { ...f.asSeenOn, ...payload.asSeenOn },
    followUs: { ...f.followUs, ...payload.followUs },
    footer: { ...f.footer, ...payload.footer },
  };
}

export async function getSiteContent(): Promise<SiteContent> {
  try {
    const response = await fetch(`${API_BASE}/homepage/`, {
      headers: { Accept: "application/json" },
      // Not `no-store`: the content changes when someone edits it, not on every
      // request, so the page is worth prerendering.
      next: { revalidate: REVALIDATE_SECONDS, tags: ["site-content"] },
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });

    if (!response.ok) {
      throw new Error(`${response.status} ${response.statusText}`);
    }

    return withFallbacks((await response.json()) as Partial<SiteContent>);
  } catch (error) {
    // Warn rather than throw: the page still renders, just from bundled copy.
    console.warn(
      `[content] ${API_BASE}/homepage/ unavailable (${
        error instanceof Error ? error.message : String(error)
      }) — serving bundled fallback content.`
    );
    return FALLBACK_CONTENT;
  }
}

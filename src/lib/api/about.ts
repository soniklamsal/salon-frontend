/**
 * Server-side reader for the About page.
 *
 * Mirrors `lib/api/content.ts`: one request serves the whole page and failure
 * is never fatal -- a stopped backend costs the ability to *edit* the page, not
 * the ability to serve it.
 */

import { FALLBACK_ABOUT } from "@/lib/fallbacks/about-fallback";
import type { AboutContent } from "@/lib/types/about-types";

const API_BASE = (
  process.env.NEXT_PUBLIC_SALON_API_URL ?? "http://localhost:8000/api/v1"
).replace(/\/$/, "");

const REVALIDATE_SECONDS = Number(process.env.SALON_API_REVALIDATE ?? 60);
const TIMEOUT_MS = Number(process.env.SALON_API_TIMEOUT_MS ?? 4000);

/** Uses `fallback` when the API omits a key entirely; an empty array is a real answer. */
function pick<T>(value: T | undefined | null, fallback: T): T {
  return value === undefined || value === null ? fallback : value;
}

/**
 * Like `pick`, but an empty string also counts as "not set".
 *
 * Only for image URLs, and deliberately not for text. Django serialises an
 * ImageField with nothing uploaded as `""`, not as a missing key, so the
 * spread below would otherwise overwrite the bundled hero with an empty
 * string -- and `<Image src="">` makes the browser re-request the page as if
 * it were the image.
 *
 * Text is left alone on purpose: a blank heading or date is a real editorial
 * choice someone made in the admin, and quietly restoring the shipped copy
 * over it would make the field impossible to clear.
 */
function pickImage(value: string | undefined | null, fallback: string): string {
  return value ? value : fallback;
}

function withFallbacks(payload: Partial<AboutContent>): AboutContent {
  const f = FALLBACK_ABOUT;
  return {
    ...f,
    ...payload,
    // The hero photograph is optional in the admin, so "no image chosen"
    // arrives as "" and has to be caught after the spread above.
    heroImage: pickImage(payload.heroImage, f.heroImage),
    // Arrays are taken whole, but only when the key was actually sent: a
    // backend that has not been migrated yet would otherwise blank the page.
    columns: pick(payload.columns, f.columns),
    stats: pick(payload.stats, f.stats),
    team: pick(payload.team, f.team),
    ctaPrimary: { ...f.ctaPrimary, ...payload.ctaPrimary },
    ctaSecondary: { ...f.ctaSecondary, ...payload.ctaSecondary },
  };
}

export async function getAboutContent(): Promise<AboutContent> {
  try {
    const response = await fetch(`${API_BASE}/about/`, {
      headers: { Accept: "application/json" },
      next: { revalidate: REVALIDATE_SECONDS, tags: ["about-content"] },
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });

    if (!response.ok) {
      throw new Error(`${response.status} ${response.statusText}`);
    }

    return withFallbacks((await response.json()) as Partial<AboutContent>);
  } catch (error) {
    console.warn(
      `[about] ${API_BASE}/about/ unavailable (${
        error instanceof Error ? error.message : String(error)
      }) — serving bundled fallback content.`
    );
    return FALLBACK_ABOUT;
  }
}

/**
 * Server-side reader for the About page.
 *
 * Mirrors `lib/api/content.ts`: one request serves the whole page, and when
 * the backend cannot be reached, returns fallback data from the last known
 * good state. The page renders real salon information even during backend
 * maintenance or connectivity issues.
 */

import type { AboutContent } from "@/lib/types/about-types";
import fallbackAbout from "@/lib/data/fallback-about.json";

const API_BASE = (
  process.env.NEXT_PUBLIC_SALON_API_URL ?? "http://localhost:8000/api/v1"
).replace(/\/$/, "");

const REVALIDATE_SECONDS = Number(process.env.SALON_API_REVALIDATE ?? 60);
const TIMEOUT_MS = Number(process.env.SALON_API_TIMEOUT_MS ?? 4000);
const USE_FALLBACK_DATA = process.env.NEXT_PUBLIC_USE_FALLBACK_DATA !== "false";

/** The array bands the page iterates, guaranteed present so an omitted one
 *  degrades to an empty section rather than a crash. */
function normalize(payload: Partial<AboutContent>): AboutContent {
  return {
    ...(payload as AboutContent),
    columns: payload.columns ?? [],
    stats: payload.stats ?? [],
    team: payload.team ?? [],
  };
}

export async function getAboutContent(): Promise<AboutContent | null> {
  try {
    const response = await fetch(`${API_BASE}/about/`, {
      headers: { Accept: "application/json" },
      next: { revalidate: REVALIDATE_SECONDS, tags: ["about-content"] },
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });

    if (!response.ok) {
      throw new Error(`${response.status} ${response.statusText}`);
    }

    return normalize((await response.json()) as Partial<AboutContent>);
  } catch (error) {
    console.warn(
      `[about] ${API_BASE}/about/ unavailable (${
        error instanceof Error ? error.message : String(error)
      }) — ${USE_FALLBACK_DATA ? "serving fallback data" : "no cached content to serve yet"}.`
    );
    
    // Return fallback data when backend is unavailable
    if (USE_FALLBACK_DATA) {
      console.info("[about] Using fallback about data");
      return normalize(fallbackAbout as Partial<AboutContent>);
    }
    
    return null;
  }
}

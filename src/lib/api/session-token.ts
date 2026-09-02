import { API_TOKEN_PATH } from "@/lib/auth";

/**
 * Fetches a token for calling the Django API, and reuses it until it is nearly
 * expired.
 *
 * This is the shape Clerk's `getToken()` had, kept deliberately: the booking
 * form, the contact form and the status list all called that and all still
 * call this, so the swap did not spread into three components that have no
 * business knowing how auth works.
 *
 * The cache is what makes it a fair replacement. Clerk kept the session token
 * in memory and handed it over synchronously; here every call would otherwise
 * be a round trip to our own server. Tokens live five minutes and are reused
 * until one minute before expiry, so a booking flow that posts a form and then
 * loads the status page makes one request, not two.
 *
 * Module-level rather than per-component: the cache should be shared across
 * every caller on the page, and it is per-tab and lost on reload, which is the
 * right lifetime for a five-minute credential.
 */

type Cached = { token: string; expiresAt: number };

let cached: Cached | null = null;
// Requests in flight, so three components mounting at once ask once.
let inFlight: Promise<string | null> | null = null;

/** Refresh this long before expiry, so a token cannot die mid-request. */
const REFRESH_MARGIN_MS = 60_000;

function isFresh(entry: Cached | null): entry is Cached {
  return entry !== null && Date.now() < entry.expiresAt - REFRESH_MARGIN_MS;
}

async function request(): Promise<string | null> {
  try {
    const response = await fetch(API_TOKEN_PATH, {
      // The session cookie is the credential here, and this is same-origin.
      credentials: "same-origin",
      // Never a cached answer: the token has an expiry and a stale one is
      // worse than none, because it fails verification rather than degrading
      // to an anonymous booking.
      cache: "no-store",
    });

    // 401 is the ordinary signed-out case, not a fault. 503 means the shared
    // secret is missing on the server, which it has already logged.
    if (!response.ok) {
      cached = null;
      return null;
    }

    const data = (await response.json()) as { token?: string; expiresIn?: number };
    if (!data.token) return null;

    cached = {
      token: data.token,
      expiresAt: Date.now() + (data.expiresIn ?? 300) * 1000,
    };
    return data.token;
  } catch {
    // Offline, or the route is unreachable. The callers all treat null as
    // "post without an account" rather than failing the customer's booking.
    cached = null;
    return null;
  }
}

export async function getApiToken(): Promise<string | null> {
  if (isFresh(cached)) return cached.token;
  // Collapse concurrent callers onto one request.
  inFlight ??= request().finally(() => {
    inFlight = null;
  });
  return inFlight;
}

/**
 * Drops the cached token.
 *
 * Called on sign-out so the next caller cannot keep using a token minted for
 * the account that just left — it would still verify until it expired.
 */
export function clearApiToken() {
  cached = null;
  inFlight = null;
}

/**
 * `Authorization` header for an API call, or `{}` when signed out.
 *
 * Callers spread this rather than branching, which is what keeps "a missing
 * token is not an error" true in every one of them.
 */
export async function authHeader(): Promise<Record<string, string>> {
  const token = await getApiToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

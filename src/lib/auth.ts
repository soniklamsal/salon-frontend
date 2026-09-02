/**
 * Whether Google sign-in is switched on.
 *
 * Everything auth-related in this app is behind this flag, so the site runs
 * unchanged until the credentials exist. It is a *server-only* check — the
 * three values it reads have no `NEXT_PUBLIC_` prefix and must not get one,
 * because `GOOGLE_CLIENT_SECRET` and `SALON_AUTH_SECRET` would then be inlined
 * into the browser bundle.
 *
 * Client components therefore do not call this. The root layout calls it once
 * and passes the answer to `AuthProvider`, which puts it in context — see
 * features/auth/components/auth-provider.tsx. That is the only way the browser
 * learns the flag, and all it learns is a boolean.
 *
 * This is looser than the Clerk arrangement it replaces, and can afford to be.
 * `ClerkProvider` threw at render without a key, so the guard had to wrap the
 * provider itself or every page died. `SessionProvider` does not throw — an
 * unconfigured app simply reports nobody signed in — so the flag is now only
 * about what to *show*, not about staying up.
 */
export function isAuthConfigured(): boolean {
  return Boolean(
    process.env.GOOGLE_CLIENT_ID &&
      process.env.GOOGLE_CLIENT_SECRET &&
      process.env.AUTH_SECRET
  );
}

/**
 * Whether this app can mint tokens the Django API will accept.
 *
 * Separate from `isAuthConfigured` because they fail separately, and the
 * difference matters when something is wrong: sign-in working while bookings
 * save anonymously is exactly the symptom of this one secret being absent or
 * not matching `SALON_AUTH_SECRET` on the Django side.
 */
export function isApiTokenConfigured(): boolean {
  return Boolean(process.env.SALON_AUTH_SECRET);
}

/**
 * Routes that require an account.
 *
 * Read by the proxy, which redirects before a route can start streaming. Each
 * page also checks for itself — that is the authoritative guard; this list
 * only decides where the redirect happens early enough to be a real 307.
 */
export const PROTECTED_PATHS = ["/services", "/status"];

export const SIGN_IN_PATH = "/sign-in";
export const SIGN_UP_PATH = "/sign-up";

/**
 * Where the browser asks for a token to call Django with.
 *
 * Same-origin, so no CORS and no key in the bundle: the route reads the
 * session cookie on the server and signs the token there.
 */
export const API_TOKEN_PATH = "/api/auth/backend-token";

/** Claims the API token carries. Must stay in step with backend settings. */
export const API_TOKEN_ISSUER = "salon-frontend";
export const API_TOKEN_AUDIENCE = "salon-api";
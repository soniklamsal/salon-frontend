/**
 * Whether Clerk is switched on.
 *
 * Everything auth-related in this app is behind this flag, so the site runs
 * unchanged until the two keys exist. That is not a convenience: `ClerkProvider`
 * throws at render when the publishable key is missing, so without this guard a
 * checkout with no `.env.local` would fail to boot every page rather than just
 * the booking gate.
 *
 * `NEXT_PUBLIC_` because the check runs in the browser as well as on the
 * server — Next inlines it at build time, so it must be referenced as a full
 * literal (`process.env.NEXT_PUBLIC_...`), never assembled from a variable.
 */
export const CLERK_ENABLED = Boolean(
  process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
);

/**
 * Routes that require an account.
 *
 * Read by the middleware, which redirects before a route can start streaming.
 * Each page also checks for itself — that is the authoritative guard; this
 * list only decides where the redirect happens early enough to be a real 307.
 */
export const PROTECTED_PATHS = ["/services", "/status"];

export const SIGN_IN_PATH = "/sign-in";
export const SIGN_UP_PATH = "/sign-up";

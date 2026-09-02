import { handlers } from "@/auth";

/**
 * Auth.js's own endpoints: the Google redirect, the callback, sign-out, and
 * the session lookup `useSession()` polls.
 *
 * The whole file is two lines by design — the configuration lives in
 * `src/auth.ts` so that `auth()` can be imported by server components and the
 * proxy without pulling a route handler in with it.
 */
export const { GET, POST } = handlers;

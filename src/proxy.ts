import { NextResponse, type NextRequest } from "next/server";

import { auth } from "@/auth";
import { PROTECTED_PATHS, SIGN_IN_PATH } from "@/lib/auth";

/**
 * Bounces signed-out visitors off the private routes before those routes start
 * rendering.
 *
 * Named `proxy.ts` rather than `middleware.ts`: Next 16 deprecated the
 * `middleware` file convention and renamed it to `proxy` — the build warns on
 * the old name. Same execution model, same `config.matcher`.
 *
 * The authoritative check is still in the page — `app/services/page.tsx` and
 * `app/status/page.tsx` both call `auth()` and redirect. Path matching in a
 * proxy can diverge from how Next actually routes a request, so the check that
 * protects the data runs on the resource itself, and it stays.
 *
 * This exists for the status code. Once a route has a `loading.tsx`, Next
 * streams it: the response is committed as 200 with the skeleton before the
 * page component runs, so a `redirect()` inside the page can only be a
 * client-side hop afterwards. Nothing private is sent — the page never renders
 * its content — but a protected URL answering 200 is a poor signal, and the
 * visitor watches a skeleton they were never going to be shown. Redirecting
 * here happens before any of that.
 *
 * `auth()` used as a wrapper supplies the session; unlike the Clerk middleware
 * this replaces, it does not throw when the app is unconfigured — it simply
 * reports nobody signed in. So there is no "is auth switched on" guard here
 * any more. An unconfigured deployment would redirect to /sign-in, which is
 * the page that explains the situation.
 */
function isProtected(pathname: string) {
  return PROTECTED_PATHS.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`)
  );
}

export const proxy = auth((request) => {
  if (!isProtected(request.nextUrl.pathname)) return;
  if (request.auth?.user) return;

  const signIn = new URL(SIGN_IN_PATH, request.nextUrl.origin);
  // Auth.js reads `callbackUrl` after a successful sign-in, so the visitor
  // lands back on the page they were stopped at rather than the home page.
  signIn.searchParams.set("callbackUrl", request.nextUrl.pathname);
  return NextResponse.redirect(signIn);
}) as unknown as (request: NextRequest) => Promise<Response | undefined>;

export const config = {
  matcher: [
    /*
      Everything except Next's own assets and static files — and, unlike the
      Clerk version, except `/api/auth` as well. Auth.js's own endpoints must
      not be wrapped by a proxy that consults Auth.js: the callback Google
      redirects to is what *creates* the session, so running the guard over it
      is at best wasted work and at worst a redirect loop on the one URL that
      has to be reachable while signed out.
    */
    "/((?!api/auth|_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
  ],
};

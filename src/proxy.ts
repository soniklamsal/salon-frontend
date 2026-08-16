import { NextResponse, type NextFetchEvent, type NextRequest } from "next/server";
import { clerkMiddleware } from "@clerk/nextjs/server";

import { CLERK_ENABLED, PROTECTED_PATHS, SIGN_IN_PATH } from "@/lib/auth";

/**
 * Supplies the Clerk session, and bounces signed-out visitors off the private
 * routes before those routes start rendering.
 *
 * Named `proxy.ts` rather than `middleware.ts`: Next 16 deprecated the
 * `middleware` file convention and renamed it to `proxy` — the build warns on
 * the old name. Same execution model, same `config.matcher`; the exported
 * function is `proxy` and takes (NextRequest, NextFetchEvent).
 *
 * The authoritative check is still in the page — `app/services/page.tsx` and
 * `app/status/page.tsx` both call `auth()` and redirect — because Clerk 7 warns
 * that middleware path matching "can diverge from how Next.js routes requests
 * and leave protected resources reachable". That check is what actually
 * protects the data, and it stays.
 *
 * This exists for the status code. Once a route has a `loading.tsx`, Next
 * streams it: the response is committed as 200 with the skeleton before the
 * page component runs, so a `redirect()` inside the page can only be a
 * client-side hop afterwards. Nothing private is sent — the page never renders
 * its content — but a protected URL answering 200 is a poor signal, and the
 * visitor watches a skeleton they were never going to be shown. Redirecting
 * here happens before any of that.
 *
 * Deliberately a plain pathname test rather than `createRouteMatcher`, which
 * Clerk 7 deprecates.
 */
function isProtected(pathname: string) {
  return PROTECTED_PATHS.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`)
  );
}

const withClerk = clerkMiddleware(async (auth, request) => {
  if (!isProtected(request.nextUrl.pathname)) return;

  const { userId } = await auth();
  if (userId) return;

  const signIn = new URL(SIGN_IN_PATH, request.url);
  signIn.searchParams.set("redirect_url", request.nextUrl.pathname);
  return NextResponse.redirect(signIn);
});

export function proxy(request: NextRequest, event: NextFetchEvent) {
  // `clerkMiddleware()` reads the publishable key when it runs, so in a
  // checkout with no keys it would turn every request into an error page —
  // including pages that have nothing to do with auth.
  if (!CLERK_ENABLED) return NextResponse.next();
  return withClerk(request, event);
}

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
    // Clerk's auto-proxy path. Must be matched or the handshake that
    // establishes the session never reaches the proxy.
    "/__clerk/:path*",
  ],
};

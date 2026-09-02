"use client";

import { createContext, useContext } from "react";
import { SessionProvider } from "next-auth/react";

/**
 * Session context for the whole site, plus whether sign-in is configured.
 *
 * The flag is carried here rather than read from the environment in each
 * client component, because the values it is derived from are server-only —
 * `GOOGLE_CLIENT_SECRET` and `SALON_AUTH_SECRET` must never be inlined into
 * the browser bundle, which is what a `NEXT_PUBLIC_` copy of this would do.
 * The root layout evaluates it on the server and passes the boolean down; a
 * boolean is all the browser ever sees.
 *
 * One source of truth is the point. The Clerk version keyed off
 * `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` being present in the browser, which
 * meant the client and server could disagree about whether auth was on.
 */
const AuthConfiguredContext = createContext(false);

/** Whether sign-in is switched on. Safe to call in any client component. */
export function useAuthConfigured() {
  return useContext(AuthConfiguredContext);
}

export function AuthProvider({
  configured,
  children,
}: {
  configured: boolean;
  children: React.ReactNode;
}) {
  return (
    <AuthConfiguredContext.Provider value={configured}>
      {/*
        Unlike ClerkProvider this never throws when unconfigured — it just
        reports nobody signed in — so it wraps the tree unconditionally and
        the layout no longer needs two branches.

        `refetchOnWindowFocus={false}`: the default re-checks the session every
        time the tab regains focus, which on this site means a request every
        time someone alt-tabs back to a booking form they are filling in. The
        session is a 30-day cookie; it does not change while they are typing.
      */}
      <SessionProvider refetchOnWindowFocus={false}>{children}</SessionProvider>
    </AuthConfiguredContext.Provider>
  );
}
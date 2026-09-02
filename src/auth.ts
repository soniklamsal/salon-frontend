import NextAuth from "next-auth";
import Google from "next-auth/providers/google";

import { SIGN_IN_PATH } from "@/lib/auth";

/**
 * Google sign-in, via Auth.js v5.
 *
 * Auth.js v5 rather than v4 because this app is on Next 16 and the App Router:
 * v5's `auth()` works unchanged in server components, route handlers and
 * `proxy.ts`, which is a straight swap for the Clerk `auth()` this replaces.
 * v4 would need `getServerSession(authOptions)` threaded through each of those
 * separately. Both declare Next 16 support now — v5 is the one that fits.
 *
 * Sessions are JWTs in a cookie, with no database adapter: the only thing this
 * app needs to know about a customer is which Google account they are, and the
 * bookings themselves already live in Django keyed by that id. An adapter would
 * add a second user table to keep in step with the one Django already mirrors.
 *
 * Note what is *not* here: no refresh-token rotation, and `access_type:
 * "offline"` is not requested. Nothing in this app calls a Google API on the
 * customer's behalf, so there is nothing an access token would be used for.
 * The one thing Google is asked for is who they are, once, at sign-in.
 */
export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Google({
      // Named explicitly rather than relying on Auth.js's `AUTH_GOOGLE_ID`
      // auto-detection, because these two are also what the Django side and
      // the Google Cloud console call them. One name per thing.
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      // `select_account` so a customer on a shared machine is asked which
      // account to use instead of being silently signed in as whoever went
      // last. Without it Google reuses the single logged-in session.
      authorization: {
        params: { prompt: "select_account" },
      },
    }),
  ],

  // Named rather than left to Auth.js's implicit AUTH_SECRET lookup, so the
  // one place this app reads a secret is visible in the file that uses it.
  secret: process.env.AUTH_SECRET,

  session: { strategy: "jwt" },

  pages: {
    // Our own panel, so the sign-in page matches the site. Without this
    // Auth.js serves its unstyled default page at /api/auth/signin.
    signIn: SIGN_IN_PATH,
    error: SIGN_IN_PATH,
  },

  callbacks: {
    /**
     * `token.sub` is already Google's `sub` — Auth.js sets it from the provider
     * account id — and that is the id Django stores as `google_user_id`. The
     * only thing added here is whether Google considers the address verified,
     * which its default profile mapping drops.
     *
     * `profile` is only present on the request that completes sign-in, so the
     * flag is copied onto the token once and then rides along.
     */
    jwt({ token, profile }) {
      if (profile) {
        token.email_verified = Boolean(profile.email_verified);
        token.picture = (profile.picture as string | undefined) ?? token.picture;
      }
      return token;
    },

    /**
     * Puts the Google id on `session.user.id`.
     *
     * Client components need it for nothing security-related — the id that
     * matters is the one inside the signed token Django verifies — but having
     * it here keeps `useSession()` self-describing.
     */
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub ?? "";
        session.user.emailIsVerified = Boolean(token.email_verified);
      }
      return session;
    },
  },
});

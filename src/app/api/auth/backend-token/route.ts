import { NextResponse } from "next/server";
import { SignJWT } from "jose";

import { auth } from "@/auth";
import {
  API_TOKEN_AUDIENCE,
  API_TOKEN_ISSUER,
  isApiTokenConfigured,
} from "@/lib/auth";

/**
 * Mints the short-lived token the browser sends to the Django API.
 *
 * The browser and the API are on different origins — Next on Vercel, Django on
 * Render — so the session cookie is never attached to an API call and Django
 * has to be told who is calling some other way. This is that way: the browser
 * asks this route (same origin, so the cookie *is* attached), the session is
 * read here on the server, and a signed assertion of who they are goes back.
 *
 * Why not simply pass Google's `id_token` through
 * -----------------------------------------------
 * Because it expires an hour after sign-in while the site's session lasts
 * weeks, so a customer who left a tab open over lunch would silently stop being
 * recognised: their booking would save anonymously and /status would empty.
 * Keeping Google's token alive needs refresh-token rotation, and Google only
 * issues a refresh token on the *first* consent — so the repair is itself
 * unreliable. Minting from the session sidesteps all of it. The identity is
 * still Google's; only the envelope is ours.
 *
 * The secret is shared with Django as `SALON_AUTH_SECRET`. It never reaches
 * the browser: it is read in this route handler, which only runs on the server.
 */

// The token is a bearer credential, so it is deliberately short-lived — long
// enough to cover a slow upload of a payment screenshot, short enough that one
// captured from a log is worthless by the time anyone reads it.
const TTL_SECONDS = 300;

export async function GET() {
  const session = await auth();

  // Not signed in. A 401 rather than an error page: every caller treats a
  // missing token as "record this anonymously", which is the same thing the
  // API does with no Authorization header.
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  if (!isApiTokenConfigured()) {
    // Sign-in works but the API cannot be told about it. Worth saying out
    // loud on the server, because the visible symptom — bookings saving
    // without an account — looks like a bug in the booking form.
    console.warn(
      "[auth] SALON_AUTH_SECRET is not set, so the API cannot identify " +
        "signed-in customers. Bookings will be recorded anonymously."
    );
    return NextResponse.json({ error: "Not configured" }, { status: 503 });
  }

  const secret = new TextEncoder().encode(process.env.SALON_AUTH_SECRET);

  const token = await new SignJWT({
    email: session.user.email ?? "",
    // Django only trusts the address when this is true — an unverified one
    // must never be stamped on a booking as the customer's own.
    email_verified: session.user.emailIsVerified ?? false,
    name: session.user.name ?? "",
    picture: session.user.image ?? "",
  })
    .setProtectedHeader({ alg: "HS256" })
    // Google's `sub`, which is what Django stores as `google_user_id`.
    .setSubject(session.user.id)
    .setIssuer(API_TOKEN_ISSUER)
    .setAudience(API_TOKEN_AUDIENCE)
    .setIssuedAt()
    .setExpirationTime(`${TTL_SECONDS}s`)
    .sign(secret);

  return NextResponse.json(
    { token, expiresIn: TTL_SECONDS },
    {
      headers: {
        // Never cached anywhere. This is a credential for one person, and a
        // CDN or a shared browser cache holding it would hand it to the next
        // caller. `private` alone is not enough — hence no-store.
        "Cache-Control": "no-store, no-cache, must-revalidate, private",
      },
    }
  );
}

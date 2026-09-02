# Google sign-in

The authoritative document for how accounts work in this project.

It is the only auth documentation that survives. The earlier Clerk notes and
the write-ups of the abandoned first migration were deleted — they contradicted
each other and described a setup this project no longer uses.

---

## How it works

```
Browser ──1── Google ──2── Next.js (Vercel) ──3── Browser ──4── Django (Render)
```

1. The visitor clicks **Continue with Google** and signs in at Google.
2. Google redirects back to `/api/auth/callback/google`. Auth.js verifies the
   response and sets a session cookie. This is the only moment Google is
   involved.
3. When the browser needs to call the API, it asks its *own* server for a
   token: `GET /api/auth/backend-token`. That route reads the session cookie
   (same origin, so it is attached), and signs a 5-minute JWT with
   `SALON_AUTH_SECRET`.
4. The browser sends that token to Django as `Authorization: Bearer …`.
   Django verifies the signature, `iss`, `aud` and `exp` with the same secret.

The token's `sub` is Google's `sub`, which Django stores as `google_user_id`.
So the identity is Google's — only the envelope is ours.

### Why not send Google's own ID token to Django

Because it expires **one hour** after sign-in while the site's session lasts
weeks. A customer who left a tab open over lunch would silently stop being
recognised: their booking would save anonymously and `/status` would go empty.
Keeping it alive requires Google refresh-token rotation, and Google only issues
a refresh token on the *first* consent — so the repair is itself unreliable.

### Key files

| File | What it does |
| --- | --- |
| `salon-frontend/src/auth.ts` | Auth.js config: the Google provider and callbacks |
| `salon-frontend/src/app/api/auth/backend-token/route.ts` | Mints the API token |
| `salon-frontend/src/lib/api/session-token.ts` | Client helper; caches the token |
| `salon-frontend/src/proxy.ts` | Redirects signed-out visitors off private routes |
| `backend/common/google_auth.py` | Verifies the token server-side |

---

## Local setup

`salon-frontend/.env`:

```
GOOGLE_CLIENT_ID=...apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-...
AUTH_SECRET=<openssl rand -base64 32>
SALON_AUTH_SECRET=<openssl rand -base64 32>
```

`backend/.env`:

```
SALON_AUTH_SECRET=<the SAME value as above>
GOOGLE_CLIENT_ID=...apps.googleusercontent.com
```

`GOOGLE_CLIENT_SECRET` is deliberately **not** in the backend. Django never
talks to Google, so holding it there would widen its exposure for no purpose.

Then check both sides agree:

```bash
cd salon-frontend && npm run check:auth
```

That compares the two `SALON_AUTH_SECRET` values and reports a mismatch, which
is the one failure no single file can reveal.

### Google Cloud console

Under **APIs & Services → Credentials → your OAuth client**, the authorised
redirect URIs must include, character for character:

```
http://localhost:3000/api/auth/callback/google
https://ajunisexsalon.com/api/auth/callback/google
```

Keep the localhost one registered or local development stops working. A
mismatch here is Google's `redirect_uri_mismatch`, the most common failure.

If the OAuth consent screen is still in **Testing**, only accounts on the
test-user list can sign in. Publish it before launch.

---

## Deploying

**Vercel** — `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `AUTH_SECRET`,
`SALON_AUTH_SECRET`. Generate fresh values for the two secrets; do not reuse
the development ones.

**Render** — `SALON_AUTH_SECRET` (**identical** to Vercel's) and
`GOOGLE_CLIENT_ID`. Remove `CLERK_ISSUER`, `CLERK_SECRET_KEY` and
`CLERK_AUTHORIZED_PARTIES`.

`AUTH_URL` is only needed where the host cannot be inferred from the request —
a reverse proxy, or a container behind one. Vercel and localhost both infer it.

Django's `CORS_ALLOWED_ORIGINS` must include the frontend origin, or the
browser cannot call the API at all once signed in.

---

## When something is wrong

Everything auth-related is behind a configuration check, so the site keeps
working with none of it set. That is deliberate, and it means **failures are
silent** — these are the shapes they take.

| Symptom | Cause |
| --- | --- |
| `/services` is open to everyone; no Sign in link | `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` or `AUTH_SECRET` missing |
| Sign-in works, but bookings save with no account and `/status` is empty | `SALON_AUTH_SECRET` missing on one side, or the two values differ |
| `redirect_uri_mismatch` from Google | The callback URL is not registered, or does not match exactly |
| `Access blocked` from Google | Consent screen still in Testing and the account is not a test user |
| Booking has a `google_user_id` but no email | Google reported the address as unverified. Deliberate — see below |

`npm run check:auth` catches the first two.

### Deliberate behaviours, not bugs

- **A booking with no valid token still succeeds, anonymously.** Gating the
  booking page is the frontend's job; refusing at the API too would mean an
  expired tab silently loses a real customer.
- **An unverified email is dropped, but the identity is kept.** Django will not
  stamp an address Google has not verified onto a booking — that is exactly the
  claim someone would forge to receive another person's confirmation mail.
- **A forged `google_user_id` or `email` in the request body is ignored.**
  Neither is a serializer field; both come from the verified token.

---

## The five existing bookings

They carry legacy Clerk ids (`user_3HrG…`), preserved through the rename rather
than discarded. A Google `sub` is a ~21-digit number, so those ids will never
match a Google account: the bookings are visible in the Django admin but will
not appear on anyone's `/status`. Blank the `google_user_id` on them, or
overwrite it with the real Google `sub` once you have signed in and looked it
up in **Users → Google accounts**.

---

## Older notes elsewhere

A few deployment documents were deleted along with the Clerk notes. If you find
an older copy anywhere — a backup, an editor's local history — treat anything it
says about `CLERK_ISSUER`, `CLERK_SECRET_KEY` or `CLERK_AUTHORIZED_PARTIES` as
wrong. Those variables are gone. This document is correct.

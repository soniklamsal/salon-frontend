"use client";

import { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";

import { useAuthConfigured } from "@/features/auth/components/auth-provider";

/**
 * The sign-in panel.
 *
 * Google is the only way in, so this is one button rather than a form. That is
 * the substantive change from the Clerk version: Clerk rendered an entire
 * widget — email, password, and a Google button — and this app no longer has
 * anything to do with passwords at all. There is still no credential handling
 * in this codebase; now there is not even a field to type one into.
 *
 * Because there are no passwords, "sign in" and "sign up" are the same action:
 * Google either recognises the account or creates the session for a new one.
 * The two routes stay separate only so the headings can differ, and both land
 * here.
 */

/** Google's mark. Inlined rather than fetched — four paths, and an <img> to a
 *  Google CDN on the sign-in page is a third-party request for no reason. */
function GoogleMark() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 48 48" aria-hidden focusable="false">
      <path
        fill="#4285F4"
        d="M45.12 24.5c0-1.56-.14-3.06-.4-4.5H24v8.51h11.84c-.51 2.75-2.06 5.08-4.39 6.64v5.52h7.11c4.16-3.83 6.56-9.47 6.56-16.17z"
      />
      <path
        fill="#34A853"
        d="M24 46c5.94 0 10.92-1.97 14.56-5.33l-7.11-5.52c-1.97 1.32-4.49 2.1-7.45 2.1-5.73 0-10.58-3.87-12.31-9.07H4.34v5.7C7.96 41.07 15.4 46 24 46z"
      />
      <path
        fill="#FBBC05"
        d="M11.69 28.18C11.25 26.86 11 25.45 11 24s.25-2.86.69-4.18v-5.7H4.34C2.85 17.09 2 20.45 2 24s.85 6.91 2.34 9.88l7.35-5.7z"
      />
      <path
        fill="#EA4335"
        d="M24 10.75c3.23 0 6.13 1.11 8.41 3.29l6.31-6.31C34.91 4.18 29.93 2 24 2 15.4 2 7.96 6.93 4.34 14.12l7.35 5.7c1.73-5.2 6.58-9.07 12.31-9.07z"
      />
    </svg>
  );
}

/**
 * Auth.js reports failures by redirecting back with `?error=`.
 *
 * Worth translating rather than showing the raw code: `OAuthAccountNotLinked`
 * on a sign-in page is not something a salon customer can act on.
 */
function errorMessage(code: string | null): string | null {
  if (!code) return null;
  switch (code) {
    case "OAuthAccountNotLinked":
      return "That email is already signed up a different way. Use the account you signed up with.";
    case "AccessDenied":
      return "Google did not let us sign you in. If you cancelled, try again.";
    case "Configuration":
      return "Sign-in is not set up correctly on our side. Please let us know.";
    default:
      return "Something went wrong signing you in. Please try again.";
  }
}

export function AuthPanel({
  mode,
  heading,
  sub,
}: {
  mode: "sign-in" | "sign-up";
  heading: string;
  sub: string;
}) {
  const configured = useAuthConfigured();
  const params = useSearchParams();
  const [busy, setBusy] = useState(false);

  // Set by the proxy when it bounces someone off /services or /status, so
  // signing in returns them to what they were trying to do. Only a path is
  // accepted -- an absolute URL here would be an open redirect, letting a
  // crafted link send someone to another site straight after signing in.
  const requested = params.get("callbackUrl") ?? params.get("redirect_url");
  const callbackUrl =
    requested && requested.startsWith("/") && !requested.startsWith("//")
      ? requested
      : "/services";

  const error = errorMessage(params.get("error"));

  // `below-header` rather than a matching `pt-*`: the panel is centred, so its
  // top padding is really a minimum gutter under the overlaying header — and
  // that header's height follows the logo size set in the admin.
  return (
    <main className="below-header flex flex-1 items-center justify-center bg-[#0a0a0a] px-5 pb-28 sm:pb-32">
      <div className="w-full max-w-[460px]">
        <h1 className="text-center text-[clamp(28px,6vw,44px)] leading-tight font-bold text-white">
          {heading}
        </h1>
        <p className="text-ash mt-3 text-center text-[15px]">{sub}</p>

        <div className="mt-10 flex justify-center">
          {configured ? (
            <div className="w-full">
              {error ? (
                <p
                  role="alert"
                  className="mb-6 rounded-lg border border-red-400/40 bg-red-400/10 p-4 text-sm text-red-200"
                >
                  {error}
                </p>
              ) : null}

              <button
                type="button"
                disabled={busy}
                onClick={() => {
                  setBusy(true);
                  // Not awaited: this navigates away to Google. The promise
                  // only settles if it fails, in which case Auth.js sends the
                  // browser back here with ?error= and the panel re-renders.
                  void signIn("google", { callbackUrl }).finally(() =>
                    setBusy(false)
                  );
                }}
                className="flex w-full items-center justify-center gap-3 rounded-xl bg-white px-6 py-4 text-[15px] font-semibold text-[#1f1f1f] transition-opacity hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white disabled:cursor-not-allowed disabled:opacity-60"
              >
                <GoogleMark />
                <span>
                  {busy
                    ? "Taking you to Google…"
                    : mode === "sign-in"
                      ? "Continue with Google"
                      : "Sign up with Google"}
                </span>
              </button>

              <p className="mt-6 text-center text-[13px] leading-relaxed text-white/45">
                We only ever see your name, email address and profile picture.
                There is no password to remember, and we never see your Google
                one.
              </p>
            </div>
          ) : (
            <div className="w-full rounded-xl border border-white/15 p-6 text-center">
              <p className="font-semibold text-white">
                Accounts are not switched on yet.
              </p>
              <p className="mt-2 text-sm text-white/60">
                Add <code>GOOGLE_CLIENT_ID</code>,{" "}
                <code>GOOGLE_CLIENT_SECRET</code> and <code>AUTH_SECRET</code>{" "}
                to <code>.env.local</code> and restart the site to enable
                sign in.
              </p>
              <Link
                href="/services"
                className="text-accent mt-5 inline-block text-sm font-semibold underline"
              >
                Continue to booking
              </Link>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

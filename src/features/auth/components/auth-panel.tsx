"use client";

import Link from "next/link";
import { SignIn, SignUp } from "@clerk/nextjs";

import { CLERK_ENABLED, SIGN_IN_PATH, SIGN_UP_PATH } from "@/lib/auth";

/**
 * The shell around Clerk's own sign-in / sign-up widget.
 *
 * Clerk renders the whole form — email, password, and the Google button, which
 * appears once Google is enabled in the Clerk dashboard. Nothing here collects
 * a credential, so there is no password handling in this codebase at all.
 *
 * Theming comes from the `shadcn` theme applied once on <ClerkProvider> in
 * app/layout.tsx, so the widget picks up the same tokens as components/ui.
 * Nothing is themed per-instance here — a local `appearance` would override
 * the provider and the two would drift apart.
 *
 * With no keys configured Clerk's components would throw, so this renders an
 * explanatory panel instead. That state is what the site looks like today,
 * before the keys are added, and it says so plainly rather than showing a
 * broken form.
 */

export function AuthPanel({
  mode,
  heading,
  sub,
}: {
  mode: "sign-in" | "sign-up";
  heading: string;
  sub: string;
}) {
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
          {CLERK_ENABLED ? (
            mode === "sign-in" ? (
              <SignIn
                signUpUrl={SIGN_UP_PATH}
                // Sends people back to the booking form they were stopped at.
                fallbackRedirectUrl="/services"
              />
            ) : (
              <SignUp
                signInUrl={SIGN_IN_PATH}
                fallbackRedirectUrl="/services"
              />
            )
          ) : (
            <div className="w-full rounded-xl border border-white/15 p-6 text-center">
              <p className="font-semibold text-white">
                Accounts are not switched on yet.
              </p>
              <p className="mt-2 text-sm text-white/60">
                Add your Clerk keys to <code>.env.local</code> and restart the
                site to enable sign in, sign up and Google.
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

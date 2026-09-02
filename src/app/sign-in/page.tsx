import type { Metadata } from "next";
import { Suspense } from "react";

import { AuthPanel } from "@/features/auth/components/auth-panel";
import { NOINDEX } from "@/lib/seo/site";

/**
 * A plain route now, not the `[[...sign-in]]` catch-all it was.
 *
 * The catch-all existed because Clerk's widget routed its own multi-step flow
 * (verification codes, factor-two, password reset) under this path. Google runs
 * all of that on Google's side and returns to `/api/auth/callback/google`, so
 * there are no sub-paths left to catch.
 */
export const metadata: Metadata = {
  title: "Sign in",
  description: "Sign in to book your seat at the salon.",
  // Auth plumbing. A sign-in page indexed under the salon's name is a bad
  // search result, not a useful one.
  ...NOINDEX,
};

export default function SignInPage() {
  return (
    // AuthPanel reads `?callbackUrl=` with `useSearchParams`, which Next
    // requires to sit under a Suspense boundary — without one the whole route
    // opts out of static rendering and the build warns.
    <Suspense fallback={<div className="below-header flex-1 bg-[#0a0a0a]" />}>
      <AuthPanel
        mode="sign-in"
        heading="Welcome back"
        sub="Sign in to book your seat."
      />
    </Suspense>
  );
}

import type { Metadata } from "next";
import { Suspense } from "react";

import { AuthPanel } from "@/features/auth/components/auth-panel";
import { NOINDEX } from "@/lib/seo/site";

/**
 * Kept as its own route even though it does exactly what /sign-in does.
 *
 * With Google there is no separate registration step — the first sign-in
 * creates the account — but the site links to "Create an account" in a few
 * places, and a heading that says so is friendlier than sending a new customer
 * to a page headed "Welcome back".
 */
export const metadata: Metadata = {
  title: "Create an account",
  description: "Create an account to book your seat at the salon.",
  // Auth plumbing — same reasoning as /sign-in.
  ...NOINDEX,
};

export default function SignUpPage() {
  return (
    <Suspense fallback={<div className="below-header flex-1 bg-[#0a0a0a]" />}>
      <AuthPanel
        mode="sign-up"
        heading="Create an account"
        sub="One account, and your bookings are all in one place."
      />
    </Suspense>
  );
}

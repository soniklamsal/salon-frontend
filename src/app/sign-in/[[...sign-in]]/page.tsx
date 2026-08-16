import type { Metadata } from "next";

import { AuthPanel } from "@/features/auth/components/auth-panel";
import { NOINDEX } from "@/lib/seo/site";

export const metadata: Metadata = {
  title: "Sign in",
  description: "Sign in to book your seat at the salon.",
  // Auth plumbing. A sign-in page indexed under the salon's name is a bad
  // search result, not a useful one.
  ...NOINDEX,
};

export default function SignInPage() {
  return (
    <AuthPanel
      mode="sign-in"
      heading="Welcome back"
      sub="Sign in to book your seat."
    />
  );
}

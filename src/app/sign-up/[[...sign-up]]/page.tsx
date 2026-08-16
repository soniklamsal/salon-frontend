import type { Metadata } from "next";

import { AuthPanel } from "@/features/auth/components/auth-panel";
import { NOINDEX } from "@/lib/seo/site";

export const metadata: Metadata = {
  title: "Create an account",
  description: "Create an account to book your seat at the salon.",
  // Auth plumbing — same reasoning as /sign-in.
  ...NOINDEX,
};

export default function SignUpPage() {
  return (
    <AuthPanel
      mode="sign-up"
      heading="Create an account"
      sub="One account, and your bookings are all in one place."
    />
  );
}

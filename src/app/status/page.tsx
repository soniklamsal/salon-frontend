import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/auth";

import { BackButton } from "@/components/shared/back-button";
import { MyBookings } from "@/features/booking/components/my-bookings";
import { isAuthConfigured, SIGN_IN_PATH } from "@/lib/auth";
import { MY_BOOKINGS_ENDPOINT } from "@/lib/api/booking";
import { NOINDEX } from "@/lib/seo/site";

/**
 * Your status — every booking this account has made.
 *
 * Its own route rather than a band on the home page: the list is private, so
 * putting it there made the home page's content depend on who was reading it,
 * and buried a customer's order ID several screens down a marketing page.
 *
 * Gated the same way as /services, and for the same reason — see the note in
 * that file about the page being the authoritative check, not the proxy.
 */

export const metadata: Metadata = {
  title: "Your status",
  description: "Track the bookings you have made with the salon.",
  ...NOINDEX,
};

export default async function StatusPage() {
  if (isAuthConfigured()) {
    const session = await auth();
    if (!session?.user) {
      redirect(`${SIGN_IN_PATH}?callbackUrl=/status`);
    }
  }

  return (
    <main className="flex-1 bg-[#0a0a0a]">
      <div className="mx-auto w-full max-w-[1100px] px-5 below-header pb-20 sm:px-8 md:pb-28">
        <BackButton />

        <h1 className="text-foreground text-[clamp(32px,7vw,60px)] leading-[1.05] font-bold">
          Your status
        </h1>
        <p className="text-muted-foreground mt-4 max-w-[52ch] text-[clamp(15px,2.4vw,19px)] leading-relaxed">
          Every request you have sent us, and where each one has got to. Open a
          booking to see everything you filled in.
        </p>

        <MyBookings endpoint={MY_BOOKINGS_ENDPOINT} />
      </div>
    </main>
  );
}

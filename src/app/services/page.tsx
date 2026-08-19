import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";

import { BackButton } from "@/components/shared/back-button";
import { Card, CardContent } from "@/components/ui/card";
import { BookingFlow } from "@/features/booking/components/booking-flow";
import { CLERK_ENABLED, SIGN_IN_PATH } from "@/lib/auth";
import { BOOKING_ENDPOINT, getBookingConfig } from "@/lib/api/booking";
import { NOINDEX } from "@/lib/seo/site";

/**
 * Services / booking page.
 *
 * Where the "Moments Captured In The Chair" cards land, and where "Book Now"
 * goes. The page itself is a server component so the service and barber lists
 * are fetched once on the server; `BookingFlow` is the client island that walks
 * through the four steps and posts the result.
 *
 * `BOOKING_ENDPOINT` is handed down as a prop rather than read in the client:
 * `SALON_API_URL` is a server-only variable (no `NEXT_PUBLIC_` prefix), so the
 * browser cannot see it. Passing the resolved string keeps the URL in one place
 * and out of the client bundle's environment.
 */

export const metadata: Metadata = {
  title: "Book a service",
  description:
    "Choose a service and a barber, then book your seat at the salon.",
  // Behind an account. The root layout sets `index: true` and this route would
  // otherwise inherit it.
  ...NOINDEX,
};

export default async function ServicesPage() {
  /*
    The gate. Checked here rather than in middleware because Clerk 7 deprecates
    route-matcher middleware, warning that path matching "can diverge from how
    Next.js routes requests and leave protected resources reachable". This runs
    on the resource itself, so there is no path to route around.

    Skipped entirely when Clerk is not configured, which is what lets the site
    keep working before the keys are added.
  */
  if (CLERK_ENABLED) {
    const { userId } = await auth();
    if (!userId) {
      redirect(`${SIGN_IN_PATH}?redirect_url=/services`);
    }
  }

  const config = await getBookingConfig();

  return (
    <>
      <main className="flex-1 bg-[#0a0a0a]">
        <div className="mx-auto w-full max-w-[1000px] px-5 below-header pb-20 sm:px-8 md:pb-28">
          {/* Fixed-position, so it floats over the page rather than taking a
              slot in this column — nothing below shifts to make room. */}
          <BackButton />

          <h1 className="text-foreground text-[clamp(32px,7vw,60px)] leading-[1.05] font-bold">
            {config.copy.pageHeading}
          </h1>
          <p className="text-muted-foreground mt-4 max-w-[52ch] text-[clamp(15px,2.4vw,19px)] leading-relaxed">
            {config.copy.pageIntro}
          </p>

          <Card className="mt-12 sm:mt-14">
            <CardContent className="p-5 sm:p-8 md:p-10">
              <BookingFlow config={config} endpoint={BOOKING_ENDPOINT} />
            </CardContent>
          </Card>
        </div>
      </main>
    </>
  );
}

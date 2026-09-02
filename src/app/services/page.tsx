import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/auth";

import { BackButton } from "@/components/shared/back-button";
import { Card, CardContent } from "@/components/ui/card";
import { BookingFlow } from "@/features/booking/components/booking-flow";
import { isAuthConfigured, SIGN_IN_PATH } from "@/lib/auth";
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
 * `BOOKING_ENDPOINT` is handed down as a prop rather than rebuilt in the
 * client. `NEXT_PUBLIC_SALON_API_URL` does reach the browser, but resolving the
 * URL once on the server keeps every caller pointed at the same string.
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
    The gate. The proxy redirects here too, but this is the authoritative
    check: path matching in a proxy can diverge from how Next actually routes
    a request, and this one runs on the resource itself, so there is no path
    to route around it.

    Skipped entirely when sign-in is not configured, which is what lets the
    site keep working before the credentials are added.
  */
  if (isAuthConfigured()) {
    const session = await auth();
    if (!session?.user) {
      redirect(`${SIGN_IN_PATH}?callbackUrl=/services`);
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

import type { Metadata } from "next";
import { Oswald } from "next/font/google";

import { BackButton } from "@/components/shared/back-button";
import { ContactForm } from "@/features/contact/components/contact-form";
import { JsonLd } from "@/components/shared/json-ld";
import { SocialIconRow } from "@/components/shared/social-icon";
import { CONTACT_ENDPOINT } from "@/lib/api/booking";
import { getSiteContent } from "@/lib/api/content";
import { SITE_CHROME } from "@/lib/site-chrome";
import { canonicalMetadata } from "@/lib/seo/site";
import { buildContactPage, buildHairSalon } from "@/lib/seo/structured-data";

/**
 * Contact Us, laid out like the devis-gym demo's contact page.
 *
 * Kept from the demo: the two-column split with the details on the left and
 * the message form on the right, the uppercase Oswald headings, the square
 * fields, and the accent-highlighted word in the heading.
 *
 * The demo also put a map under the intro, a street address beside it and an
 * opening-hours table below. All three read from `sections.ContactColumn`,
 * which has been removed from the CMS with nothing to replace it — so there is
 * no address or hours to print, and no place for the map to point at. They are
 * gone rather than hardcoded: the rule on this page is that its content is the
 * salon's and is edited in the admin, not typed into the component the way the
 * demo's was (`data/contact.ts`).
 *
 * What is left — phone, email and the social links — still comes from the
 * footer record, so it is the same value the home page's footer shows rather
 * than a second copy to keep in step.
 *
 * Oswald is loaded on this route only, as About Us does, so no other page pays
 * for a font it does not set type in.
 */

const oswald = Oswald({
  variable: "--font-oswald",
  subsets: ["latin"],
  weight: ["400", "700"],
});

export const metadata: Metadata = {
  title: "Contact Us",
  description: "Call the salon, follow us, or send us a message.",
  ...canonicalMetadata("/contact"),
};

export default async function ContactPage() {
  // The message form must work even if the salon's contact details have not
  // loaded, so the structural chrome stands in for a `null` — the phone/email
  // simply show empty rather than a made-up number, and the form still posts.
  const content = (await getSiteContent()) ?? SITE_CHROME;

  return (
    <div className={`${oswald.variable} contents`}>
      {/* The salon node, then this page pointing at it. */}
      <JsonLd data={buildHairSalon(content)} />
      <JsonLd
        data={buildContactPage(
          "Contact Us",
          "Call the salon, follow us, or send us a message."
        )}
      />
      <main className="bg-background relative flex-1">
        <BackButton />

        <div className="container-edge below-header pb-16 md:pb-20">
          <p className="text-accent font-display text-sm font-bold tracking-[0.2em] uppercase">
            Get in touch
          </p>
          <h1 className="font-oswald mt-3 text-[clamp(36px,8vw,72px)] leading-[1.05] font-bold tracking-tight text-white uppercase">
            Contact <span className="text-accent">Us</span>
          </h1>
          <p className="text-muted mt-5 max-w-[54ch] text-[clamp(15px,2.2vw,19px)] leading-relaxed">
            {content.followUs.body}
          </p>

          <div className="mt-16 grid gap-12 lg:grid-cols-2 lg:gap-20">
            {/* Details — left */}
            <div className="space-y-10">
              <div>
                <h2 className="font-oswald mb-4 text-[20px] leading-[28px] font-bold tracking-tight text-white uppercase">
                  Get in Touch
                </h2>
                <div className="space-y-3">
                  <div>
                    <p className="text-muted mb-1 text-xs font-bold tracking-wide uppercase">
                      Phone
                    </p>
                    <a
                      href={`tel:${content.footer.phone.replace(/\s+/g, "")}`}
                      className="hover:text-accent text-white transition-colors"
                    >
                      {content.footer.phone}
                    </a>
                  </div>
                  <div>
                    <p className="text-muted mb-1 text-xs font-bold tracking-wide uppercase">
                      Email
                    </p>
                    <a
                      href={`mailto:${content.footer.email}`}
                      className="hover:text-accent text-white transition-colors"
                    >
                      {content.footer.email}
                    </a>
                  </div>
                </div>
              </div>

              <div>
                <h2 className="font-oswald mb-4 text-[20px] leading-[28px] font-bold tracking-tight text-white uppercase">
                  Follow Us
                </h2>
                <SocialIconRow links={content.socialLinks} />
              </div>
            </div>

            {/* Message form — right */}
            <div>
              <h2 className="font-oswald mb-6 text-[clamp(26px,4vw,32px)] leading-[40px] font-bold tracking-tight text-white uppercase">
                Send Us a <span className="text-accent">Message</span>
              </h2>
              <ContactForm endpoint={CONTACT_ENDPOINT} />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

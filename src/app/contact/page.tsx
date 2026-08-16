import type { Metadata } from "next";
import { Oswald } from "next/font/google";

import { BackButton } from "@/components/shared/back-button";
import { ContactForm } from "@/features/contact/components/contact-form";
import { JsonLd } from "@/components/shared/json-ld";
import { SocialIconRow } from "@/components/shared/social-icon";
import { CONTACT_ENDPOINT } from "@/lib/api/booking";
import { getSiteContent } from "@/lib/api/content";
import { canonicalMetadata } from "@/lib/seo/site";
import { buildContactPage, buildHairSalon } from "@/lib/seo/structured-data";

/**
 * Contact Us, laid out like the devis-gym demo's contact page.
 *
 * Kept from the demo: the two-column split with the details on the left and
 * the message form on the right, the uppercase Oswald headings, the square
 * fields, the accent-highlighted word in the heading, and the map under the
 * intro.
 *
 * The content is the salon's, and it is not hardcoded the way the demo's was
 * (`data/contact.ts`). Everything here comes from `sections.ContactColumn` and
 * the footer record, so the address, hours, phone and email are edited in the
 * admin — the same values the home page's footer already shows, rather than a
 * second copy to keep in step.
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
  description:
    "Find the salon, check our opening hours, or send us a message.",
  ...canonicalMetadata("/contact"),
};

/** Google's embed needs no API key for a plain place query. */
function mapSrc(query: string) {
  return `https://www.google.com/maps?q=${encodeURIComponent(query)}&z=15&output=embed`;
}

export default async function ContactPage() {
  const content = await getSiteContent();
  const columns = content.contactColumns;

  const find = (heading: string) =>
    columns.find((column) => column.heading.toLowerCase() === heading);

  const location = find("location");
  const hours = find("hours");
  const address = location?.lines ?? [];
  const query = address.join(" ") || "Kathmandu Nepal";

  return (
    <div className={`${oswald.variable} contents`}>
      {/* The salon node, then this page pointing at it. Both carry the
          address and hours a local search result is built from. */}
      <JsonLd data={buildHairSalon(content)} />
      <JsonLd
        data={buildContactPage(
          "Contact Us",
          "Find the salon, check our opening hours, or send us a message."
        )}
      />
      <main className="bg-background relative flex-1">
        <BackButton />

        <div className="container-edge pt-28 pb-16 sm:pt-32 md:pt-40 md:pb-20">
          <p className="text-accent font-display text-sm font-bold tracking-[0.2em] uppercase">
            Get in touch
          </p>
          <h1 className="font-oswald mt-3 text-[clamp(36px,8vw,72px)] leading-[1.05] font-bold tracking-tight text-white uppercase">
            Contact <span className="text-accent">Us</span>
          </h1>
          <p className="text-muted mt-5 max-w-[54ch] text-[clamp(15px,2.2vw,19px)] leading-relaxed">
            {content.followUs.body}
          </p>

          {/* Map, as the demo puts one under the intro. */}
          <div className="mt-10 aspect-[16/9] w-full overflow-hidden border border-zinc-700 md:aspect-[21/9]">
            <iframe
              title={`Map showing ${query}`}
              src={mapSrc(query)}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              className="h-full w-full border-0"
            />
          </div>

          <div className="mt-16 grid gap-12 lg:grid-cols-2 lg:gap-20">
            {/* Details — left */}
            <div className="space-y-10">
              <div className="grid gap-8 sm:grid-cols-2">
                <div>
                  <h2 className="font-oswald mb-4 text-[20px] leading-[28px] font-bold tracking-tight text-white uppercase">
                    Visit Us
                  </h2>
                  <div className="text-muted space-y-1">
                    {address.map((line) => (
                      <p key={line}>{line}</p>
                    ))}
                  </div>
                </div>

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
              </div>

              {hours ? (
                <div>
                  <h2 className="font-oswald mb-4 text-[20px] leading-[28px] font-bold tracking-tight text-white uppercase">
                    Opening Hours
                  </h2>
                  <div className="text-muted space-y-2">
                    {hours.lines.map((line) => {
                      // "Mon to Fri: 7:30 am — 1:00 am" splits into a label and
                      // a time on the first colon, so the times line up in a
                      // column the way the demo's table does.
                      const at = line.indexOf(":");
                      const day = at === -1 ? line : line.slice(0, at);
                      const time = at === -1 ? "" : line.slice(at + 1).trim();
                      return (
                        <div key={line} className="flex justify-between gap-6">
                          <span>{day}</span>
                          <span className="text-right text-white">{time}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : null}

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

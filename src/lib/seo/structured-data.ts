/**
 * JSON-LD built from what the CMS actually holds.
 *
 * Every value here comes from a field the salon edits in the Django admin. That
 * is the whole rule: structured data is a claim made to a search engine, and a
 * claim the site cannot back up is worse than no claim at all. Nothing in this
 * file invents a phone number, a rating or a review.
 *
 * A value the CMS does not hold is left out of the node entirely rather than
 * emitted empty, so an empty database produces a node with nothing in it beyond
 * its name and URL, not a skeleton full of empty strings.
 *
 * Deliberately absent: `address` and `openingHoursSpecification`, along with
 * `Review` and `AggregateRating`. The salon's address and opening hours used to
 * come from `sections.ContactColumn`; that model has been removed and no field
 * replaced it, so there is nothing left to state them from. They are the two
 * properties a local search result is normally built out of, so they are worth
 * restoring here if the CMS ever holds them again — inventing them meanwhile is
 * the specific misuse search engines penalise, which is why they are simply
 * gone rather than guessed.
 */

import type { SiteContent } from "@/lib/types/content-types";
import { absoluteUrl } from "@/lib/seo/site";

/**
 * Social profile URLs fit to publish as `sameAs`.
 *
 * The seeded links are bare origins — `https://facebook.com` — which are
 * placeholders an editor has not filled in yet, not the salon's profiles.
 * Claiming facebook.com as the salon's own page is a false statement about
 * identity, so a URL with no path is dropped.
 */
export function buildSameAs(content: SiteContent): string[] {
  return content.socialLinks
    .map((link) => link.url?.trim())
    .filter((url): url is string => Boolean(url))
    .filter((url) => {
      try {
        const path = new URL(url).pathname.replace(/\/$/, "");
        return path.length > 0;
      } catch {
        return false;
      }
    });
}

/**
 * An image URL a crawler can actually fetch.
 *
 * The CMS holds either an absolute URL (Cloudinary, or the backend's own
 * `/media/` with an origin bolted on) or a site-relative path into the
 * frontend's `public/` folder — `/images/hero-stylist.png` is what it currently
 * returns. `metadataBase` resolves the relative form for Open Graph tags, but
 * JSON-LD gets no such treatment: a bare path there is a URL relative to
 * schema.org's own context and resolves to nothing useful.
 */
function absoluteImage(url: string): string {
  if (!url) return "";
  return /^https?:\/\//.test(url) ? url : absoluteUrl(url);
}

/**
 * The salon itself: `HairSalon`, a `LocalBusiness` subtype.
 *
 * Given a stable `@id` so the other pages' JSON-LD can reference this one node
 * rather than each restating the business — which is what stops three pages
 * looking like three businesses.
 */
export function buildHairSalon(content: SiteContent) {
  const { site, footer } = content;

  const sameAs = buildSameAs(content);
  const image = absoluteImage(
    content.hero.stylistImage || content.hero.backgroundImage || ""
  );

  return {
    "@context": "https://schema.org",
    "@type": "HairSalon",
    "@id": `${absoluteUrl("/")}#salon`,
    name: site.brandName,
    description: site.metaDescription,
    url: absoluteUrl("/"),
    ...(image ? { image } : {}),
    ...(footer.phone ? { telephone: footer.phone } : {}),
    ...(footer.email ? { email: footer.email } : {}),
    ...(sameAs.length > 0 ? { sameAs } : {}),
  };
}

/** A page node that points at the business rather than repeating it. */
function pageNode(type: string, path: string, name: string, description: string) {
  return {
    "@context": "https://schema.org",
    "@type": type,
    "@id": `${absoluteUrl(path)}#page`,
    url: absoluteUrl(path),
    name,
    description,
    isPartOf: { "@id": `${absoluteUrl("/")}#salon` },
    about: { "@id": `${absoluteUrl("/")}#salon` },
  };
}

export function buildAboutPage(name: string, description: string) {
  return pageNode("AboutPage", "/about-us", name, description);
}

export function buildContactPage(name: string, description: string) {
  return pageNode("ContactPage", "/contact", name, description);
}

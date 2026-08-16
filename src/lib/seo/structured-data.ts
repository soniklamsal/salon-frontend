/**
 * JSON-LD built from what the CMS actually holds.
 *
 * Every value here comes from a field the salon edits in the Django admin. That
 * is the whole rule: structured data is a claim made to a search engine, and a
 * claim the site cannot back up is worse than no claim at all. Nothing in this
 * file invents an address, a phone number, opening hours, a rating or a review.
 *
 * The builders return `null` rather than a partial object when the data they
 * need is missing or unparseable, and the component that renders them emits
 * nothing for a null. An empty database therefore produces no JSON-LD, which is
 * the correct outcome — not a skeleton full of empty strings.
 *
 * Deliberately absent: `Review` and `AggregateRating`. The site collects
 * neither, and fabricating them is the specific misuse search engines penalise.
 */

import type { ContactColumn, SiteContent } from "@/lib/types/content-types";
import { absoluteUrl } from "@/lib/seo/site";

/** The contact column with this heading, matched the way the contact page does. */
function column(columns: ContactColumn[], heading: string) {
  return columns.find((c) => c.heading.toLowerCase() === heading);
}

/**
 * A postal address from the Location column, or null.
 *
 * The column is free text an editor types as lines, so the shape is a
 * convention rather than a schema: the last line is the country, the one before
 * it the city, and anything above them the street. Fewer than two lines is not
 * enough to say which is which, so it produces nothing rather than a guess.
 *
 * Trailing commas are stripped — editors type "Thamel," because the design puts
 * each line on its own row, and that comma is punctuation for a human reader,
 * not part of the street name.
 */
export function buildPostalAddress(columns: ContactColumn[]) {
  const lines = (column(columns, "location")?.lines ?? [])
    .map((line) => line.trim().replace(/,\s*$/, ""))
    .filter(Boolean);

  if (lines.length < 2) return null;

  const addressCountry = lines[lines.length - 1];
  const addressLocality = lines[lines.length - 2];
  const streetAddress = lines.slice(0, -2).join(", ");

  return {
    "@type": "PostalAddress" as const,
    ...(streetAddress ? { streetAddress } : {}),
    addressLocality,
    addressCountry,
  };
}

const DAYS: Record<string, string> = {
  mon: "Monday", tue: "Tuesday", wed: "Wednesday", thu: "Thursday",
  fri: "Friday", sat: "Saturday", sun: "Sunday",
};
const DAY_ORDER = [
  "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday",
];

/** "7:30 am" -> "07:30". Returns "" for anything it cannot read confidently. */
function to24Hour(raw: string): string {
  const match = raw.trim().toLowerCase().match(/^(\d{1,2})(?::(\d{2}))?\s*(am|pm)$/);
  if (!match) return "";

  let hour = Number(match[1]);
  const minute = match[2] ?? "00";
  if (hour < 1 || hour > 12) return "";

  if (match[3] === "pm" && hour !== 12) hour += 12;
  if (match[3] === "am" && hour === 12) hour = 0;

  return `${String(hour).padStart(2, "0")}:${minute}`;
}

/**
 * Opening hours from the Hours column, or null.
 *
 * Handles the two forms the copy actually uses — "Mon to Fri: 7:30 am — 1:00 am"
 * and "Sat: 9:00 am — 1:00 am" — and refuses everything else. A line it cannot
 * read confidently makes the whole specification null rather than contributing a
 * partial week, because telling a search engine the salon opens Saturday and
 * saying nothing about Monday is a worse answer than saying nothing at all.
 *
 * Any of the several dashes an editor might type is accepted; em dash is what
 * the seeded copy uses and a hyphen is what someone typing quickly produces.
 */
export function buildOpeningHours(columns: ContactColumn[]) {
  const lines = (column(columns, "hours")?.lines ?? []).filter((l) => l.trim());
  if (lines.length === 0) return null;

  const spec = [];

  for (const line of lines) {
    const match = line
      .trim()
      .toLowerCase()
      .match(
        /^(\w{3})\w*(?:\s*(?:to|-|–|—)\s*(\w{3})\w*)?\s*:\s*(.+?)\s*(?:-|–|—)\s*(.+)$/
      );
    if (!match) return null;

    const from = DAYS[match[1]];
    const to = match[2] ? DAYS[match[2]] : from;
    const opens = to24Hour(match[3]);
    const closes = to24Hour(match[4]);
    if (!from || !to || !opens || !closes) return null;

    const start = DAY_ORDER.indexOf(from);
    const end = DAY_ORDER.indexOf(to);
    if (start < 0 || end < start) return null;

    spec.push({
      "@type": "OpeningHoursSpecification" as const,
      dayOfWeek: DAY_ORDER.slice(start, end + 1),
      opens,
      closes,
    });
  }

  return spec.length > 0 ? spec : null;
}

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
  const { site, footer, contactColumns } = content;

  const address = buildPostalAddress(contactColumns);
  const hours = buildOpeningHours(contactColumns);
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
    ...(address ? { address } : {}),
    ...(hours ? { openingHoursSpecification: hours } : {}),
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

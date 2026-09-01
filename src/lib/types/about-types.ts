/**
 * The shape of `/api/v1/about/`.
 *
 * Split out of `lib/about.ts` so the About domain follows the same three-file
 * convention the homepage domain already used -- types, fallback, fetcher --
 * rather than packing all three into one module. Same shape, one convention.
 */

export type AboutLink = {
  label: string;
  href: string;
};

export type AboutColumnItem = {
  id: number;
  text: string;
  order: number;
};

export type AboutColumn = {
  id: number;
  heading: string;
  /** Prose. Empty for the columns that are bullet lists instead. */
  body: string;
  /** Bullets. Empty for the columns that are prose instead. */
  items: AboutColumnItem[];
  order: number;
};

export type AboutStat = {
  id: number;
  /** May be "500+" or "Sun-Fri"; the counter animates only when it has a digit. */
  value: string;
  label: string;
  order: number;
};

/** Only the platforms actually filled in are present, so blanks draw no icon. */
export type TeamSocial = {
  facebook?: string;
  twitter?: string;
  youtube?: string;
};

export type TeamMember = {
  id: number;
  name: string;
  role: string;
  image: string;
  social: TeamSocial;
  order: number;
};

export type AboutContent = {
  heroTitle: string;
  heroDate: string;
  heroScrollPrompt: string;
  heroImage: string;
  eyebrow: string;
  headingLine1: string;
  /** Rendered in the accent colour under line 1. */
  headingLine2: string;
  introBody: string;
  columns: AboutColumn[];
  stats: AboutStat[];
  teamHeading: string;
  teamBody: string;
  team: TeamMember[];
  ctaHeadingLead: string;
  ctaHeadingAccent: string;
  ctaBody: string;
  ctaPrimary: AboutLink;
  ctaSecondary: AboutLink;
  instagramHandle: string;
};

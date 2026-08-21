/**
 * The shape of `GET /api/v1/homepage/` from the Django backend.
 *
 * These mirror `backend/api/serializers.py` one-for-one. The API emits
 * camelCase (see `backend/common/serializers.py`), so nothing needs
 * translating on this side.
 *
 * Every image field arrives as a single resolved string: the backend collapses
 * its (upload, external URL) pair before serialising, so a component never has
 * to decide which one to use. It may be a path into `public/`
 * ("/images/hero-texture.jpg"), a Cloudinary URL, or a URL into the backend's
 * own `/media/` — all three are covered by `next.config.ts`.
 */

export type CtaLink = {
  label: string;
  href: string;
};

export type NavLink = {
  id: number;
  label: string;
  href: string;
  showInHeader: boolean;
  showInFooter: boolean;
  order: number;
};

export type SocialPlatform =
  | "facebook"
  | "instagram"
  | "tiktok"
  | "youtube"
  | "x";

export type SocialLink = {
  id: number;
  platform: SocialPlatform;
  url: string;
  /** Already resolved to "Salon on Facebook" if the admin left it blank. */
  label: string;
  order: number;
};

export type SiteSettings = {
  /** Empty when no logo is set — the header falls back to `brandName` then. */
  logo: string;
  brandName: string;
  badgeCaption: string;
  metaTitle: string;
  metaDescription: string;
  navCta: CtaLink;
  copyrightText: string;
};

export type HeroContent = {
  eyebrow: string;
  /** The design breaks the headline explicitly, so the two lines stay separate. */
  headlineLine1: string;
  headlineLine2: string;
  body: string;
  primaryCta: CtaLink;
  secondaryCta: CtaLink;
  backgroundImage: string;
  stylistImage: string;
  stylistImageAlt: string;
  watermarkImage: string;
  /** Editable in the admin (Hero -> Colours). Any CSS colour. */
  backgroundColor: string;
  headingColor: string;
  bodyColor: string;
  eyebrowColor: string;
  primaryButtonBg: string;
  primaryButtonText: string;
  secondaryButtonColor: string;
};

/**
 * The `icon` choices on `sections.Service` in the Django admin.
 *
 * Kept as a union because it is part of the API contract — the backend will
 * only ever send one of these. There is no longer a drawn icon set on this
 * side: the booking cards lead with the service photograph (`image`) instead,
 * so nothing currently renders off this key. It stays typed so that a backend
 * that adds a choice fails here rather than somewhere further in.
 */
export type ServiceIconKey =
  | "hair"
  | "makeup"
  | "manicure-pedicure"
  | "skincare"
  | "facial";

export type Service = {
  id: number;
  label: string;
  icon: ServiceIconKey;
  /** Non-empty only when an admin uploaded a file to override `icon`. */
  iconImage: string;
  /** A photograph, as opposed to the drawn `icon`. Used by the booking cards. */
  image: string;
  href: string;
  description: string;
  /** DRF serialises DecimalField as a string. */
  priceFrom: string | null;
  order: number;
};

export type WhoWeAreContent = {
  /** Two lines because each animates in from a different side. */
  headingLine1: string;
  headingLine2: string;
  lead: string;
  body: string;
  cta: CtaLink;
  isPublished: boolean;
};

export type MotivationContent = {
  isPublished: boolean;
  lines: string[];
};

export type GalleryImage = {
  id: number;
  image: string;
  alt: string;
  order: number;
};

export type GalleryContent = {
  heading: string;
  /** Body copy already split on its line breaks. */
  lines: string[];
  cta: CtaLink;
  images: GalleryImage[];
  isPublished: boolean;
};

/**
 * A clip on a Class card, or `{}` when the card has none.
 *
 * One shape, because there is one way a clip gets onto a card: somebody pastes
 * its address in the admin. This project stores no video itself.
 *
 * `src` may be an `.m3u8` manifest as easily as an `.mp4` — the player checks
 * the extension rather than being told which it is, so an adaptive stream from
 * any host still works.
 */
export type ClassCardVideo = {
  /** The clip's address. `.mp4` or `.m3u8`; both play. */
  src?: string;
  /**
   * A still to show while the clip buffers. Derived from the source where the
   * host can render one — Cloudinary will, an arbitrary server will not — so
   * this is often absent and the tile is simply black for a moment.
   */
  thumbnail?: string;
};

export type ClassCard = {
  id: number;
  slug: string;
  /** May contain "\n"; the card renders it with `whitespace-pre-line`. */
  name: string;
  href: string;
  image: string;
  /** `{}` when the card is a still only. */
  video: ClassCardVideo;
  order: number;
};

export type ClassesContent = {
  headingTop: string;
  headingBottom: string;
  marqueePhrase: string;
  cards: ClassCard[];
};

export type OurStoryContent = {
  heading: string;
  body: string;
  cta: CtaLink;
  image: string;
  imageAlt: string;
};

export type AsSeenOnContent = {
  heading: string;
  quote: string;
  attribution: string;
  cta: CtaLink;
};

export type FollowUsContent = {
  heading: string;
  body: string;
};

export type FooterContent = {
  /** Three lines because each animates independently in the footer. */
  headingLine1: string;
  headingLine2: string;
  headingLine3: string;
  contactHeading: string;
  contactBody: string;
  email: string;
  phone: string;
  cta: CtaLink;
};

export type SiteContent = {
  site: SiteSettings;
  navLinks: NavLink[];
  footerLinks: NavLink[];
  socialLinks: SocialLink[];
  hero: HeroContent;
  whoWeAre: WhoWeAreContent;
  motivation: MotivationContent;
  gallery: GalleryContent;
  classes: ClassesContent;
  ourStory: OurStoryContent;
  asSeenOn: AsSeenOnContent;
  followUs: FollowUsContent;
  footer: FooterContent;
};

// --- Booking ---------------------------------------------------------------

export type Barber = {
  id: number;
  name: string;
  role: string;
  /** Empty until someone uploads a photo; the card falls back to `initials`. */
  photo: string;
  bio: string;
  initials: string;
  /** Pre-formatted by the API, e.g. "Sun – Fri · 10:00 am – 7:00 pm". Empty if unset. */
  schedule: string;
  /**
   * Whether this barber can be booked right now. Unavailable barbers are still
   * sent — they appear on the card marked as such and cannot be selected —
   * because hiding someone who is only on holiday reads as "they have left".
   */
  isAvailable: boolean;
  /** Badge text: "Available", or the salon's note, e.g. "Back on 20 August". */
  availabilityLabel: string;
  order: number;
};

/** Wording of the booking form's steps — `bookings.BookingSection` in the admin. */
export type BookingCopy = {
  serviceHeading: string;
  barberHeading: string;
  detailsHeading: string;
  paymentHeading: string;
  pageHeading: string;
  pageIntro: string;
  serviceStep: string;
  barberStep: string;
  detailsStep: string;
  paymentStep: string;
  submitLabel: string;
  successHeading: string;
};

export type BookingConfig = {
  services: Service[];
  barbers: Barber[];
  /** `qr` is empty until a QR is uploaded in the admin (Booking form -> Payment). */
  esewa: { qr: string; note: string; depositPercent: number };
  copy: BookingCopy;
};

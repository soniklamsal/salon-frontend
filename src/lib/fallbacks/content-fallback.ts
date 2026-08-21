import type { SiteContent } from "@/lib/types/content-types";

/**
 * The content the site shipped with, as a complete `SiteContent`.
 *
 * This is not sample data — it is the copy that used to be hardcoded in each
 * component, moved to one place. `getSiteContent()` falls back to it whenever
 * the backend cannot be reached, which means:
 *
 *   - `next build` succeeds on a machine with no Django running;
 *   - a backend outage degrades the site to its last known-good copy rather
 *     than to an error page.
 *
 * It is deliberately identical to `backend/core/management/commands/
 * seed_content.py`, which loads the same values into the database. If you edit
 * copy, edit it in the admin — this file is the floor, not the source.
 */

const CLOUDINARY = "https://res.cloudinary.com/ufiebboc/image/upload/";

export const FALLBACK_CONTENT: SiteContent = {
  site: {
    logo: "",
    brandName: "SALON",
    badgeCaption: "We Don't Keep Our Beauty Secrets",
    metaTitle: "Salon — Always Make Room for a Little Beauty in Your Life",
    metaDescription:
      "Premium hair, beauty and spa treatments in Kathmandu, Nepal. Book an appointment or browse the service menu.",
    navCta: { label: "Book Now", href: "/services" },
    copyrightText: "2026 Salon All rights reserved",
  },

  navLinks: [
    { id: 1, label: "Home", href: "/", showInHeader: true, showInFooter: true, order: 0 },
    { id: 2, label: "About Us", href: "/about-us", showInHeader: true, showInFooter: true, order: 1 },
    { id: 3, label: "Service Menu", href: "/services", showInHeader: true, showInFooter: true, order: 2 },
    { id: 4, label: "Contact Us", href: "/contact", showInHeader: true, showInFooter: true, order: 3 },
  ],

  footerLinks: [
    { id: 1, label: "Home", href: "/", showInHeader: true, showInFooter: true, order: 0 },
    { id: 2, label: "About Us", href: "/about-us", showInHeader: true, showInFooter: true, order: 1 },
    { id: 3, label: "Service Menu", href: "/services", showInHeader: true, showInFooter: true, order: 2 },
    { id: 4, label: "Contact Us", href: "/contact", showInHeader: true, showInFooter: true, order: 3 },
  ],

  socialLinks: [
    { id: 1, platform: "facebook", url: "https://facebook.com", label: "Salon on Facebook", order: 0 },
    { id: 2, platform: "instagram", url: "https://instagram.com", label: "Salon on Instagram", order: 1 },
  ],

  hero: {
    eyebrow: "Welcome To Choppers",
    headlineLine1: "Best Hair Salon For A",
    headlineLine2: "Professional Look",
    body: "Choppers offers high performance customized facials to provide you with visible results.",
    primaryCta: { label: "Book Now", href: "/services" },
    secondaryCta: { label: "All Services", href: "/services" },
    backgroundImage: "",
    stylistImage: "/images/hero-stylist.png",
    stylistImageAlt:
      "A barber trimming the hair of a smiling client in a black cape",
    watermarkImage: "/images/choppers-mark.png",
    backgroundColor: "#0a0a0a",
    headingColor: "#ffffff",
    bodyColor: "#9a9a9a",
    eyebrowColor: "#fbb034",
    primaryButtonBg: "#c7ff3d",
    primaryButtonText: "#000000",
    secondaryButtonColor: "#c7ff3d",
  },

  whoWeAre: {
    headingLine1: "WHO",
    headingLine2: "WE ARE",
    lead: "A Kathmandu salon built on craft — every cut shaped to the person in the chair, not to a catalogue.",
    body: "Our stylists train year-round on cuts, colour and care, so the chair you sit in is the same standard every visit.",
    cta: { label: "About us", href: "/about-us" },
    isPublished: true,
  },

  motivation: {
    isPublished: true,
    lines: ["BEAUTY IS POWER", "CONFIDENCE IS YOUR", "BEST ACCESSORY"],
  },

  gallery: {
    heading: "Our Speciality",
    lines: [
      "Capturing elegance and artistry,",
      "witness the transformations that",
      "define our craft.",
    ],
    cta: { label: "View Gallery", href: "#" },
    images: [
      { id: 1, image: "/images/dribbble/first.jpeg", alt: "Editorial fashion landing page", order: 0 },
      { id: 2, image: "/images/dribbble/second.jpeg", alt: "Studio portfolio layout", order: 1 },
      { id: 3, image: "/images/dribbble/third.jpeg", alt: "Brand identity showcase", order: 2 },
      { id: 4, image: "/images/dribbble/fourth.jpeg", alt: "Product page concept", order: 3 },
      { id: 5, image: "/images/dribbble/fifth.jpeg", alt: "Interface design study", order: 4 },
      { id: 6, image: "/images/dribbble/sixth.jpeg", alt: "Marketing site exploration", order: 5 },
    ],
    isPublished: true,
  },

  classes: {
    headingTop: "Moments Captured",
    headingBottom: "In The Chair",
    marqueePhrase:
      "FRESH CUTS • SHARP FADES • CLEAN LINES • EVERY CHAIR • EVERY DAY • REAL MOMENTS",
    cards: [
      { id: 1, slug: "fresh-cut", name: "Fresh\nCut", href: "/services", image: `${CLOUDINARY}v1786269602/devis-gym/people/DSC07734.JPG.webp`, video: {}, order: 0 },
      { id: 2, slug: "sharp-fade", name: "Sharp\nFade", href: "/services", image: `${CLOUDINARY}v1786269452/devis-gym/people/DSC07615-4.JPG.webp`, video: {}, order: 1 },
      { id: 3, slug: "beard-work", name: "Beard\nWork", href: "/services", image: `${CLOUDINARY}v1786269591/devis-gym/people/DSC07629-3.JPG.webp`, video: {}, order: 2 },
      { id: 4, slug: "wash-style", name: "Wash &\nStyle", href: "/services", image: `${CLOUDINARY}v1786269637/devis-gym/people/DSC07636-3.JPG.webp`, video: {}, order: 3 },
      { id: 5, slug: "colour-day", name: "Colour\nDay", href: "/services", image: `${CLOUDINARY}v1786268875/devis-gym/people/DSC07385.JPG.webp`, video: {}, order: 4 },
      { id: 6, slug: "clean-lines", name: "Clean\nLines", href: "/services", image: `${CLOUDINARY}v1786269241/devis-gym/people/DSC07541.JPG.webp`, video: {}, order: 5 },
      { id: 7, slug: "finishing-touch", name: "Finishing\nTouch", href: "/services", image: `${CLOUDINARY}v1786268706/devis-gym/classes/OutdoorActivities.webp`, video: {}, order: 6 },
      { id: 8, slug: "book-your-seat", name: "Book\nYour Seat", href: "/services", image: `${CLOUDINARY}v1786269681/devis-gym/people/DSC07643-3.JPG.webp`, video: {}, order: 7 },
    ],
  },

  ourStory: {
    heading: "Our Story",
    body: "We started as a small beauty salon in Kathmandu, Nepal. Our vision was to create a premium salon experience where beauty meets excellence. We believe in using only the finest products and techniques to help our clients look and feel their absolute best. Our team of expert stylists and beauty professionals are passionate about transforming your look and boosting your confidence with every visit.",
    cta: { label: "Learn More", href: "/about-us" },
    image: "/images/salon-artist.webp",
    imageAlt: "Stylist holding a set of makeup brushes",
  },

  asSeenOn: {
    heading: "As seen On",
    quote: "The place with its constant excellence, soul, and style",
    attribution: "",
    cta: { label: "Learn More", href: "/about-us" },
  },

  followUs: {
    heading: "Follow Us",
    body: "Don’t miss promotions, follow us for the latest news",
  },

  footer: {
    headingLine1: "TIME",
    headingLine2: "TO",
    headingLine3: "SHINE",
    contactHeading: "Contact Us",
    contactBody: "Don’t miss promotions, follow us for the latest news",
    email: "info@beautysalon.com",
    phone: "070 9485 7568",
    cta: { label: "Book a seat", href: "/services" },
  },
};

import type { SiteContent } from "@/lib/types/content-types";

/**
 * The bare structural frame the root layout needs to render its nav and footer
 * when the backend has never successfully loaded — a first build with Django
 * down, say. It is NOT the old bundled content: there is no hero copy, no
 * gallery, no fake services, and no invented phone number or email. Only the
 * things a shell cannot omit — the site's name and the navigation links — plus
 * empty collections and unpublished bands, so nothing fabricated is ever shown.
 *
 * Once any page has rendered against a live backend, ISR serves that cached
 * copy instead, so this is reached only in the genuine never-loaded case.
 */

const NAV = [
  { id: 1, label: "Home", href: "/", showInHeader: true, showInFooter: true, order: 0 },
  { id: 2, label: "About Us", href: "/about-us", showInHeader: true, showInFooter: true, order: 1 },
  { id: 3, label: "Service Menu", href: "/services", showInHeader: true, showInFooter: true, order: 2 },
  { id: 4, label: "Contact Us", href: "/contact", showInHeader: true, showInFooter: true, order: 3 },
];

export const SITE_CHROME: SiteContent = {
  site: {
    logo: "",
    brandName: "AJ Salon",
    badgeCaption: "",
    metaTitle: "AJ Salon",
    metaDescription: "",
    navCta: { label: "Book Now", href: "/services" },
    copyrightText: "",
  },

  navLinks: NAV,
  footerLinks: NAV,
  socialLinks: [],

  hero: {
    eyebrow: "",
    headlineLine1: "",
    headlineLine2: "",
    body: "",
    primaryCta: { label: "Book Now", href: "/services" },
    secondaryCta: { label: "All Services", href: "/services" },
    backgroundImage: "",
    stylistImage: "",
    stylistImageAlt: "",
    watermarkImage: "",
    backgroundColor: "#0a0a0a",
    headingColor: "#ffffff",
    bodyColor: "#9a9a9a",
    eyebrowColor: "#fbb034",
    primaryButtonBg: "#c7ff3d",
    primaryButtonText: "#000000",
    secondaryButtonColor: "#c7ff3d",
  },

  whoWeAre: {
    headingLine1: "",
    headingLine2: "",
    lead: "",
    body: "",
    cta: { label: "", href: "/about-us" },
    isPublished: false,
  },

  motivation: { isPublished: false, lines: [] },

  gallery: {
    heading: "",
    lines: [],
    cta: { label: "", href: "/services" },
    images: [],
    isPublished: false,
  },

  classes: {
    headingTop: "",
    headingBottom: "",
    marqueePhrase: "",
    cards: [],
  },

  ourStory: {
    heading: "",
    body: "",
    cta: { label: "", href: "/about-us" },
    image: "",
    imageAlt: "",
  },

  asSeenOn: { heading: "", quote: "", attribution: "", cta: { label: "", href: "/about-us" } },

  followUs: { heading: "", body: "" },

  footer: {
    headingLine1: "",
    headingLine2: "",
    headingLine3: "",
    contactHeading: "",
    contactBody: "",
    email: "",
    phone: "",
    cta: { label: "Book a seat", href: "/services" },
  },
};

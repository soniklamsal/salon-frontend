/**
 * The About page as it shipped, used when the backend cannot be reached.
 *
 * Kept in sync with the seed in `sections/migrations/0015_seed_about_content.py`
 * by hand -- there are only two copies and they change rarely.
 *
 * Note: the team photographs and hero art here point at a Cloudinary account
 * the salon does not own (`ufiebboc`, the devis-gym demo). That is recorded as
 * an open content decision in the production audit; it is reproduced unchanged
 * here because this file's job is to mirror what the seeded database serves,
 * not to differ from it.
 */

import type { AboutContent } from "@/lib/types/about-types";

const CLOUDINARY_PEOPLE =
  "https://res.cloudinary.com/ufiebboc/image/upload/v{v}/devis-gym/people/Trainers/{f}";

const person = (v: string, f: string) =>
  CLOUDINARY_PEOPLE.replace("{v}", v).replace("{f}", f);

/** Years the salon has been open, matching the backend's `{years}` token. */
const YEARS = new Date().getFullYear() - 2018;

/**
 * The page as it shipped, used when the backend cannot be reached.
 *
 * Kept in sync with the seed in `sections/migrations/0015_seed_about_content.py`
 * by hand — there are only two copies and they change rarely.
 */
export const FALLBACK_ABOUT: AboutContent = {
  heroTitle: "Beauty Salon Experience",
  heroDate: "In Kathmandu since 2018",
  heroScrollPrompt: "Scroll to Explore Our Salon",
  heroVideoUrl:
    "https://res.cloudinary.com/dr54mqokd/video/upload/v1787366273/media/about/video/8100338-uhd_2160_4096_25fps_1_qyknkj.mp4",
  heroBgImage:
    "https://res.cloudinary.com/dr54mqokd/image/upload/v1787363940/media/about/pexels-artbovich-7750137_wdiaq5.jpg",
  eyebrow: "About Our Salon",
  headingLine1: "More Than",
  headingLine2: "Just A Salon.",
  introBody:
    `Our Salon provides a unique way to engage with our beauty community ` +
    `through personalized experiences. Located in the heart of Kathmandu, we ` +
    `have been transforming lives for over ${YEARS} years with our commitment ` +
    `to exceptional beauty services and personalized styling solutions. Our ` +
    `state-of-the-art facility combines modern techniques with expert guidance ` +
    `from 6+ certified stylists who are passionate about helping you achieve ` +
    `your beauty goals. Open Sunday through Friday from 10:00 AM to 8:00 PM, ` +
    `we offer flexible hours to fit your schedule. With a supportive community ` +
    `of 500+ happy clients, we offer more than just a beauty service - we ` +
    `provide a complete beauty experience designed to unlock your true confidence.`,
  columns: [
    {
      id: 1,
      heading: "Our Facilities",
      body: "",
      order: 0,
      items: [
        { id: 1, text: "Premium hair styling stations", order: 0 },
        { id: 2, text: "Professional makeup area", order: 1 },
        { id: 3, text: "Spa and treatment rooms", order: 2 },
        { id: 4, text: "Professional styling consultation", order: 3 },
      ],
    },
    {
      id: 2,
      heading: "Why Choose Us",
      body: "",
      order: 1,
      items: [
        { id: 5, text: "Located in the heart of Kathmandu", order: 0 },
        { id: 6, text: "Welcoming beauty community", order: 1 },
        { id: 7, text: "Flexible membership options", order: 2 },
        { id: 8, text: "Clean and well-maintained facility", order: 3 },
      ],
    },
    {
      id: 3,
      heading: "Mission",
      body:
        "Our purpose is to pass on empowering beauty knowledge and styling " +
        "guidance in order to have a positive impact on the confidence and " +
        "self-expression of everyone we work with.\n\n" +
        "To provide a personalized beauty and styling service that unlocks " +
        "every individual's true confidence so they can express their unique " +
        "style and achieve their desired look.",
      order: 2,
      items: [],
    },
    {
      id: 4,
      heading: "Story",
      body:
        "Our main focus at our Salon is personalized beauty services because " +
        "of the proven benefits. With an emphasis on individual style, quality " +
        "products and expert techniques, our personalized approach ensures " +
        "that every client receives treatments tailored specifically to their " +
        "unique needs and preferences.",
      order: 3,
      items: [],
    },
  ],
  stats: [
    { id: 1, value: `${YEARS}+`, label: "Years in Beauty Industry", order: 0 },
    { id: 2, value: "500+", label: "Happy Clients", order: 1 },
    { id: 3, value: "6+", label: "Expert Stylists", order: 2 },
    { id: 4, value: "Sun-Fri", label: "10:00 AM - 8:00 PM", order: 3 },
  ],
  teamHeading: "Meet Our Team",
  teamBody:
    "Our certified beauty professionals are passionate about helping you look " +
    "and feel your best. With years of experience and specialized training in " +
    "the latest beauty trends and techniques, they provide personalized " +
    "styling and treatments tailored to your unique needs.",
  team: [
    { id: 1, name: "Bijay Grg", role: "Senior Stylist", image: person("1786269634", "BijayGrg.JPG.webp"), social: {}, order: 0 },
    { id: 2, name: "Aditya Grg", role: "Hair Specialist", image: person("1786269619", "AdityaGrg.JPG.webp"), social: {}, order: 1 },
    { id: 3, name: "Barsha Grg", role: "Makeup Artist", image: person("1786269630", "BarshaGrg.JPG.webp"), social: {}, order: 2 },
    { id: 4, name: "Abhishek Mishra", role: "Color Specialist", image: person("1786269614", "AbhishekMishra.JPG.webp"), social: {}, order: 3 },
    { id: 5, name: "Anup Grg", role: "Beauty Consultant", image: person("1786269624", "AnupGrg.JPG.webp"), social: {}, order: 4 },
  ],
  ctaHeadingLead: "Ready to",
  ctaHeadingAccent: "Book Your Appointment?",
  ctaBody:
    "Join our community and experience what beauty excellence feels like. " +
    "No commitments, no pressure - just stunning results.",
  ctaPrimary: { label: "Contact Us", href: "/contact" },
  ctaSecondary: { label: "View Membership", href: "/#membership" },
  instagramHandle: "@beautysalon_kathmandu",
};

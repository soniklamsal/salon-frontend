import type { Metadata } from "next";
import { Jost, Kiwi_Maru, Poppins } from "next/font/google";
import "./globals.css";
import { KineticNav } from "@/components/layout/kinetic-nav";
import { SmoothScrollProvider } from "@/providers/smooth-scroll-provider";
import { TimeToRoarFooter } from "@/components/layout/time-to-roar-footer";
import { AuthProvider } from "@/features/auth/components/auth-provider";
import { isAuthConfigured } from "@/lib/auth";
import { getSiteContent } from "@/lib/api/content";
import { absoluteUrl, SITE_URL, warnIfUnconfigured } from "@/lib/seo/site";

// Jost is a variable font, so every weight the design uses (600/700/800) comes
// from one file. Kiwi Maru is not variable — the design only uses 500.
const jost = Jost({
  variable: "--font-jost",
  subsets: ["latin"],
});

const kiwiMaru = Kiwi_Maru({
  variable: "--font-kiwi-maru",
  subsets: ["latin"],
  weight: ["500"],
});

// The hero (Figma "Landing Page Salon (Community)" 3:202) sets everything in
// Poppins. Not a variable font either, so the two weights it uses are listed.
const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["400", "700"],
});

/**
 * Title and description are editable in the admin (Site → Site settings), so
 * they are generated rather than declared. This shares the same memoized fetch
 * as the page below it, so the two together still cost one request.
 *
 * Open Graph and Twitter cards are built from the same two fields rather than a
 * second set someone would have to keep in step — a salon with one description
 * does not need two. The share image is the hero's stylist photograph, which is
 * already the picture the brand leads with; `metadataBase` resolves it whether
 * the CMS returns a path into `public/`, a Cloudinary URL, or one into the
 * backend's `/media/`.
 *
 * `title` is a template so child routes read as "Contact Us · Salon" rather
 * than replacing the brand outright. The root uses `default`.
 */
export async function generateMetadata(): Promise<Metadata> {
  warnIfUnconfigured();
  const { site, hero } = await getSiteContent();

  return {
    metadataBase: new URL(SITE_URL),
    title: {
      default: site.metaTitle,
      template: `%s · ${site.brandName}`,
    },
    description: site.metaDescription,
    applicationName: site.brandName,
    alternates: { canonical: "/" },
    openGraph: {
      type: "website",
      siteName: site.brandName,
      title: site.metaTitle,
      description: site.metaDescription,
      url: absoluteUrl("/"),
      locale: "en_US",
      images: hero.stylistImage
        ? [
          {
            url: hero.stylistImage,
            alt: hero.stylistImageAlt || site.metaTitle,
          },
        ]
        : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: site.metaTitle,
      description: site.metaDescription,
      images: hero.stylistImage ? [hero.stylistImage] : undefined,
    },
    robots: {
      // Explicit rather than assumed, and it is the marketing pages this is
      // about — the private routes are excluded in `robots.ts`.
      index: true,
      follow: true,
    },
  };
}

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const { site, navLinks, socialLinks, footer } = await getSiteContent();

  /*
    Evaluated here, on the server, because the variables it reads are secrets
    and must not reach the browser. The boolean does — see auth-provider.tsx.
  */
  const authConfigured = isAuthConfigured();

  return (
    <html
      lang="en"
      className={`${jost.variable} ${kiwiMaru.variable} ${poppins.variable} h-full antialiased`}
    >
      {/*
        Browser extensions (ColorZilla adds `cz-shortcut-listen`, password
        managers add their own) write attributes onto <body> before React
        hydrates, which React reports as a mismatch. This suppresses the
        warning for <body>'s own attributes only — mismatches inside the tree
        are still reported.
      */}
      {/*
        The header sits outside SmoothScrollProvider, as it does in the
        devis-gym demo: it is positioned against the viewport, not the scrolled
        content, so it must not be inside anything Lenis transforms.
      */}
      <body suppressHydrationWarning className="flex min-h-full flex-col">
        {/*
          Wraps the whole body rather than the html element: SessionProvider
          renders a context provider and nothing else, but keeping it inside
          <body> avoids putting a client component between <html> and <body>,
          which Next warns about.
        */}
        <AuthProvider configured={authConfigured}>
          <KineticNav
            links={navLinks}
            cta={site.navCta}
            logo={site.logo}
            brandName={site.brandName}
            social={socialLinks}
          />
          <SmoothScrollProvider>{children}</SmoothScrollProvider>
          {/*
            One footer for the whole site, mounted here rather than per page so
            every route — including any added later — ends the same way. It
            sits outside SmoothScrollProvider only because that provider
            renders a bare fragment; there is no wrapper to be in or out of.

            Each page therefore renders <main> and nothing after it.
          */}
          <TimeToRoarFooter
            content={footer}
            social={socialLinks}
            site={site}
          />
        </AuthProvider>
      </body>
    </html>
  );
}

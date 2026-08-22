import type { Metadata } from "next";
import { Jost, Kiwi_Maru, Poppins } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { ClerkProvider } from "@clerk/nextjs";
import { shadcn } from "@clerk/ui/themes";

import { KineticNav } from "@/components/layout/kinetic-nav";
import { SmoothScrollProvider } from "@/providers/smooth-scroll-provider";
import { TimeToRoarFooter } from "@/components/layout/time-to-roar-footer";
import { CLERK_ENABLED } from "@/lib/auth";
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
    ClerkProvider reads the publishable key as it renders and throws without
    one, which would take down every page rather than just the booking gate.
    Wrapping conditionally keeps the site serving until the keys are added —
    see lib/auth.ts.
  */
  const tree = (
    <html
      lang="en"
      className={`${jost.variable} ${kiwiMaru.variable} ${poppins.variable} h-full antialiased`}
    >
      <head>
        {/* Critical inline CSS - prevents layout shift */}
        <style
          dangerouslySetInnerHTML={{
            __html: `
              /* Critical above-the-fold styles */
              *,::before,::after{box-sizing:border-box;border-width:0;border-style:solid;border-color:currentColor}
              html{line-height:1.5;-webkit-text-size-adjust:100%;font-family:ui-sans-serif,system-ui,sans-serif}
              body{margin:0;line-height:inherit;background:#fff;font-family:var(--font-jost),ui-sans-serif,system-ui,sans-serif}
              .flex{display:flex}.hidden{display:none}.relative{position:relative}.absolute{position:absolute}.fixed{position:fixed}
              .min-h-full{min-height:100%}.min-h-svh{min-height:100svh}.h-full{height:100%}.w-full{width:100%}
              .flex-col{flex-direction:column}.items-center{align-items:center}.justify-between{justify-content:space-between}
              .overflow-hidden{overflow:hidden}.antialiased{-webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale}
              .site-header-wrapper{position:absolute;top:0;left:0;width:100%;z-index:60;pointer-events:none;background:transparent}
              @media(max-width:1279px){.site-header-wrapper{position:fixed}}
            `,
          }}
        />

        {/* Preconnect to external domains */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />

        {/* Async CSS loading for non-critical styles */}
        <Script
          id="async-css-loader"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              (function(){
                var links=document.getElementsByTagName('link');
                for(var i=0;i<links.length;i++){
                  var link=links[i];
                  if(link.rel==='stylesheet'&&link.getAttribute('data-n-p')){
                    link.media='print';
                    link.onload=function(){this.media='all'};
                  }
                }
              })();
            `,
          }}
        />
      </head>

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
          every route — including any added later — ends the same way. It sits
          outside SmoothScrollProvider only because that provider renders a bare
          fragment; there is no wrapper to be inside or outside of.

          Each page therefore renders <main> and nothing after it.
        */}
        <TimeToRoarFooter
          content={footer}
          social={socialLinks}
          site={site}
        />
      </body>
    </html>
  );

  // `shadcn` theme so Clerk's widgets inherit the same tokens as
  // components/ui — see the shadcn block at the end of globals.css.
  return CLERK_ENABLED ? (
    <ClerkProvider appearance={{ theme: shadcn }}>{tree}</ClerkProvider>
  ) : (
    tree
  );
}

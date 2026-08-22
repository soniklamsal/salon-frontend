import {
  AboutContentSections,
  AboutIntro,
} from "@/features/about/components/about-sections";
import { ScrollToTop } from "@/features/about/components/scroll-to-top";
import { BackButton } from "@/components/shared/back-button";
import { JsonLd } from "@/components/shared/json-ld";
import { MobileAboutHero } from "@/features/about/components/mobile-about-hero";
import { ScrollExpansionHero } from "@/components/shared/scroll-expansion-hero";
import { getAboutContent } from "@/lib/api/about";
import { buildAboutPage } from "@/lib/seo/structured-data";
import { headers } from "next/headers";

/**
 * About Us.
 *
 * Server-side mobile detection ensures desktop component never renders on mobile.
 * Mobile gets completely separate hero component with no desktop artifacts.
 */

// Server-side mobile detection
function isMobileDevice(userAgent: string): boolean {
  return /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(
    userAgent.toLowerCase()
  );
}

export default async function AboutPage() {
  const about = await getAboutContent();
  const headersList = await headers();
  const userAgent = headersList.get("user-agent") || "";
  const isMobile = isMobileDevice(userAgent);

  const content = (
    <>
      <AboutIntro about={about} />
      <AboutContentSections about={about} />
    </>
  );

  return (
    <>
      <JsonLd
        data={buildAboutPage(
          "About Us",
          "More than just a salon. Our chairs, our craft, our story and the team behind them."
        )}
      />
      <ScrollToTop />

      <main className="flex-1 min-h-screen bg-background font-gotham">
        <BackButton />

        {isMobile ? (
          // Mobile: Completely separate component - NO desktop rendering
          <MobileAboutHero
            videoUrl={about.heroVideoUrl}
            title={about.heroTitle}
            date={about.heroDate}
          >
            {content}
          </MobileAboutHero>
        ) : (
          // Desktop: Full GSAP scroll expansion hero
          <ScrollExpansionHero
            mediaType="video"
            mediaSrc={about.heroVideoUrl}
            posterSrc={about.heroBgImage || undefined}
            bgImageSrc={about.heroBgImage}
            title={about.heroTitle}
            date={about.heroDate}
            scrollToExpand={about.heroScrollPrompt}
            textBlend
          >
            {content}
          </ScrollExpansionHero>
        )}
      </main>
    </>
  );
}

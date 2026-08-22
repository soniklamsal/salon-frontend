import {
  AboutContentSections,
  AboutIntro,
} from "@/features/about/components/about-sections";
import { ScrollToTop } from "@/features/about/components/scroll-to-top";
import { BackButton } from "@/components/shared/back-button";
import { JsonLd } from "@/components/shared/json-ld";
import { ScrollExpansionHero } from "@/components/shared/scroll-expansion-hero";
import { MobileHero } from "@/components/shared/mobile-hero";
import { getAboutContent } from "@/lib/api/about";
import { buildAboutPage } from "@/lib/seo/structured-data";
import { headers } from "next/headers";

/**
 * About Us.
 *
 * Server-side mobile detection ensures desktop component never loads on mobile.
 * Uses user-agent to determine which hero component to render.
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
          // Mobile: Only render mobile hero - desktop component never loads
          <MobileHero
            mediaType="video"
            mediaSrc={about.heroVideoUrl}
            posterSrc={about.heroBgImage || undefined}
            title={about.heroTitle}
            date={about.heroDate}
          >
            {content}
          </MobileHero>
        ) : (
          // Desktop: Only render desktop hero - mobile component never loads
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

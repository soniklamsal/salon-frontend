import {
  AboutContentSections,
  AboutIntro,
} from "@/features/about/components/about-sections";
import { ScrollToTop } from "@/features/about/components/scroll-to-top";
import { BackButton } from "@/components/shared/back-button";
import { JsonLd } from "@/components/shared/json-ld";
import { SimpleVideoHero } from "@/features/about/components/simple-video-hero";
import { getAboutContent } from "@/lib/api/about";
import { buildAboutPage } from "@/lib/seo/structured-data";

/**
 * About Us.
 *
 * Simple video hero with no GSAP - works consistently across all devices.
 */

export default async function AboutPage() {
  const about = await getAboutContent();

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

        {/* Simple video hero - no GSAP, works on all devices */}
        <SimpleVideoHero
          videoUrl={about.heroVideoUrl}
          title={about.heroTitle}
          date={about.heroDate}
          scrollPrompt={about.heroScrollPrompt}
        >
          {content}
        </SimpleVideoHero>
      </main>
    </>
  );
}

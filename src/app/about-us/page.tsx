import {
  AboutContentSections,
  AboutIntro,
} from "@/features/about/components/about-sections";
import { ScrollToTop } from "@/features/about/components/scroll-to-top";
import { BackButton } from "@/components/shared/back-button";
import { JsonLd } from "@/components/shared/json-ld";
import { ScrollExpansionHero } from "@/components/shared/scroll-expansion-hero";
import { getAboutContent } from "@/lib/api/about";
import { buildAboutPage } from "@/lib/seo/structured-data";

/**
 * About Us.
 *
 * A Server Component that fetches `/api/v1/about/` and composes the page.
 * Everything here is editable under "About us" in the Django admin, and
 * `getAboutContent()` falls back to the copy the page shipped with if the
 * backend is unreachable — so a stopped API costs editing, not serving.
 *
 * The composition is the point. Three client components are involved —
 * `ScrollToTop`, `BackButton` and `ScrollExpansionHero` — and the page's actual
 * content is passed to the last of them as `children`. Children are rendered on
 * the server and handed over as output, so they never enter the client
 * component's module graph and never reach the browser as JavaScript.
 *
 * This replaced a single `about-page-client.tsx` that carried `"use client"` at
 * the top and therefore shipped its team grid, stat block, intro copy and CTA
 * to the browser to support one count-up animation and one scroll reset.
 */
export default async function AboutPage() {
  const about = await getAboutContent();

  return (
    <>
      {/* No HairSalon node here: this page does not render the address or
          hours, so it points at the homepage's node instead of restating
          facts it is not showing. */}
      <JsonLd
        data={buildAboutPage(
          "About Us",
          "More than just a salon. Our chairs, our craft, our story and the team behind them."
        )}
      />
      <ScrollToTop />

      <main className="flex-1 min-h-screen bg-background font-gotham">
        <BackButton />
        {/* `bgImageSrc`/`posterSrc` skip `cldOptimize`, unlike the photos further
            down: that asset is already a small 118KB file, and asking Cloudinary
            for a 1920-wide derivative upscales it to 256KB. */}
        <ScrollExpansionHero
          mediaType="video"
          mediaSrc={about.heroVideoUrl}
          // One image covers both slots. It is the backdrop on arrival, and it
          // stands in inside the video frame until the video data arrives --
          // without a poster that moment is a black rectangle. There is no
          // separate poster field to manage.
          posterSrc={about.heroBgImage || undefined}
          bgImageSrc={about.heroBgImage}
          title={about.heroTitle}
          date={about.heroDate}
          scrollToExpand={about.heroScrollPrompt}
          textBlend
        >
          <AboutIntro about={about} />
          <AboutContentSections about={about} />
        </ScrollExpansionHero>
      </main>
    </>
  );
}

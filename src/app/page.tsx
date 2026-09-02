import { AsSeenOn } from "@/features/homepage/components/as-seen-on";
import { ClassesDesigned } from "@/features/homepage/components/classes-designed";
import { DribbbleGrid } from "@/features/homepage/components/dribbble-grid";
import { FollowUs } from "@/features/homepage/components/follow-us";
import { Hero } from "@/features/homepage/components/hero";
import { JsonLd } from "@/components/shared/json-ld";
import { MotivationLines } from "@/features/homepage/components/motivation-lines";
import { OurStory } from "@/features/homepage/components/our-story";
import { WhoWeAre } from "@/features/homepage/components/who-we-are";
import { ContentUnavailable } from "@/components/shared/content-unavailable";
import { getSiteContent } from "@/lib/api/content";
import { buildHairSalon } from "@/lib/seo/structured-data";

/**
 * Every band on this page is edited in the Django admin and arrives in one
 * request. `getSiteContent()` returns `null` only when the backend has never
 * loaded — the skeleton in `loading.tsx` covers the wait, and once a real
 * render is cached (ISR) it keeps serving. A `null` here therefore means a
 * genuine first-time outage, which shows the honest updating state, not
 * invented content.
 */
export default async function Home() {
  const content = await getSiteContent();
  if (!content) return <ContentUnavailable what="The home page" />;

  // Two bands can be switched off from the admin. Deciding here rather than
  // inside each component keeps the "is there anything to show" question in one
  // place and means an empty band is never mounted at all.
  const showMotivation =
    content.motivation.isPublished && content.motivation.lines.length > 0;
  const showGallery =
    content.gallery.isPublished && content.gallery.images.length > 0;

  return (
    <>
      {/*
        The business node every other page's JSON-LD references by @id, so
        three pages describe one salon rather than three. Built entirely
        from CMS fields -- see lib/structured-data.ts.
      */}
      <JsonLd data={buildHairSalon(content)} />
      <main className="flex-1">
        <Hero content={content.hero} />
        {content.whoWeAre.isPublished ? (
          <WhoWeAre content={content.whoWeAre} />
        ) : null}
        {/* None of these is wrapped in Reveal — they run their own scroll
            animations, and a Reveal wrapper's transform would break the
            scrubbed parallax. */}
        {showMotivation ? <MotivationLines content={content.motivation} /> : null}
        {showGallery ? <DribbbleGrid content={content.gallery} /> : null}
        <ClassesDesigned content={content.classes} />
        <OurStory content={content.ourStory} />
        <AsSeenOn content={content.asSeenOn} />
        <FollowUs
          content={content.followUs}
          social={content.socialLinks}
          site={content.site}
        />
      </main>
    </>
  );
}

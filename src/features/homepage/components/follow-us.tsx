import { SalonBadge } from "@/components/shared/salon-badge";
import { SocialIconRow } from "@/components/shared/social-icon";
import type {
  FollowUsContent,
  SiteSettings,
  SocialLink,
} from "@/lib/types/content-types";

/**
 * "Follow Us" band.
 *
 * Cloned from Figma "Salon Website (Community)" → Home page (97:985),
 * Group 6 (97:1108), band y=2807..3604 (797 tall):
 *   97:1109  Rectangle 7   1440x797  fill #f6ebe7
 *   97:1110  Rectangle 11  x=700 y=3000 40x526 r=27  #fccab8 → #ff8e67
 *   97:1111  Group 5       right edge, w=138
 *              97:1112 y=2870 h=373 #f78c65 @ 66%
 *              97:1113 y=3243 h=361 #fccab8
 *              FACEBOOK / INSTAGRAM, Kiwi Maru 500 20/29 tracking 6.8, rotated -89°
 *   97:1116  curve quote   x=187 y=3112 338x298 — ring + SALON + curved caption,
 *                          shared with the footer as `SalonBadge`
 *   97:1152  Frame 17      x=915 y=3164.5 w=283, auto-layout gap 69
 *
 * Copy comes from `sections.FollowUsSection` and the links from
 * `core.SocialLink`, both via `lib/content.ts`.
 */

/**
 * 97:1111 — the two vertical labels pinned to the right edge.
 *
 * The design has exactly two panels at fixed heights, so this renders the
 * first two social links into them rather than growing a column per link — the
 * two heights (373 and 361) sum to the band and would not survive a third. Any
 * further links still appear in the icon row below; these panels are
 * decoration, which is why the whole strip is `aria-hidden`.
 */
function VerticalSocialLabels({ links }: { links: SocialLink[] }) {
  const panels = links.slice(0, 2);
  if (panels.length === 0) return null;

  const heights = ["h-[373px]", "h-[361px]"];
  const fills = ["bg-[#c7ff3d]", "bg-[#a8e02c]"];

  return (
    <div
      aria-hidden
      className="absolute right-0 top-[63px] hidden h-[734px] w-[138px] flex-col xl:flex"
    >
      {panels.map((link, i) => (
        <div
          key={link.id}
          className={`flex items-center justify-center ${heights[i]} ${fills[i]}`}
        >
          <span className="font-display text-[20px] font-medium leading-[29px] tracking-[6.8px] text-[#0a0a0a] uppercase [writing-mode:vertical-rl]">
            {link.platform}
          </span>
        </div>
      ))}
    </div>
  );
}

export function FollowUs({
  content,
  social,
  site,
}: {
  content: FollowUsContent;
  social: SocialLink[];
  site: SiteSettings;
}) {
  return (
    <section className="relative z-0 -mt-[145px] w-full overflow-hidden bg-[#0a0a0a] xl:-mt-[161px]">
      <div className="relative mx-auto w-full max-w-[1440px] px-6 pb-20 pt-[170px] xl:h-[797px] xl:px-0 xl:py-0">
        <VerticalSocialLabels links={social} />

        {/* 97:1110 — decorative gradient rule between the badge and the copy */}
        <span
          aria-hidden
          className="absolute left-[700px] top-[193px] hidden h-[526px] w-[40px] rounded-[27px] bg-[linear-gradient(180deg,#c7ff3d_25%,#a8e02c_82%)] xl:block"
        />

        {/* Flattened: removed unnecessary wrapping divs */}
        <div className="xl:absolute xl:left-[187px] xl:top-[305px]">
          <SalonBadge
            logo={site.logo}
            brandName={site.brandName}
            caption={site.badgeCaption}
          />
        </div>

        {/* 97:1152 — Frame 17, auto-layout VERTICAL gap 69 */}
        <div className="mt-14 w-full max-w-[283px] mx-auto flex flex-col items-center xl:absolute xl:left-[915px] xl:top-[357.5px] xl:mt-0 xl:mx-0">
          <h2 className="text-center text-[32px] font-bold leading-[1.2] text-white sm:text-[42px] xl:leading-[60.7px]">
            {content.heading}
          </h2>
          <p className="mt-[12px] text-center text-[18px] font-medium leading-[26px] text-white/80">
            {content.body}
          </p>
          <nav className="mt-[69px]" aria-label="Social media links">
            <SocialIconRow links={social} />
          </nav>
        </div>
      </div>
    </section>
  );
}

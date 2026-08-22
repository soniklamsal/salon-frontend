import type { AsSeenOnContent } from "@/lib/types/content-types";

/**
 * "As seen On" band.
 *
 * Cloned from Figma "Salon Website (Community)" → Home page (97:985),
 * Group 4 (97:1159), band y=2263..2968 (705 tall):
 *   97:1160  curve bg   two mirrored VECTORs filling #fccab8, 1520.8 wide at
 *                       x=-40.4 — it deliberately overflows the 1440 frame,
 *                       which is what gives the wavy top and bottom edges
 *   97:1165  "As seen On"  y=2419  Jost 700 42/60.7
 *   97:1164  quote         y=2536  Kiwi Maru 500 42/60.8, centred, w=937
 *   97:1166  Learn More    y=2755  251.4x52  r=8
 *
 * The wave is a CSS background rather than an inline SVG so it can stretch to
 * whatever height the content needs (`100% 100%`); the curves are gentle enough
 * that the vertical scaling is invisible.
 *
 * It must be laid out 1520.8/1440 = 105.61% wide at left -40.4/1440 = -2.81%,
 * exactly as in Figma, and clipped. Squeezing the shape into 1440 instead
 * brings its curved left and right edges inside the viewport and leaves white
 * wedges down both sides.
 *
 * This band OVERLAPS its neighbours — that is the whole point of the wave.
 * Figma: Our Story runs to y=2407, this starts at 2263 (144px up), and Follow
 * Us starts at 2807 while this runs to 2968 (161px down). Stacked end to end
 * instead, the transparent area above the crest shows page-white rather than
 * the blush behind it. It also has to paint ABOVE both neighbours (`z-10`),
 * which DOM order alone would not give it against the later Follow Us band.
 */
export function AsSeenOn({ content }: { content: AsSeenOnContent }) {
  return (
    <section className="relative z-10 -mt-[130px] w-full overflow-hidden xl:-mt-[144px]">
      <div aria-hidden className="absolute inset-0 overflow-hidden">
        <div className="absolute left-[-2.81%] top-0 h-full w-[105.61%] bg-[url('/images/wave.svg')] bg-[length:100%_100%] bg-no-repeat" />
      </div>

      {/*
        The wave's transparent bands are ~20% of the height at the top and ~23%
        at the bottom, so the padding has to clear them or the copy lands on
        bare page. At the design width the Figma offsets take over instead.
      */}
      <div className="relative mx-auto flex min-h-[600px] w-full max-w-[1440px] flex-col items-center px-6 pb-[165px] pt-[150px] xl:h-[705px] xl:min-h-0 xl:p-0">
        <h2 className="text-center text-[32px] font-bold leading-[1.2] text-white sm:text-[42px] xl:mt-[156px] xl:leading-[60.7px]">
          {content.heading}
        </h2>

        {/* The quote marks belong to the design, so they are added here rather
            than typed into the admin field — see the model's help text. */}
        <blockquote className="mt-8 max-w-[937px] text-center font-display text-[26px] font-medium leading-[1.45] text-white/90 sm:text-[34px] xl:mt-[56px] xl:text-[42px] xl:leading-[60.8px]">
          &ldquo;{content.quote}&rdquo;
        </blockquote>

        {content.attribution ? (
          <p className="mt-4 text-center text-[16px] text-white/70">
            — {content.attribution}
          </p>
        ) : null}
      </div>
    </section>
  );
}

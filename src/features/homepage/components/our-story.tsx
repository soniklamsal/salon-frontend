import Image from "next/image";
import Link from "next/link";

import { PhotoFrameIcon } from "@/components/shared/story-art";
import type { OurStoryContent } from "@/lib/types/content-types";

/**
 * "Our Story" band.
 *
 * Cloned from Figma "Salon Website (Community)" → Home page (97:985),
 * band y=1685..2407 (722 tall):
 *   97:1097  Rectangle 2   1440x722  fill #fccab8 @ 50%
 *   97:1186  makeup-artits x=106 y=1753 w=568 h=491
 *              97:1187 blush panel  x=132 w=449 h=491  fill #fccab8
 *              97:1188 photo        x=120 y=1789 461x455  (imageRef, STRETCH)
 *              97:1189 frame        x=194 y=1774 432x449  8px INSIDE gradient stroke
 *              97:1190 four gradient dots
 *   97:1098  story section x=845 w=459
 *              Frame 18 auto-layout VERTICAL gap 50
 *                Frame 19 gap 29: heading Jost 700 42/60.7 + body Jost 400 18/26
 *                97:1103 Learn More  250x52  r=8  1px #230a01 border
 *
 * The photo collage is positioned in percentages of its own 568x491 box so the
 * whole arrangement scales as one unit instead of being pinned to 1440.
 */

/** Figma 97:1190 — decorative dots, each a #fccab8 → #e88764 gradient. */
const DOTS = [
  { left: "88.03%", top: "0.2%", size: "6.87%" }, // Ellipse 2, 39px
  { left: "94.19%", top: "81.67%", size: "5.81%" }, // Ellipse 5, 33px
  { left: "0%", top: "52.95%", size: "9.15%" }, // Ellipse 4, 52px
  { left: "29.05%", top: "3.46%", size: "3.35%" }, // Ellipse 3, 19px
];

export function OurStory({ content }: { content: OurStoryContent }) {
  return (
    /* The wave band below overlaps this one by 130px, and its crest can be
       opaque from its very top edge, so the copy needs that much clearance at
       the foot or the Learn More button ends up underneath it. */
    <section className="w-full bg-[#0a0a0a] pb-[150px] pt-16 xl:py-0">
      <div className="mx-auto flex w-full max-w-[1440px] flex-col items-center gap-12 px-6 xl:h-[722px] xl:flex-row xl:items-start xl:gap-0 xl:px-0">
        {/* Photo collage — Figma 97:1186 */}
        <div className="relative w-full max-w-[568px] shrink-0 xl:ml-[106px] xl:mt-[68px] xl:w-[568px]">
          <div className="relative aspect-[568/491] w-full">
            {/* 97:1187 solid blush panel behind everything */}
            <div className="absolute left-[4.58%] top-0 h-full w-[79.05%] bg-blush" />

            {/* 97:1188 the photograph */}
            <div className="absolute left-[2.46%] top-[7.33%] h-[92.67%] w-[81.16%]">
              {/*
                Two things this asset needs. It is a transparent cut-out, so it
                must keep its alpha channel — WebP, not JPEG, or the subject is
                flattened onto a black box that hides the blush panel. And the
                Figma fill carries an imageTransform crop (x 15.8%..84.1%,
                y 9.7%..100%), which is baked into the exported file; the
                cropped aspect matches the 461x455 box, so `cover` adds nothing.
              */}
              {content.image ? (
                <Image
                  src={content.image}
                  alt={content.imageAlt}
                  fill
                  sizes="(max-width: 1280px) 90vw, 461px"
                  className="object-cover"
                />
              ) : null}
            </div>

            {/* 97:1189 offset outline, 8px gradient stroke */}
            <PhotoFrameIcon className="absolute left-[15.49%] top-[4.28%] h-[91.45%] w-[76.06%]" />

            {DOTS.map((dot) => (
              <span
                key={`${dot.left}-${dot.top}`}
                aria-hidden
                style={{ left: dot.left, top: dot.top, width: dot.size }}
                className="absolute aspect-square rounded-full bg-[linear-gradient(180deg,#fccab8_0%,#e88764_100%)]"
              />
            ))}
          </div>
        </div>

        {/* Copy — Figma 97:1098 */}
        <div className="w-full max-w-[459px] xl:ml-[171px] xl:mt-[153px]">
          <h2 className="text-[32px] font-bold leading-[1.2] text-white sm:text-[42px] xl:leading-[60.7px]">
            {content.heading}
          </h2>
          {/* `whitespace-pre-line` so paragraph breaks typed in the admin
              survive into the page. */}
          <p className="mt-[29px] whitespace-pre-line text-[18px] font-normal leading-[26px] text-white/80">
            {content.body}
          </p>
          <Link
            href={content.cta.href}
            className="mt-[50px] flex h-[52px] w-[250px] items-center justify-center rounded-[8px] border border-white text-[17px] font-bold leading-[24.6px] text-white transition-colors hover:bg-white hover:text-[#0a0a0a]"
          >
            {content.cta.label}
          </Link>
        </div>
      </div>
    </section>
  );
}

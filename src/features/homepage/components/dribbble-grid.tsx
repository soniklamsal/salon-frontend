"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Image from "next/image";

import type { GalleryContent } from "@/lib/types/content-types";
import { prefersReducedMotion } from "@/lib/motion";

/**
 * Ported from the gsap demo (`app/components/ImageGridSection.tsx`).
 *
 * Copy and images come from `sections.GallerySection` / `sections.GalleryImage`
 * via `lib/content.ts`; every number below is still the demo's.
 *
 * A 2-column grid of six shots that opens like a chain as you scroll: the cards
 * are read in pairs, the left one drifting left and rotating anticlockwise, the
 * right one mirroring it, so a hole tears open down the middle. The centre
 * block — heading, line and CTA — sits *behind* the cards at `z-0` and fades up
 * into that hole. Every number is the demo's: ±200/150/100px and ±10/8/6deg by
 * breakpoint, the third pair damped to 0.7 so the opening stays wedge-shaped,
 * and scrub 1.5/1.2/0.8.
 *
 * Carried over as-is: the copy ("Dribbble", the lion's-roar line, "View
 * Dribbble") and the six images, copied to `public/images/dribbble/`.
 *
 * Changed:
 *   - the demo's `useGSAP` needs `@gsap/react`, which is not a dependency here,
 *     so the timeline is built in `useEffect` + `gsap.context` like the rest of
 *     this project's sections;
 *   - its cleanup ran `ScrollTrigger.getAll().forEach(t => t.kill())`, which on
 *     this page would also kill Motivation Lines' and Classes Designed's
 *     triggers. Reverting the context kills only what this section made;
 *   - the demo's #0D0D0D backdrop becomes plain white, so the copy is set in
 *     `deep` (the brand's near-black) and the Dribbble pink / purple heading
 *     gradient becomes flame → ember → deep. Blush is deliberately not a stop
 *     here — at #fccab8 it all but disappears against the white;
 *   - the demo sets the heading in `cursive` (Comic Sans, on Windows) and the
 *     body in Syne, which is not licensed here — Kiwi Maru and Jost, this
 *     project's display and body faces, stand in;
 *   - `<img>` becomes `next/image`, consistent with the other sections;
 *   - under prefers-reduced-motion the scroll timeline never runs. The demo
 *     would leave the copy at opacity 0 behind an unopened grid, so the
 *     `motion-reduce:` variants below drop the section into plain flow —
 *     copy first, grid beneath it, nothing overlapping;
 *   - the demo's viewport-height sizing is gone. It pinned a `min-h-screen`
 *     section against an absolutely-positioned `min-h-[150vh]` card layer, and
 *     the two only agreed at one window height. Being absolute, the card layer
 *     added nothing to the section's height, so the section was ~100vh while
 *     the cards inside it were ~150vh — and `overflow-hidden` ate the
 *     difference. The bottom row was clipped on any ordinary screen, the
 *     grid's centring left a screenful of dead black above the heading, and
 *     the band that followed started underneath the cards rather than after
 *     them.
 *
 *     Both layers now share one grid cell (`col-start-1 row-start-1`), which
 *     is the same overlap without taking either out of flow: the section is as
 *     tall as the taller of the two, so the cards cannot outgrow it, the copy
 *     still sits behind them, and the next section is pushed clear. Height
 *     comes from the cards themselves at every breakpoint, so there is no
 *     viewport arithmetic left to disagree with.
 *
 *     `overflow-hidden` stays, and is now only doing the job it was for:
 *     clipping the ±200px the cards travel sideways, so the page never gains a
 *     horizontal scrollbar.
 *
 *   - the demo's overlap — copy behind the cards, revealed through the hole
 *     they tear open — is kept from `xl` up and dropped below it.
 *
 *     It needs two things to work, and only a wide screen has both. The hole
 *     has to be wider than the copy: the pairs travel ±100/150/260px by
 *     breakpoint, opening 200px on a phone and 316px on a tablet against copy
 *     blocks of 320px and 512px, so below `xl` the heading would lose its first
 *     and last letters. And the cards have to have somewhere to go: at 1280 and
 *     up they finish inside the viewport, which is what makes 260 affordable
 *     there and not lower down.
 *
 *     Below `xl` the band is therefore an ordinary stack — grid first, then the
 *     copy under it, which is also the order a phone should read in. The cards
 *     still slide apart and rotate; they just no longer have anything to
 *     uncover.
 *
 *     Below `xl` this also makes the reduced-motion path identical to the
 *     normal one. Above it the copy is left visible rather than pinned behind
 *     an unopened grid, because the scroll timeline that would part the cards
 *     never runs.
 */

export function DribbbleGrid({ content }: { content: GalleryContent }) {
  const containerRef = useRef<HTMLElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const imageRefs = useRef<(HTMLDivElement | null)[]>([]);
  // Not `images` — the effect below already uses that name for the DOM nodes.
  const cards = content.images;

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);

    if (!containerRef.current) return;
    if (prefersReducedMotion()) return;

    const container = containerRef.current;
    const content = contentRef.current;

    const ctx = gsap.context(() => {
      const images = imageRefs.current.filter(Boolean) as HTMLDivElement[];
      const mm = gsap.matchMedia();

      mm.add(
        {
          isMobile: "(max-width: 768px)",
          isTablet: "(min-width: 769px) and (max-width: 1024px)",
          isDesktop: "(min-width: 1025px)",
        },
        (context) => {
          const { isMobile, isTablet } = context.conditions ?? {};

          // 340 on desktop, not the demo's 200. The demo's centre block was the
          // single word "Dribbble" over one short line; this one is "Our
          // Speciality" over three, and its longest line measures 617px. At 200
          // the pairs open a 424px hole, so the copy's ends stay behind the
          // cards and the reveal the whole section exists for never lands.
          //
          // 340 opens 704px, and the 10deg rotation costs ~25px off each inner
          // edge, leaving ~654px clear — enough for 617 with room to spare. The
          // cards run off the sides by then, which is what `overflow-hidden` on
          // the section is for; the demo did the same.
          const baseDistance = isMobile ? 100 : isTablet ? 150 : 340;
          const baseRotation = isMobile ? 6 : isTablet ? 8 : 10;
          const scrub = isMobile ? 0.8 : isTablet ? 1.2 : 1.5;

          gsap.set(content, { opacity: 0, scale: 0.8, y: 50, force3D: true });

          for (let i = 0; i < images.length; i += 2) {
            const leftCard = images[i];
            const rightCard = images[i + 1];
            if (!leftCard) continue;

            // Pairs 1 and 2 travel the full distance; pair 3 is damped, which is
            // what stops the opening from closing back up at the bottom.
            const damping = Math.floor(i / 2) === 2 ? 0.7 : 1;
            const distance = baseDistance * damping;
            const rotation = baseRotation * damping;

            // The left card triggers the pair, so both halves stay in step.
            const scrollTrigger = {
              trigger: leftCard,
              start: "top 85%",
              end: "top 30%",
              scrub,
              invalidateOnRefresh: true,
              fastScrollEnd: true,
              refreshPriority: -1,
            };

            gsap.set([leftCard, rightCard].filter(Boolean), {
              x: 0,
              rotation: 0,
              transformOrigin: "center center",
              force3D: true,
            });

            gsap.to(leftCard, {
              x: -distance,
              rotation: -rotation,
              ease: "none",
              force3D: true,
              scrollTrigger,
            });

            if (rightCard) {
              gsap.to(rightCard, {
                x: distance,
                rotation,
                ease: "none",
                force3D: true,
                scrollTrigger,
              });
            }
          }

          gsap.to(content, {
            opacity: 1,
            scale: 1,
            y: 0,
            ease: "none",
            force3D: true,
            scrollTrigger: {
              trigger: container,
              start: "top 50%",
              end: "center center",
              scrub: scrub + 0.5,
              invalidateOnRefresh: true,
              fastScrollEnd: true,
            },
          });
        },
      );
    }, containerRef);

    /*
      The demo also bound its own debounced `resize` -> `ScrollTrigger.refresh()`
      here. That is removed deliberately, for two reasons:

      `gsap.matchMedia()` already re-evaluates its own breakpoints on resize, and
      ScrollTrigger refreshes itself on resize too, so the handler was duplicating
      both.

      More importantly it was actively harmful under Lenis. Refreshing
      ScrollTrigger without also calling `lenis.resize()` leaves Lenis clamping
      to a stale document height, and this is the tallest section on the page —
      its card layer runs to 150vh — so it was the one that stranded the scroll
      just past Motivation Lines. SmoothScrollProvider now owns that pairing for
      the whole page.
    */
    return () => ctx.revert();
    // Rebuilt if the admin adds or removes cards: the pairing above is derived
    // from how many refs there are.
  }, [cards.length]);

  return (
    <section
      ref={containerRef}
      className="relative z-40 flex flex-col items-center gap-10 overflow-x-hidden overflow-y-visible bg-[#0a0a0a] py-16 text-white sm:gap-12 sm:py-20 md:gap-16 md:py-24 lg:py-28 xl:grid xl:place-items-center xl:gap-0 xl:py-32 xl:motion-reduce:flex xl:motion-reduce:flex-col xl:motion-reduce:gap-16"
    >
      {/* In flow, so the section is as tall as the copy and grid together and
          the band below starts after them. The padding is what the cards need
          once they have rotated ~10deg out of true. */}
      <div className="w-full px-6 sm:px-8 md:px-10 lg:px-16 xl:col-start-1 xl:row-start-1 xl:px-20">
        <div className="mx-auto grid w-full max-w-xs grid-cols-2 gap-3 sm:max-w-md sm:gap-4 md:max-w-2xl md:gap-4 lg:max-w-4xl lg:gap-6">
          {cards.map((card, index) => (
            <div
              key={card.id}
              ref={(el) => {
                imageRefs.current[index] = el;
              }}
              className="relative z-20 aspect-[4/3] w-full overflow-hidden rounded-[6px] border border-white/10 bg-white/5 shadow-2xl will-change-transform sm:rounded-[8px] md:rounded-[10px] lg:rounded-[12px]"
            >
              {card.image ? (
                <Image
                  src={card.image}
                  alt={card.alt}
                  fill
                  sizes="(max-width: 640px) 45vw, (max-width: 1024px) 40vw, 500px"
                  className="object-cover"
                  draggable={false}
                />
              ) : null}
            </div>
          ))}
        </div>
      </div>

      {/* Below xl: plain source order, so the photographs come first and the
          heading reads as a caption under them.

          From xl: the same grid cell as the cards, at a lower z, so it sits
          behind them and the parting pairs uncover it. Staying after the grid
          in source is also what keeps the GSAP refs above in index order. */}
      <div
        ref={contentRef}
        className="mx-auto max-w-xs px-4 text-center sm:max-w-md sm:px-6 md:max-w-lg md:px-8 lg:max-w-2xl lg:px-12 xl:z-0 xl:col-start-1 xl:row-start-1 xl:motion-reduce:z-30"
      >
        <h2 className="mb-4 font-display text-[clamp(32px,8vw,80px)] leading-[0.9] font-normal sm:mb-6 md:mb-8 lg:mb-10">
          <span
            className="bg-clip-text text-transparent"
            style={{
              backgroundImage:
                "linear-gradient(135deg, #c7ff3d, #a8e02c, #ffffff)",
            }}
          >
            {content.heading}
          </span>
        </h2>

        {/*
          The demo hand-breaks this paragraph into three lines and collapses
          them to spaces below sm, where the measure is too narrow to hold
          them. Same treatment, driven by however many lines the admin typed:
          a <br> that only applies from sm up, and a space that only applies
          below it.
        */}
        <p className="mb-6 text-[clamp(18px,4vw,31px)] leading-[clamp(22px,5vw,38px)] font-normal sm:mb-8 md:mb-10 lg:mb-12">
          {content.lines.map((line, i) => (
            <span key={`${i}-${line}`}>
              {i > 0 ? (
                <>
                  <br className="hidden sm:block" />
                  <span className="sm:hidden"> </span>
                </>
              ) : null}
              {line}
            </span>
          ))}
        </p>

        <a
          href={content.cta.href}
          className="group inline-flex cursor-pointer items-center gap-2 rounded-full border border-white/30 px-6 py-3 transition-all duration-300 hover:bg-white hover:text-[#0a0a0a] sm:gap-3 sm:px-8 sm:py-4 md:px-10 md:py-5 lg:px-12 lg:py-6"
        >
          <span className="text-sm leading-5 font-normal transition-colors duration-300 sm:text-base sm:leading-6 md:text-[16px]">
            {content.cta.label}
          </span>
          <svg
            viewBox="0 0 24 24"
            fill="currentColor"
            className="h-3 w-3 sm:h-4 sm:w-4 md:h-5 md:w-5 lg:h-6 lg:w-6"
            aria-hidden
          >
            <path d="M13.025 1l-2.847 2.828 6.176 6.176h-16.354v3.992h16.354l-6.176 6.176 2.847 2.828 10.975-11z" />
          </svg>
        </a>
      </div>
    </section>
  );
}

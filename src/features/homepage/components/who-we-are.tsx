"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

import type { WhoWeAreContent } from "@/lib/types/content-types";
import { prefersReducedMotion } from "@/lib/motion";

/**
 * Who We Are, ported from the gsap demo's `WhoWeAreSection` +
 * `AboutUsSection`.
 *
 * Those are two bands in the demo but one idea, so they are one component
 * here: a two-line heading whose letters resolve as it slides in, a large lead
 * paragraph beneath it, then a narrower paragraph and a button against the
 * right edge. Line 1 travels right-to-left and line 2 the other way, each
 * letter switching from a 6%-alpha ghost to full colour as the scrub passes
 * its threshold — the same mechanism as the footer's headline.
 *
 * Changed from the demo:
 *   - `useGSAP` needs `@gsap/react`, not a dependency here, so the timeline is
 *     built in `useEffect` + `gsap.context` like every other ported section;
 *   - the demo's cleanup relied on `useGSAP`'s own scoping; reverting the
 *     context kills only this section's triggers, which matters because the
 *     footer, Motivation Lines and the gallery all live on the same page;
 *   - "Bebas Neue" and "Syne" are not licensed here, so the heading sets in the
 *     project's display face and the copy in Jost;
 *   - the demo's `13vw` heading and fixed `42px` lead are clamped instead —
 *     13vw is 250px on a desktop monitor and overflows the gutter;
 *   - its `px-16 md:px-20` gutter would be 64px on a 360px phone. The gutter
 *     matches the rest of this site instead;
 *   - the demo's bare `<button>About us</button>` did nothing; it is a real
 *     link here;
 *   - the copy is the salon's, from `sections.WhoWeAreSection`, not TRIONN's;
 *   - under prefers-reduced-motion the scrub never runs, so the reduced path
 *     paints the rest state — the demo would leave the heading at 6% alpha and
 *     the lead at opacity 0, i.e. an invisible band.
 */

export function WhoWeAre({ content }: { content: WhoWeAreContent }) {
  const containerRef = useRef<HTMLElement>(null);
  const line1Ref = useRef<HTMLSpanElement>(null);
  const line2Ref = useRef<HTMLSpanElement>(null);
  const leadRef = useRef<HTMLParagraphElement>(null);

  const lines = [content.headingLine1, content.headingLine2];
  // Extracted rather than inlined into the dependency array below, so the
  // dependency is a plain value the linter can check statically.
  const linesKey = lines.join("|");

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    if (!containerRef.current) return;

    const container = containerRef.current;

    // Same trap as the footer: the letters are rendered as ghosts and the lead
    // starts at opacity 0, so skipping the scrub without painting the rest
    // state leaves the whole band invisible.
    if (prefersReducedMotion()) {
      container
        .querySelectorAll<HTMLElement>("[data-letter]")
        .forEach((el) => {
          el.style.opacity = "1";
        });
      if (leadRef.current) {
        leadRef.current.style.opacity = "1";
        leadRef.current.style.transform = "none";
      }
      return;
    }

    const ctx = gsap.context(() => {
      const rows = [
        { el: line1Ref.current, from: "20vw" },
        { el: line2Ref.current, from: "-20vw" },
      ];

      rows.forEach(({ el, from }) => {
        if (!el) return;
        const letters = Array.from(
          el.querySelectorAll<HTMLElement>("[data-letter]")
        );

        gsap.fromTo(
          el,
          { x: from, force3D: true },
          {
            x: 0,
            ease: "none",
            force3D: true,
            scrollTrigger: {
              trigger: container,
              start: "top bottom",
              end: "top 10%",
              scrub: 1.5,
              invalidateOnRefresh: true,
              refreshPriority: -1,
              onUpdate: (self) => {
                letters.forEach((letter, i) => {
                  const threshold =
                    0.6 + (i / Math.max(letters.length - 1, 1)) * 0.4;
                  letter.style.opacity =
                    self.progress >= threshold ? "1" : "0.06";
                });
              },
            },
          }
        );
      });

      gsap.fromTo(
        leadRef.current,
        { opacity: 0, y: 100 },
        {
          opacity: 1,
          y: 0,
          ease: "none",
          scrollTrigger: {
            trigger: container,
            start: "top bottom",
            end: "top 30%",
            scrub: 1,
            invalidateOnRefresh: true,
          },
        }
      );
    }, containerRef);

    return () => ctx.revert();
    // Rebuilt if the admin retypes the heading: the per-letter thresholds are
    // derived from how many letters each line has.
  }, [linesKey]);

  return (
    <section
      ref={containerRef}
      className="relative z-40 overflow-hidden bg-[#0a0a0a] py-16 text-white sm:py-20 md:py-24"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute top-10 left-10 h-48 w-48 rounded-full bg-accent opacity-[0.04] blur-[100px]"
      />

      <div className="mx-auto w-full max-w-[1440px] px-5 sm:px-10 xl:px-16">
        <h2 className="font-display overflow-hidden text-[clamp(56px,13vw,180px)] leading-[0.85] tracking-[-0.03em] uppercase select-none">
          {lines.map((line, lineIndex) => (
            <span
              key={lineIndex}
              ref={lineIndex === 0 ? line1Ref : line2Ref}
              className="block w-full"
              style={{ willChange: "transform" }}
            >
              {Array.from(line).map((char, i) => (
                <span
                  key={i}
                  data-letter
                  className="inline-block"
                  style={{ opacity: 0.06, willChange: "opacity" }}
                >
                  {/* A space collapses in an inline-block, so it is drawn as a
                      non-breaking one — the demo hardcoded   into its
                      letter arrays for the same reason. */}
                  {char === " " ? " " : char}
                </span>
              ))}
            </span>
          ))}
        </h2>

        <p
          ref={leadRef}
          className="mt-10 max-w-2xl text-[clamp(20px,3.4vw,42px)] leading-[1.2] text-white"
          style={{ opacity: 0 }}
        >
          {content.lead}
        </p>

        <div className="mt-12 flex md:justify-end">
          <div className="max-w-sm">
            <p className="text-[clamp(16px,2vw,22px)] leading-[1.4] text-white/80">
              {content.body}
            </p>
            <Link
              href={content.cta.href}
              className="mt-8 inline-block rounded-full border border-white/20 px-8 py-3 text-[16px] transition-colors duration-300 hover:bg-white hover:text-black md:px-12 md:py-4"
            >
              {content.cta.label}
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

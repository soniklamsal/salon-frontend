"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

import type { MotivationContent } from "@/lib/types/content-types";
import { prefersReducedMotion } from "@/lib/motion";

/**
 * Ported from the devis-gym demo (`components/sections/MotivationSection.tsx`).
 *
 * The lines are now editable (`sections.MotivationLine`), and the whole band
 * can be switched off from the admin — the page drops it rather than rendering
 * an empty strip.
 *
 * Three stacked lines that drift horizontally as the page scrolls: a single
 * scrubbed timeline runs from the moment the section's top enters the viewport
 * until its bottom leaves, sliding line 1 and line 3 right-to-left and line 2
 * left-to-right, so the block shears apart and back together. One shared
 * ScrollTrigger drives all three, which is what keeps them in lockstep.
 *
 * Carried over as-is: the copy and the parallax distances (±30%).
 *
 * Changed:
 *   - the demo's `container-edge` helper does not exist here, so the section
 *     uses this project's usual 1440px gutter block;
 *   - the demo's dark #121212 / #f5f5f5 pairing is inverted. The band picks up
 *     Service Menu's background above it, one step off: `shell` (#f6ebe7), the
 *     warm off-white Follow Us and the footer already use, rather than a flat
 *     white. The lines are `deep` on top of it;
 *   - "Pilat Condensed" is not licensed here so the lines set in Jost, the same
 *     substitution the Classes Designed marquee makes;
 *   - the animation is skipped under prefers-reduced-motion, where the lines
 *     simply rest centred.
 */

export function MotivationLines({ content }: { content: MotivationContent }) {
  const sectionRef = useRef<HTMLElement>(null);
  const lineRefs = useRef<(HTMLDivElement | null)[]>([]);
  const lines = content.lines;

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);

    if (!sectionRef.current) return;

    const reducedMotion = prefersReducedMotion();
    if (reducedMotion) return;

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top bottom",
          end: "bottom top",
          scrub: true,
          refreshPriority: -1,
        },
      });

      lineRefs.current.forEach((line, i) => {
        if (!line) return;
        // Odd lines travel the opposite way, giving the alternating shear.
        const from = i % 2 === 0 ? "30%" : "-30%";
        const to = i % 2 === 0 ? "-30%" : "30%";
        tl.fromTo(line, { x: from }, { x: to, ease: "none" }, 0);
      });
    }, sectionRef);

    return () => {
      ctx.revert();
    };
    // Keyed on the count rather than the array: `lines` is a fresh reference on
    // every render, and the only thing the timeline cares about is how many
    // refs there are to animate.
  }, [lines.length]);

  return (
    <section
      ref={sectionRef}
      className="overflow-hidden bg-[#0a0a0a] py-14 sm:py-20 md:py-28 lg:py-32"
    >
      <div className="mx-auto w-full max-w-[1440px] px-5 md:px-10 xl:px-16">
        {/* Flattened: removed wrapper div, applied styles directly to hgroup */}
        <hgroup className="flex flex-col gap-6 sm:gap-8 md:gap-10 lg:gap-12">
          {lines.map((line, i) => (
            <div
              key={`${i}-${line}`}
              ref={(el) => {
                lineRefs.current[i] = el;
              }}
              className="text-center"
            >
              <h2
                className="leading-none whitespace-nowrap text-white"
                style={{
                  fontWeight: 800,
                  fontSize: "clamp(36px, 6vw, 75px)",
                }}
              >
                {line}
              </h2>
            </div>
          ))}
        </hgroup>
      </div>
    </section>
  );
}

"use client";

import { useEffect, useRef, useState } from "react";

import type { AboutStat } from "@/lib/types/about-types";
import { prefersReducedMotion } from "@/lib/motion";

/**
 * One statistic, counting up when it scrolls into view.
 *
 * The only part of the About page that needs the browser. It is deliberately a
 * leaf: everything around it — the grid, the headings, the team cards — renders
 * on the server and never enters this component's module graph.
 *
 * A stat's value is free text in the admin ("500+", "6", "Award winning"), so
 * the number and its suffix are pulled apart here rather than stored as two
 * fields. A value with no digits in it is not a countable stat and is printed
 * as written.
 */
export function StatCounter({ stat }: { stat: AboutStat }) {
  const [count, setCount] = useState(0);
  const [hasAnimated, setHasAnimated] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // "5+" -> 5, "500+" -> 500
  const targetNumber = parseInt(stat.value.replace(/\D/g, "")) || 0;
  const suffix = stat.value.replace(/[0-9]/g, "");
  const isNumericStat = /\d/.test(stat.value);

  useEffect(() => {
    // A number racing upwards is motion, and someone who has asked for less of
    // it should be shown the finished figure instead of the animation. This
    // guard was missing while the counter lived in the page component; every
    // other animated component on the site already had it.
    if (!isNumericStat || prefersReducedMotion()) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !hasAnimated) {
          setHasAnimated(true);

          const duration = 2000;
          const steps = 60;
          const increment = targetNumber / steps;
          let currentStep = 0;

          const timer = setInterval(() => {
            currentStep++;
            if (currentStep <= steps) {
              setCount(
                Math.min(Math.ceil(increment * currentStep), targetNumber)
              );
            } else {
              clearInterval(timer);
            }
          }, duration / steps);

          return () => clearInterval(timer);
        }
      },
      { threshold: 0.5 }
    );

    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [targetNumber, hasAnimated, isNumericStat]);

  /*
    Three ways this renders, and they must all end at the same string:
      - not a number      -> the value as typed
      - reduced motion    -> the final figure, no animation
      - normal            -> counts up to the final figure
    `hasAnimated` is false in the reduced-motion case because the effect returns
    before setting it, so the target is shown directly.
  */
  const display =
    !isNumericStat || (!hasAnimated && prefersReducedMotion())
      ? stat.value
      : `${count}${suffix}`;

  return (
    <div ref={ref} className="text-center">
      <div
        className="font-oswald text-[48px] leading-[56px] md:text-[64px] md:leading-[72px] font-bold mb-2"
        style={{
          color: "#c7ff3d",
          fontFamily: "var(--font-oswald), Arial, sans-serif",
        }}
      >
        {display}
      </div>
      <div className="text-muted text-sm uppercase tracking-wide font-bold">
        {stat.label}
      </div>
    </div>
  );
}

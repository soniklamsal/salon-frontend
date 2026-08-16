"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { prefersReducedMotion } from "@/lib/motion";

/**
 * Ported from the devis-gym demo (`components/ui/Reveal.tsx`).
 *
 * Fades and lifts its children in once, when the top of the block reaches 90%
 * of the viewport. The wrapper starts at `opacity-0` in CSS so there is no
 * flash of the un-animated state before the effect runs; the reduced-motion
 * branch sets it visible immediately rather than leaving it hidden.
 */

type RevealProps = {
  children: React.ReactNode;
  className?: string;
  as?: "div" | "span";
  delay?: number;
  y?: number;
};

export function Reveal({
  children,
  className,
  as = "div",
  delay = 0,
  y = 32,
}: RevealProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    const el = ref.current;
    if (!el) return;

    const reducedMotion = prefersReducedMotion();

    if (reducedMotion) {
      gsap.set(el, { opacity: 1, y: 0 });
      return;
    }

    const ctx = gsap.context(() => {
      gsap.fromTo(
        el,
        { opacity: 0, y },
        {
          opacity: 1,
          y: 0,
          duration: 0.6,
          delay,
          ease: "power2.out",
          scrollTrigger: {
            trigger: el,
            start: "top 90%",
            toggleActions: "play none none none",
            once: true,
          },
        }
      );
    }, ref);

    return () => ctx.revert();
  }, [delay, y]);

  const Tag = as;
  return (
    <Tag ref={ref as never} className={`opacity-0 ${className ?? ""}`}>
      {children}
    </Tag>
  );
}

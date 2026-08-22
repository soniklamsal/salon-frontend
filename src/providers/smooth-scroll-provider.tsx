"use client";

import { useEffect, useRef } from "react";
import Lenis from "lenis";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { prefersReducedMotion } from "@/lib/motion";

/**
 * Ported from the devis-gym demo (`components/layout/SmoothScrollProvider.tsx`).
 *
 * Drives Lenis off GSAP's ticker rather than its own RAF loop, so scroll-linked
 * animations and the smoothed scroll position advance on the same frame. Without
 * that they run on two clocks and ScrollTrigger reads a stale scrollY.
 *
 * Wraps the whole tree in app/layout.tsx.
 */
export function SmoothScrollProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const lenisRef = useRef<Lenis | null>(null);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);

    const reducedMotion = prefersReducedMotion();

    if (reducedMotion) return;

    const lenis = new Lenis({
      duration: 0.8,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      wheelMultiplier: 1,
      touchMultiplier: 2,
      infinite: false,
      syncTouch: true,
      syncTouchLerp: 0.1,
      touchInertiaMultiplier: 35,
    });
    lenisRef.current = lenis;

    // Exposed globally so anchor links elsewhere can call lenis.scrollTo.
    (window as unknown as { lenis: Lenis }).lenis = lenis;
    window.dispatchEvent(new Event("lenis:ready"));

    lenis.on("scroll", ScrollTrigger.update);

    const tickerCallback = (time: number) => {
      lenis.raf(time * 1000);
    };
    gsap.ticker.add(tickerCallback);
    gsap.ticker.lagSmoothing(0);

    /*
      Lenis caches the document height and clamps scrolling to it. Nothing in
      GSAP updates that cache: `ScrollTrigger.refresh()` recalculates trigger
      positions and leaves Lenis holding the old limit. When the page grows
      after Lenis measured it, scrolling stops dead at the stale limit — which
      looks exactly like a freeze, and clears on reload because a fresh Lenis
      measures the finished page.

      So the two are tied together: every ScrollTrigger refresh re-measures
      Lenis as well.
    */
    const onRefresh = () => lenis.resize();
    ScrollTrigger.addEventListener("refresh", onRefresh);

    // The hero's images settle after first paint and shift every trigger below
    // them, so the positions are recalculated once things have landed.
    const refreshTimeout = window.setTimeout(() => {
      ScrollTrigger.refresh();
    }, 300);

    const onLoad = () => ScrollTrigger.refresh();
    window.addEventListener("load", onLoad);

    /*
      A window `resize` is not the only thing that changes the page's height —
      images decoding, fonts swapping and the gallery's absolutely positioned
      card layer all resize the document with the window untouched, and those
      are the cases the stale limit actually bit on.

      Guarded on scrollHeight because `ScrollTrigger.refresh()` can itself
      change layout, and re-entering on our own refresh would spin.
    */
    let lastHeight = document.documentElement.scrollHeight;
    let settleTimeout = 0;
    const observer = new ResizeObserver(() => {
      window.clearTimeout(settleTimeout);
      settleTimeout = window.setTimeout(() => {
        const height = document.documentElement.scrollHeight;
        if (height === lastHeight) return;
        lastHeight = height;
        lenis.resize();
        ScrollTrigger.refresh();
      }, 150);
    });
    observer.observe(document.body);

    return () => {
      window.clearTimeout(refreshTimeout);
      window.clearTimeout(settleTimeout);
      observer.disconnect();
      ScrollTrigger.removeEventListener("refresh", onRefresh);
      window.removeEventListener("load", onLoad);
      gsap.ticker.remove(tickerCallback);
      lenis.destroy();
      lenisRef.current = null;
      (window as unknown as { lenis: Lenis | null }).lenis = null;
    };
  }, []);

  return <>{children}</>;
}

"use client";

import { useEffect } from "react";

/**
 * Puts the About page at the top on arrival. Renders nothing.
 *
 * Next already scrolls to top on navigation, so on a plain page this would be
 * redundant. This site is not a plain page: `SmoothScrollProvider` hands the
 * scroll position to Lenis, which keeps its own and does not necessarily
 * reset with the route. The expanding hero then reads scroll offset from the
 * first frame, so arriving part-way down starts it mid-animation.
 *
 * Kept as its own one-line client component rather than making the page a
 * client component for it. That was the previous arrangement, and it is what
 * pulled the entire About page — team grid, stats, copy, all of it — into the
 * browser bundle.
 */
export function ScrollToTop() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return null;
}

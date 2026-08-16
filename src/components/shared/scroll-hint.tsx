"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";

/**
 * "Scroll" nudge for a scrollable box, animated with GSAP.
 *
 * Only appears when the box actually overflows, and leaves for good once the
 * reader reaches the bottom — a permanent hint on content that fits is a lie,
 * and one that stays after you have scrolled is nagging.
 *
 * Measured with a ResizeObserver rather than on mount alone: the dialog it
 * lives in animates open, and an image inside it can land after first paint,
 * so the box's height at mount is not the height it settles at.
 *
 * `pointer-events-none` throughout — it floats over the content it is talking
 * about, and must never eat a click meant for what is underneath.
 */
export function ScrollHint({
  targetRef,
  label = "Scroll",
}: {
  targetRef: React.RefObject<HTMLElement | null>;
  label?: string;
}) {
  const hintRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  // Track whether there is anywhere left to scroll.
  useEffect(() => {
    const box = targetRef.current;
    if (!box) return;

    const update = () => {
      const overflows = box.scrollHeight - box.clientHeight > 24;
      const atBottom =
        box.scrollTop + box.clientHeight >= box.scrollHeight - 24;
      setVisible(overflows && !atBottom);
    };

    update();
    box.addEventListener("scroll", update, { passive: true });
    const observer = new ResizeObserver(update);
    observer.observe(box);

    return () => {
      box.removeEventListener("scroll", update);
      observer.disconnect();
    };
  }, [targetRef]);

  // The animation itself: a slow bob, plus a fade in or out on change.
  useEffect(() => {
    const el = hintRef.current;
    if (!el) return;

    const ctx = gsap.context(() => {
      gsap.killTweensOf(el);
      if (visible) {
        gsap.fromTo(
          el,
          { autoAlpha: 0, y: 8 },
          { autoAlpha: 1, y: 0, duration: 0.35, ease: "power2.out" }
        );
        // Runs on the chevron only, so the label does not jitter.
        gsap.to(el.querySelector("[data-chevron]"), {
          y: 4,
          duration: 0.7,
          repeat: -1,
          yoyo: true,
          ease: "sine.inOut",
        });
      } else {
        gsap.to(el, { autoAlpha: 0, duration: 0.25, ease: "power2.in" });
      }
    }, hintRef);

    return () => ctx.revert();
  }, [visible]);

  return (
    <div
      ref={hintRef}
      aria-hidden
      style={{ opacity: 0, visibility: "hidden" }}
      className="pointer-events-none absolute inset-x-0 bottom-0 z-10 flex justify-center pb-3"
    >
      {/* A fade behind the pill, so text scrolling under it does not collide
          with the label. */}
      <span className="from-card pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t to-transparent" />
      <span className="border-border bg-card/90 text-muted-foreground relative flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-semibold tracking-wide uppercase backdrop-blur-sm">
        {label}
        <svg
          data-chevron
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-primary h-3.5 w-3.5"
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </span>
    </div>
  );
}

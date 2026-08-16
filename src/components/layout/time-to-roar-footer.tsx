"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

import { SocialIconRow } from "@/components/shared/social-icon";
import type { FooterContent, SiteSettings, SocialLink } from "@/lib/types/content-types";
import { prefersReducedMotion } from "@/lib/motion";

/**
 * Site footer, ported from the gsap demo (`app/components/TimeToRoarSection.tsx`).
 *
 * Structure and timings are the demo's: three headline lines that slide in on
 * scrub — lines 1 and 3 right-to-left, line 2 the other way — each letter
 * switching from a 6%-alpha ghost to full colour as the scrub passes its
 * threshold, then two rules that draw out from zero width and a contact row
 * that staggers up beneath them.
 *
 * Changed:
 *   - the demo's `useGSAP` needs `@gsap/react`, which is not a dependency
 *     here, so the timeline is built in `useEffect` + `gsap.context` like every
 *     other ported section in this project;
 *   - its cleanup ran `ScrollTrigger.getAll().forEach(t => t.kill())`, which on
 *     the home page would also kill Motivation Lines', Dribbble Grid's and
 *     Classes Designed's triggers — every one of them outlives this component
 *     on the same page. Reverting the context kills only what this section made;
 *   - "Bebas Neue" and "Syne" are not licensed here, so the headline sets in
 *     the project's display face and the rest in Jost — the same substitution
 *     the Classes marquee and Motivation Lines make;
 *   - the demo's hardcoded hello@trionn.com / +91 number / "©2026 TRIONN®" come
 *     from the CMS instead (`sections.FooterSection`), so the footer shows the
 *     salon's own details and can be edited in the admin;
 *   - the demo's bare `<button>Let's talk!</button>` did nothing. It is a real
 *     link to the booking flow here;
 *   - under prefers-reduced-motion the scrub never runs. The demo would leave
 *     the headline at 6% alpha and the contact row at opacity 0 — i.e. an
 *     invisible footer — so the reduced path paints everything at rest.
 */

/**
 * Routes that get the contact block but not the headline.
 *
 * Both are pages someone reaches *after* deciding to book: /services is the
 * booking flow itself, and /status is where they check an order they have
 * already placed. Ending either with a giant "book a seat" call to action
 * asks the reader to go where they already are.
 *
 * Checked here rather than passed down from `app/layout.tsx`: the root layout
 * is a server component that does not re-render on navigation, so it has no
 * reliable pathname to branch on. This component is already a client one.
 */
const ROUTES_WITHOUT_HEADLINE = ["/services", "/status"];

export function TimeToRoarFooter({
  content,
  social,
  site,
}: {
  content: FooterContent;
  social: SocialLink[];
  site: SiteSettings;
}) {
  const pathname = usePathname();
  const showHeadline = !ROUTES_WITHOUT_HEADLINE.includes(pathname);
  const containerRef = useRef<HTMLElement>(null);
  const line1Ref = useRef<HTMLDivElement>(null);
  const line2Ref = useRef<HTMLDivElement>(null);
  const line3Ref = useRef<HTMLDivElement>(null);
  const ruleRefs = useRef<(HTMLDivElement | null)[]>([]);
  const contentRefs = useRef<(HTMLDivElement | null)[]>([]);

  const lines = [content.headingLine1, content.headingLine2, content.headingLine3];
  // Extracted rather than inlined into the dependency array below, so the
  // dependency is a plain value the linter can check statically.
  const linesKey = lines.join("|");

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    if (!containerRef.current) return;

    const container = containerRef.current;

    // The letters are rendered as 6%-alpha ghosts and the scrub is what raises
    // them. Skipping the scrub without doing anything else would leave the
    // whole headline invisible, so the reduced-motion path paints the rest
    // state directly rather than bailing out.
    if (prefersReducedMotion()) {
      container
        .querySelectorAll<HTMLElement>("[data-letter]")
        .forEach((letter) => {
          letter.style.opacity = "1";
        });
      return;
    }

    const ctx = gsap.context(() => {
      const mm = gsap.matchMedia();

      mm.add(
        {
          isMobile: "(max-width: 768px)",
          isTablet: "(min-width: 769px) and (max-width: 1024px)",
          isDesktop: "(min-width: 1025px)",
        },
        (context) => {
          const { isMobile, isTablet } = context.conditions ?? {};
          const scrub = isMobile ? 0.8 : isTablet ? 1.2 : 1.5;
          // A share of the container's own width, so the travel scales with the
          // viewport instead of overshooting on a phone.
          const distance =
            container.getBoundingClientRect().width *
            (isMobile ? 0.12 : isTablet ? 0.16 : 0.2);

          const rows = [
            { el: line1Ref.current, from: distance },
            { el: line2Ref.current, from: -distance },
            { el: line3Ref.current, from: distance },
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
                  scrub,
                  invalidateOnRefresh: true,
                  fastScrollEnd: true,
                  refreshPriority: -1,
                  onUpdate: (self) => {
                    letters.forEach((letter, i) => {
                      // Letters light up left-to-right across the back 40% of
                      // the scrub, so the line resolves as it lands.
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

          gsap.from(ruleRefs.current.filter(Boolean), {
            scaleX: 0,
            duration: 1.2,
            ease: "power3.inOut",
            stagger: 0.2,
            transformOrigin: "left center",
            scrollTrigger: {
              trigger: container,
              start: "center bottom",
              invalidateOnRefresh: true,
            },
          });

          gsap.from(contentRefs.current.filter(Boolean), {
            y: 20,
            opacity: 0,
            duration: 0.8,
            stagger: 0.1,
            ease: "power2.out",
            scrollTrigger: {
              trigger: container,
              start: "center bottom",
              invalidateOnRefresh: true,
            },
          });
        }
      );
    }, containerRef);

    return () => ctx.revert();
    // Rebuilt if the admin retypes the headline: the per-letter thresholds are
    // derived from how many letters each line has.
    // `showHeadline` is a dependency because this component lives in the root
    // layout and survives client-side navigation: moving to or from /services
    // adds or removes the animated lines under a mounted effect, and the
    // triggers have to be rebuilt against what is actually in the DOM.
  }, [linesKey, showHeadline]);

  const scrollToTop = () =>
    window.scrollTo({ top: 0, behavior: "smooth" });

  return (
    <footer
      ref={containerRef}
      className="relative z-40 flex flex-col justify-between overflow-hidden bg-[#0a0a0a] pt-14 pb-0 text-white sm:pt-16 md:pt-20"
    >
      {/* The demo's corner bloom — decorative, and cheap enough to keep. */}
      <div
        aria-hidden
        className="pointer-events-none absolute top-4 left-4 h-24 w-24 rounded-full bg-accent opacity-[0.05] blur-[60px] sm:top-6 sm:left-6 sm:h-32 sm:w-32 md:h-40 md:w-40 md:blur-[90px] lg:h-48 lg:w-48 lg:blur-[100px]"
      />

      {showHeadline ? (
      <div className="mx-auto flex w-full max-w-7xl flex-col items-center justify-between gap-6 px-6 sm:px-10 md:px-16 lg:flex-row lg:gap-16 lg:px-20">
        <div className="w-full flex-1 lg:w-auto">
          {/* One <h2>, not three: this is a single phrase that happens to
              animate a line at a time. */}
          <h2 className="font-display overflow-hidden text-center text-[clamp(60px,12vw,180px)] leading-[0.85] tracking-[-0.03em] uppercase select-none lg:text-left">
            {lines.map((line, lineIndex) => (
              <span
                key={lineIndex}
                ref={[line1Ref, line2Ref, line3Ref][lineIndex]}
                className="block w-full"
                style={{ willChange: "transform" }}
              >
                {Array.from(line).map((char, i) => (
                  <span
                    key={i}
                    data-letter
                    className="inline-block"
                    // Starts as a ghost; the scrub raises it. The reduced-motion
                    // path never runs that scrub, so it must not start hidden —
                    // see the note in the header comment.
                    style={{ opacity: 0.06, willChange: "opacity" }}
                  >
                    {char === " " ? " " : char}
                  </span>
                ))}
              </span>
            ))}
          </h2>
        </div>

        <div className="flex w-full shrink-0 justify-center sm:w-auto lg:mb-8 lg:justify-end lg:self-end">
          <Link
            href={content.cta.href}
            className="w-full rounded-full bg-accent px-6 py-3 text-center text-base font-bold text-black transition-transform duration-300 hover:scale-105 sm:w-auto sm:px-8 sm:py-4 sm:text-lg"
          >
            {content.cta.label}
          </Link>
        </div>
      </div>
      ) : null}

      {/* `pt-12/md:pt-20` is the gap under the headline. With the headline gone
          the section's own top padding is already the whole space, so it
          collapses to nothing rather than leaving a void. */}
      <div
        className={`mx-auto flex w-full max-w-7xl flex-col gap-8 px-6 pb-0 sm:gap-10 sm:px-10 md:gap-12 md:px-16 lg:px-20 ${
          showHeadline ? "pt-12 md:pt-20" : "pt-0"
        }`}
      >
        <div
          ref={(el) => {
            ruleRefs.current[0] = el;
          }}
          className="h-px w-full bg-white/20"
        />

        <div className="grid grid-cols-1 gap-8 text-center sm:gap-10 md:grid-cols-2 md:gap-6 md:text-left lg:grid-cols-3 lg:gap-4">
          <div
            ref={(el) => {
              contentRefs.current[0] = el;
            }}
            className="flex flex-col gap-2"
          >
            <span className="text-sm font-normal tracking-widest text-white/50 uppercase sm:text-[16px]">
              Email
            </span>
            <a
              href={`mailto:${content.email}`}
              className="text-[clamp(20px,4vw,31px)] leading-[clamp(26px,5vw,38px)] transition-opacity hover:opacity-70"
            >
              {content.email}
            </a>
          </div>

          <div
            ref={(el) => {
              contentRefs.current[1] = el;
            }}
            className="flex flex-col gap-2"
          >
            <span className="text-sm font-normal tracking-widest text-white/50 uppercase sm:text-[16px]">
              Call
            </span>
            <a
              // Stripped of spaces so the dialler gets one token.
              href={`tel:${content.phone.replace(/\s+/g, "")}`}
              className="text-[clamp(20px,4vw,31px)] leading-[clamp(26px,5vw,38px)] transition-opacity hover:opacity-70"
            >
              {content.phone}
            </a>
          </div>

          <div
            ref={(el) => {
              contentRefs.current[2] = el;
            }}
            className="flex flex-col gap-2 md:col-span-2 lg:col-span-1 lg:items-end lg:text-right"
          >
            <span className="text-sm font-normal tracking-widest text-white/50 uppercase sm:text-[16px]">
              {content.contactHeading}
            </span>
            <p className="text-[clamp(16px,3vw,20px)] leading-[clamp(24px,4vw,31px)] text-white/80">
              {content.contactBody}
            </p>
            {social.length ? (
              <div className="mt-1 flex lg:justify-end">
                <SocialIconRow links={social} />
              </div>
            ) : null}
          </div>
        </div>

        <div
          ref={(el) => {
            ruleRefs.current[1] = el;
          }}
          className="h-px w-full bg-white/20"
        />

        <div className="flex flex-col items-center justify-between gap-4 pt-4 pb-8 sm:flex-row sm:gap-0">
          <p className="order-2 text-[clamp(16px,3vw,20px)] leading-[clamp(24px,4vw,31px)] text-white/80 sm:order-1">
            {site.copyrightText}
          </p>
          <button
            type="button"
            onClick={scrollToTop}
            aria-label="Back to top"
            className="group order-1 flex h-10 w-10 items-center justify-center rounded-full border border-white/20 transition-colors hover:bg-white hover:text-black sm:order-2 sm:h-12 sm:w-12"
          >
            <svg
              viewBox="0 0 24 24"
              fill="currentColor"
              aria-hidden
              className="h-4 w-4 rotate-180 transition-transform group-hover:-translate-y-1 sm:h-5 sm:w-5"
            >
              <path d="M13.025 1l-2.847 2.828 6.176 6.176h-16.354v3.992h16.354l-6.176 6.176 2.847 2.828 10.975-11z" />
            </svg>
          </button>
        </div>
      </div>
    </footer>
  );
}

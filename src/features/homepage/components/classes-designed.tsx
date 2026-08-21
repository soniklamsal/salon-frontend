"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Link from "next/link";
import Image from "next/image";

import { CardVideo } from "./card-video";

import { Reveal } from "@/components/shared/reveal";
import { cldOptimize } from "@/lib/cloudinary";
import type { ClassesContent } from "@/lib/types/content-types";
import { prefersReducedMotion } from "@/lib/motion";

/**
 * Ported from the devis-gym demo (`components/sections/TrainingSection.tsx`).
 *
 * Three moving parts, all the demo's:
 *   1. the two-line heading — "Classes Designed" fades up, "For You" scales in
 *      0.2s behind it, once, when the section hits 70% of the viewport;
 *   2. a marquee driven by whole-page scroll rather than by time. It travels
 *      0.5px per px of page scroll, so it slides left going down and right
 *      going up, and loops seamlessly by wrapping on half its own width;
 *   3. the card grid, each card revealed on a 0.1s stagger.
 *
 * Carried over as-is: the copy, the class names and the photos (still the
 * demo's Cloudinary bucket).
 *
 * Changed: the demo's lime (#cef952 / #c7ff3d) becomes blush, matching the
 * header and the mosaic above; "Pilat Condensed" is not licensed here so the
 * marquee sets in Jost, which is what the demo falls back to anyway; and the
 * arrow is an inline SVG rather than a Cloudinary SVG recoloured with a
 * seven-stop `filter` hack.
 *
 * The band also runs on Our Story's `bg-blush/50` rather than the demo's dark
 * `bg-deep`, so the two adjacent sections read as one continuous field. That
 * inverts every foreground: the heading, marquee, card titles and arrow are
 * `deep` on pale instead of white/blush on dark, and the hover accent moves to
 * `ember` because blush on blush would disappear.
 *
 * The card hrefs are the demo's `/classes/*` paths. Like the rest of this
 * project's links (/about-us, /book-appointment) those routes do not exist yet.
 */

function ArrowRightIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <path d="M5 12h14" />
      <path d="m12 5 7 7-7 7" />
    </svg>
  );
}

export function ClassesDesigned({ content }: { content: ClassesContent }) {
  const sectionRef = useRef<HTMLElement>(null);
  const classesRef = useRef<HTMLSpanElement>(null);
  const forYouRef = useRef<HTMLSpanElement>(null);
  const scrollTextRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);

    if (!sectionRef.current || !classesRef.current || !forYouRef.current) return;

    const reducedMotion = prefersReducedMotion();

    let cleanupMarqueeResize: (() => void) | undefined;

    const ctx = gsap.context(() => {
      if (!reducedMotion) {
        gsap
          .timeline({
            scrollTrigger: {
              trigger: sectionRef.current,
              start: "top 70%",
              once: true,
            },
          })
          .fromTo(
            classesRef.current,
            { opacity: 0, y: 20 },
            { opacity: 1, y: 0, duration: 0.6, ease: "power2.out" }
          )
          .fromTo(
            forYouRef.current,
            { opacity: 0, scale: 0.8 },
            { opacity: 1, scale: 1, duration: 0.6, ease: "power2.out" },
            "-=0.2"
          );

        if (scrollTextRef.current) {
          const scrollElement = scrollTextRef.current;
          const speed = 0.5; // px of marquee travel per px of page scroll

          // Measured once and on resize rather than every scroll frame, so the
          // handler never forces a layout read.
          let half = scrollElement.scrollWidth / 2;
          const remeasure = () => {
            half = scrollElement.scrollWidth / 2;
          };
          window.addEventListener("resize", remeasure);

          ScrollTrigger.create({
            start: 0,
            end: "max",
            onUpdate: (self) => {
              if (!half) return;
              let x = -((self.scroll() * speed) % half);
              if (x > 0) x -= half;
              scrollElement.style.transform = `translate3d(${x}px, 0, 0)`;
            },
            onRefresh: remeasure,
            invalidateOnRefresh: true,
          });

          cleanupMarqueeResize = () =>
            window.removeEventListener("resize", remeasure);
        }
      } else {
        gsap.set([classesRef.current, forYouRef.current], { opacity: 1 });
      }
    }, sectionRef);

    return () => {
      cleanupMarqueeResize?.();
      ctx.revert();
    };
  }, []);

  return (
    <section ref={sectionRef} className="overflow-x-hidden overflow-y-visible bg-[#0a0a0a]">
      <div className="mx-auto w-full max-w-[1440px] px-5 pt-8 pb-20 md:px-10 md:pt-12 md:pb-28 xl:px-16 xl:pb-32">
        <div className="mb-14 text-center">
          <h2 className="text-white uppercase">
            <span
              ref={classesRef}
              className="block text-2xl font-normal tracking-wide opacity-0 md:text-3xl"
            >
              {content.headingTop}
            </span>
            <span
              ref={forYouRef}
              className="mt-2 block text-6xl font-bold opacity-0 md:text-7xl"
            >
              {content.headingBottom}
            </span>
          </h2>
        </div>

        {/* Scroll-driven marquee. The phrase is repeated so the strip is always
            wider than the viewport; wrapping happens on half its own width. */}
        <div className="relative mb-12 w-full overflow-hidden md:mb-16">
          <div
            ref={scrollTextRef}
            className="flex whitespace-nowrap text-white"
            style={{
              fontWeight: 800,
              fontSize: "clamp(40px, 6vw, 95px)",
              lineHeight: "clamp(48px, 7vw, 110px)",
              transform: "translate3d(0, 0, 0)",
              willChange: "transform",
            }}
          >
            {Array.from({ length: 10 }).map((_, i) => (
              <span key={i} className="inline-block px-8">
                {content.marqueePhrase}
              </span>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {content.cards.map((item, i) => (
            <Reveal key={item.id} delay={i * 0.1}>
              <Link href={item.href} className="block">
                <div className="group cursor-pointer">
                  <div className="relative h-[350px] overflow-hidden rounded-lg shadow-xl sm:h-[300px] md:h-[450px]">
                    {/*
                      A clip wins over a photo while its URL is filled in, and
                      the photo comes straight back when it is emptied. A
                      precedence rule rather than a validation error, because
                      every seeded card ships with an `image_url` — refusing to
                      save a card carrying both made the video field unusable
                      on all of them.

                      `cldOptimize` is a no-op on anything that is not a
                      Cloudinary URL, so an image uploaded in the admin passes
                      straight through.
                    */}
                    {item.video?.src ? (
                      <CardVideo
                        video={item.video}
                        label={item.name.replace("\n", " ")}
                      />
                    ) : item.image ? (
                      <Image
                        src={cldOptimize(item.image, 700)}
                        alt={item.name.replace("\n", " ")}
                        fill
                        className="object-cover transition-all duration-700 group-hover:scale-110 group-hover:brightness-110"
                        sizes="(min-width: 1024px) 25vw, 50vw"
                        loading={i < 4 ? "eager" : "lazy"}
                        priority={i < 2}
                      />
                    ) : (
                      <div className="absolute inset-0 bg-blush" />
                    )}
                    <div className="absolute inset-0 bg-deep/20 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                  </div>

                  <div className="relative rounded-b-lg bg-[#141414] py-6 transition-shadow duration-300">
                    {/*
                      The demo pins this at 30px/38px. At that size the longer
                      names ("Gym Training", "Outdoor Activities") outrun the
                      pr-12 gutter in a two-column mobile grid and the arrow
                      lands on top of the text, so the size steps down below sm.
                    */}
                    <h3 className="pr-12 text-[22px] leading-[28px] font-bold whitespace-pre-line text-white uppercase transition-all duration-300 group-hover:text-[#c7ff3d] sm:text-[30px] sm:leading-[38px]">
                      {item.name}
                    </h3>

                    <ArrowRightIcon className="absolute right-0 bottom-6 h-9 w-9 text-white transition-all duration-300 group-hover:translate-x-2 group-hover:scale-110 group-hover:text-[#c7ff3d]" />

                    <div className="absolute bottom-0 left-0 h-1 w-0 bg-gradient-to-r from-[#c7ff3d] to-transparent transition-all duration-500 group-hover:w-full" />
                  </div>
                </div>
              </Link>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

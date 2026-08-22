"use client";

import {
  useEffect,
  useRef,
  useState,
  ReactNode,
  TouchEvent,
  WheelEvent,
} from "react";
import Image from "next/image";

/**
 * Ported from the devis-gym demo
 * (`components/unused-components/ui/scroll-expansion-hero.tsx`).
 *
 * Behaviour is the demo's, unchanged: the media starts as a 300x400 card and
 * the wheel/touch delta — not the scroll position — grows it to fill the
 * viewport while the two halves of the title slide apart. Page scroll is locked
 * for the duration of that phase and released once the card is fully expanded;
 * scrolling back up at the very top rewinds it.
 *
 * Changed: the demo animates four opacity fades with framer-motion, which this
 * project does not depend on. They are plain elements with a CSS transition
 * here — same durations, same values. `motion.h2` carried no animation props at
 * all, so those are plain `h2`.
 */

interface ScrollExpansionHeroProps {
  mediaType?: "video" | "image";
  mediaSrc: string;
  posterSrc?: string;
  bgImageSrc: string;
  title?: string;
  date?: string;
  subtitle?: string;
  scrollToExpand?: string;
  textBlend?: boolean;
  children?: ReactNode;
}

const ScrollExpansionHero = ({
  mediaType = "video",
  mediaSrc,
  posterSrc,
  bgImageSrc,
  title,
  date,
  subtitle,
  scrollToExpand,
  textBlend,
  children,
}: ScrollExpansionHeroProps) => {
  const [scrollProgress, setScrollProgress] = useState<number>(0);
  /*
    The same number the state holds, kept for the wheel and touch handlers to
    read. They need the *current* progress to add a delta to it, and reading the
    state meant `scrollProgress` had to be a dependency of the effect that
    registers the listeners -- so every wheel tick tore down five window
    listeners and re-added them, on top of the re-render it already caused.
    Reading the ref instead lets that effect depend on nothing that changes at
    input frequency. The state stays: nine style computations render from it.
  */
  const progressRef = useRef<number>(0);
  const [showContent, setShowContent] = useState<boolean>(false);
  const [mediaFullyExpanded, setMediaFullyExpanded] = useState<boolean>(false);
  const [horizontalExpansionComplete, setHorizontalExpansionComplete] =
    useState<boolean>(false);
  const [touchStartY, setTouchStartY] = useState<number>(0);
  const [isMobileState, setIsMobileState] = useState<boolean>(false);
  const [windowDimensions, setWindowDimensions] = useState({
    width: 1200,
    height: 800,
  });
  // Stands in for framer-motion's `initial` — the first paint uses the initial
  // opacity, the frame after mount transitions to the animated one.
  const [mounted, setMounted] = useState<boolean>(false);
  const sectionRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    // Deferred to the next frame rather than set synchronously. Both because
    // the transition needs the browser to have painted the initial opacity
    // first — flipping it in the same commit gives no transition to run — and
    // because a sync setState in an effect body is a cascading render.
    const frame = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  // Swapping the media resets the expansion. Adjusted during render against the
  // previous value rather than in an effect: React re-renders with the new
  // state before committing, so nothing paints at the stale progress the way it
  // would with an effect firing after the first paint.
  const [renderedMediaType, setRenderedMediaType] = useState(mediaType);
  if (renderedMediaType !== mediaType) {
    setRenderedMediaType(mediaType);
    setScrollProgress(0);
    setShowContent(false);
    setMediaFullyExpanded(false);
    setHorizontalExpansionComplete(false);
  }

  // Mirror the committed progress into the ref. The handlers also write it
  // directly so that two wheel events inside one frame compose correctly, but
  // this is what covers the paths that reset progress during render -- a ref
  // must not be written there, because React is free to discard that render.
  useEffect(() => {
    progressRef.current = scrollProgress;
  }, [scrollProgress]);

  // Prevent body scroll during horizontal expansion
  useEffect(() => {
    if (typeof window === "undefined") return;

    // This component drives its own wheel-based expansion progress and manually
    // locks body scroll during that phase. Lenis (the site-wide smooth-scroll
    // driver) isn't aware of that lock and keeps processing the same wheel
    // events, so the two fight over scroll input. Pausing Lenis for the
    // duration of the hijacked phase — and only that phase — resolves the
    // conflict without touching this component's own animation/design.
    type LenisLike = { stop: () => void; start: () => void };
    const getLenis = () => (window as unknown as { lenis?: LenisLike }).lenis;

    const applyLenisState = () => {
      if (!horizontalExpansionComplete) {
        getLenis()?.stop();
      } else {
        getLenis()?.start();
      }
    };

    if (!horizontalExpansionComplete) {
      // Lock body scroll during expansion
      document.body.style.overflow = "hidden";
      document.body.style.position = "fixed";
      document.body.style.width = "100%";
    } else {
      // Restore body scroll after expansion
      document.body.style.overflow = "";
      document.body.style.position = "";
      document.body.style.width = "";
    }
    applyLenisState();

    // React runs child effects before parent effects, so on first mount Lenis
    // (created by a provider higher up the tree) may not exist yet when this
    // runs. Retry once it announces itself.
    window.addEventListener("lenis:ready", applyLenisState);

    return () => {
      // Cleanup on unmount
      document.body.style.overflow = "";
      document.body.style.position = "";
      document.body.style.width = "";
      window.removeEventListener("lenis:ready", applyLenisState);
      getLenis()?.start();
    };
  }, [horizontalExpansionComplete]);

  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      if (typeof window === "undefined") return;

      // Only handle wheel events when we're at the top of the page and not fully expanded
      const atTop = window.scrollY <= 5;

      if (mediaFullyExpanded && e.deltaY < 0 && atTop) {
        setMediaFullyExpanded(false);
        setShowContent(false);
        setHorizontalExpansionComplete(false);
        e.preventDefault();
      } else if (!horizontalExpansionComplete && atTop) {
        // Phase 1: Horizontal expansion ONLY - prevent scrolling only at top
        e.preventDefault();
        e.stopPropagation();

        const scrollDelta = e.deltaY * 0.002;
        const newProgress = Math.min(
          Math.max(progressRef.current + scrollDelta, 0),
          1
        );
        progressRef.current = newProgress;
        setScrollProgress(newProgress);

        if (newProgress >= 1) {
          setHorizontalExpansionComplete(true);
          setShowContent(true);
          // Small delay to ensure smooth transition to scroll phase
          setTimeout(() => {
            setMediaFullyExpanded(true);
          }, 100);
        }
      }
      // Phase 2: Natural scrolling is allowed after horizontalExpansionComplete && mediaFullyExpanded
      // or when scrollY > 5 (not at top of page)
    };

    const handleTouchStart = (e: TouchEvent) => {
      setTouchStartY(e.touches[0].clientY);
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (typeof window === "undefined" || !touchStartY) return;

      const touchY = e.touches[0].clientY;
      const deltaY = touchStartY - touchY;
      const atTop = window.scrollY <= 5;

      if (mediaFullyExpanded && deltaY < -20 && atTop) {
        setMediaFullyExpanded(false);
        setHorizontalExpansionComplete(false);
        setShowContent(false);
        e.preventDefault();
      } else if (!horizontalExpansionComplete && atTop) {
        // Phase 1: Horizontal expansion ONLY - prevent scrolling only at top
        e.preventDefault();
        e.stopPropagation();

        const scrollFactor = deltaY < 0 ? 0.008 : 0.005;
        const scrollDelta = deltaY * scrollFactor;
        const newProgress = Math.min(
          Math.max(progressRef.current + scrollDelta, 0),
          1
        );
        progressRef.current = newProgress;
        setScrollProgress(newProgress);

        if (newProgress >= 1) {
          setHorizontalExpansionComplete(true);
          setShowContent(true);
          // Small delay to ensure smooth transition to scroll phase
          setTimeout(() => {
            setMediaFullyExpanded(true);
          }, 100);
        }

        setTouchStartY(touchY);
      }
      // Phase 2: Natural scrolling is allowed after horizontalExpansionComplete && mediaFullyExpanded
      // or when scrollY > 5 (not at top of page)
    };

    const handleTouchEnd = (): void => {
      setTouchStartY(0);
    };

    const handleScroll = (): void => {
      // Body scroll is already locked during expansion phase
      // This is just a fallback
      if (typeof window === "undefined") return;

      if (!horizontalExpansionComplete && window.scrollY > 0) {
        window.scrollTo(0, 0);
      }
    };

    if (typeof window === "undefined") return;

    window.addEventListener("wheel", handleWheel as unknown as EventListener, {
      passive: false,
    });
    window.addEventListener("scroll", handleScroll as EventListener);
    window.addEventListener(
      "touchstart",
      handleTouchStart as unknown as EventListener,
      { passive: false }
    );
    window.addEventListener(
      "touchmove",
      handleTouchMove as unknown as EventListener,
      { passive: false }
    );
    window.addEventListener("touchend", handleTouchEnd as EventListener);

    return () => {
      if (typeof window === "undefined") return;

      window.removeEventListener(
        "wheel",
        handleWheel as unknown as EventListener
      );
      window.removeEventListener("scroll", handleScroll as EventListener);
      window.removeEventListener(
        "touchstart",
        handleTouchStart as unknown as EventListener
      );
      window.removeEventListener(
        "touchmove",
        handleTouchMove as unknown as EventListener
      );
      window.removeEventListener("touchend", handleTouchEnd as EventListener);
    };
    // `scrollProgress` is deliberately absent: the handlers read `progressRef`
    // instead, so this effect no longer re-runs -- and re-registers five window
    // listeners -- on every wheel event.
  }, [mediaFullyExpanded, horizontalExpansionComplete, touchStartY]);

  useEffect(() => {
    const checkIfMobile = (): void => {
      if (typeof window === "undefined") return;

      const width = window.innerWidth;
      const height = window.innerHeight;
      setWindowDimensions({ width, height });
      setIsMobileState(width < 768);
    };

    checkIfMobile();

    if (typeof window !== "undefined") {
      window.addEventListener("resize", checkIfMobile);
      return () => window.removeEventListener("resize", checkIfMobile);
    }
  }, []);

  const mediaWidth = horizontalExpansionComplete
    ? isMobileState
      ? windowDimensions.width
      : windowDimensions.width
    : 300 +
    scrollProgress *
    (isMobileState
      ? windowDimensions.width - 300
      : windowDimensions.width - 300);
  const mediaHeight = horizontalExpansionComplete
    ? isMobileState
      ? windowDimensions.height
      : windowDimensions.height
    : 400 +
    scrollProgress *
    (isMobileState
      ? windowDimensions.height - 400
      : windowDimensions.height - 400);
  const textTranslateX = scrollProgress * (isMobileState ? 180 : 150);

  const firstWord = title ? title.split(" ")[0] : "";
  const restOfTitle = title ? title.split(" ").slice(1).join(" ") : "";

  return (
    <div
      ref={sectionRef}
      className="transition-colors duration-700 ease-in-out overflow-x-hidden"
    >
      <section className="relative flex flex-col items-center justify-start min-h-[100dvh]">
        <div className="relative w-full flex flex-col items-center min-h-[100dvh]">
          {/* No `mounted` gate here, unlike the overlays below. This is the
              backdrop the page opens on, and starting it at 0 meant the server
              -rendered paint was a black screen that only filled in once React
              had hydrated. `1 - scrollProgress` is already 1 at rest, so the
              scroll fade is unchanged -- only the blank first frame is gone. */}
          <div
            className="absolute inset-0 z-0 h-full"
            style={{
              opacity: 1 - scrollProgress,
              transition: "opacity 0.1s ease-out",
            }}
          >
            <Image
              src={bgImageSrc}
              alt="Background"
              width={1920}
              height={1080}
              className="w-screen h-screen"
              style={{
                objectFit: "cover",
                objectPosition: "center",
              }}
              // The LCP element of this page: full-viewport and above the fold.
              // It was `loading="lazy"`, which cannot fire until hydration has
              // run the intersection observer, so the fetch queued behind the
              // JS bundle. `priority` preloads it from the document head at
              // high fetch priority instead.
              priority
              sizes="100vw"
            />
            <div className="absolute inset-0 bg-black/10" />
          </div>

          <div className="container mx-auto flex flex-col items-center justify-start relative z-10">
            <div className="flex flex-col items-center justify-center w-full h-[100dvh] relative">
              <div
                className="absolute z-0 top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 transition-none rounded-2xl"
                style={{
                  width: `${mediaWidth}px`,
                  height: `${mediaHeight}px`,
                  maxWidth: horizontalExpansionComplete ? "100vw" : "95vw",
                  maxHeight: horizontalExpansionComplete ? "100vh" : "85vh",
                  boxShadow: "0px 0px 50px rgba(0, 0, 0, 0.3)",
                  willChange: horizontalExpansionComplete
                    ? "auto"
                    : "width, height",
                }}
              >
                {mediaType === "video" ? (
                  mediaSrc.includes("youtube.com") ? (
                    <div className="relative w-full h-full pointer-events-none">
                      <iframe
                        width="100%"
                        height="100%"
                        src={
                          mediaSrc.includes("embed")
                            ? mediaSrc +
                            (mediaSrc.includes("?") ? "&" : "?") +
                            "autoplay=1&mute=1&loop=1&controls=0&showinfo=0&rel=0&disablekb=1&modestbranding=1"
                            : mediaSrc.replace("watch?v=", "embed/") +
                            "?autoplay=1&mute=1&loop=1&controls=0&showinfo=0&rel=0&disablekb=1&modestbranding=1&playlist=" +
                            mediaSrc.split("v=")[1]
                        }
                        className={`w-full h-full rounded-xl ${horizontalExpansionComplete ? "rounded-none" : "rounded-xl"}`}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                      <div
                        className="absolute inset-0 z-10"
                        style={{ pointerEvents: "none" }}
                      ></div>
                      <div
                        className="absolute inset-0 bg-black/30 rounded-xl"
                        style={{
                          opacity: mounted ? 0.5 - scrollProgress * 0.3 : 0.7,
                          transition: "opacity 0.2s ease-out",
                        }}
                      />
                    </div>
                  ) : (
                    <div className="relative w-full h-full pointer-events-none">
                      <video
                        src={mediaSrc}
                        poster={posterSrc}
                        autoPlay
                        muted
                        loop
                        playsInline
                        preload="auto"
                        className={`w-full h-full object-cover ${horizontalExpansionComplete ? "rounded-none" : "rounded-xl"}`}
                        controls={false}
                        disablePictureInPicture
                        disableRemotePlayback
                        onLoadedData={(e) => {
                          // Ensure video plays on mobile
                          const video = e.currentTarget;
                          if (video.paused) {
                            video.play().catch(() => {
                              // If autoplay fails, try again after user interaction
                              console.log("Video autoplay prevented");
                            });
                          }
                        }}
                      />
                      <div
                        className="absolute inset-0 z-10"
                        style={{ pointerEvents: "none" }}
                      ></div>
                      <div
                        className={`absolute inset-0 bg-black/30 ${horizontalExpansionComplete ? "rounded-none" : "rounded-xl"}`}
                        style={{
                          opacity: mounted ? 0.5 - scrollProgress * 0.3 : 0.7,
                          transition: "opacity 0.2s ease-out",
                        }}
                      />
                    </div>
                  )
                ) : (
                  <div className="relative w-full h-full">
                    <Image
                      src={mediaSrc}
                      alt={title || "Media content"}
                      width={1280}
                      height={720}
                      className={`w-full h-full object-cover ${horizontalExpansionComplete ? "rounded-none" : "rounded-xl"}`}
                      // Above the fold too when the hero is an image rather
                      // than a video, so it loads eagerly for the same reason.
                      priority
                      sizes="(max-width: 768px) 95vw, 100vw"
                    />
                    <div
                      className={`absolute inset-0 bg-black/50 ${horizontalExpansionComplete ? "rounded-none" : "rounded-xl"}`}
                      style={{
                        opacity: mounted ? 0.7 - scrollProgress * 0.3 : 0.7,
                        transition: "opacity 0.2s ease-out",
                      }}
                    />
                  </div>
                )}

                <div className="flex flex-col items-center text-center relative z-10 mt-4 transition-none">
                  {date && (
                    <p
                      className="font-gotham text-white font-bold uppercase tracking-wider"
                      style={{
                        transform: `translateX(-${textTranslateX}vw)`,
                        fontWeight: 700,
                        fontSize: "17px",
                        lineHeight: "24px",
                        color: "rgb(255, 255, 255)",
                      }}
                    >
                      {date}
                    </p>
                  )}
                  {subtitle && (
                    <p
                      className="font-gotham text-white font-medium uppercase tracking-wider mt-1"
                      style={{
                        transform: `translateX(-${textTranslateX}vw)`,
                        fontWeight: 500,
                        fontSize: "13px",
                        lineHeight: "19px",
                        color: "rgb(255, 255, 255)",
                      }}
                    >
                      {subtitle}
                    </p>
                  )}
                  {scrollToExpand && (
                    <p
                      className="font-gotham text-white font-medium text-center"
                      style={{
                        transform: `translateX(${textTranslateX}vw)`,
                        fontWeight: 500,
                        fontSize: "13px",
                        lineHeight: "19px",
                        color: "rgb(255, 255, 255)",
                      }}
                    >
                      {scrollToExpand}
                    </p>
                  )}
                </div>
              </div>

              <div
                className={`flex items-center justify-center text-center gap-4 w-full relative z-10 transition-none flex-col ${textBlend ? "mix-blend-difference" : "mix-blend-normal"
                  }`}
              >
                <h2
                  className="font-gotham-condensed font-bold uppercase leading-[0.9] tracking-tight text-white transition-none"
                  style={{
                    transform: `translateX(-${textTranslateX}vw)`,
                    fontSize: "81px",
                    lineHeight: "81px",
                    fontWeight: 700,
                    color: "rgb(255, 255, 255)",
                  }}
                >
                  {firstWord}
                </h2>
                <h2
                  className="font-gotham-condensed font-bold uppercase leading-[0.9] tracking-tight text-center text-white transition-none"
                  style={{
                    transform: `translateX(${textTranslateX}vw)`,
                    fontSize: "81px",
                    lineHeight: "81px",
                    fontWeight: 700,
                    color: "rgb(255, 255, 255)",
                  }}
                >
                  {restOfTitle}
                </h2>
              </div>
            </div>

            <section
              className="flex flex-col w-full px-8 py-10 md:px-16 lg:py-20"
              style={{
                opacity: showContent ? 1 : 0,
                transition: "opacity 0.7s ease-out",
              }}
            >
              {children}
            </section>
          </div>
        </div>
      </section>
    </div>
  );
};

export { ScrollExpansionHero };

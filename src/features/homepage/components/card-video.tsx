"use client";

/**
 * The clip that plays in place of a Class card's photo.
 *
 * Five things decide how this behaves, and none of them are decoration:
 *
 * 1. **It stands alone.** A clip replaces the card's photo rather than
 *    layering over it, so there is no image underneath to fall back to. What
 *    fills the tile until frames decode is the `poster` — Cloudflare's still
 *    for a Stream clip, or the frame Cloudinary renders for a pasted
 *    Cloudinary URL. A clip that never plays stays on that frame instead of
 *    going black.
 *
 * 2. **Nothing loads until it is on screen.** The grid holds up to eight of
 *    these. Attaching eight streams on mount would mean eight fetches and
 *    eight decode pipelines competing on a phone before the visitor has
 *    scrolled to any of them, so an IntersectionObserver gates it and tears
 *    it down again on the way out.
 *
 * 3. **The card is a link, and this is not.** Every card is wrapped in a
 *    `<Link>` to /services. A click on the clip has to open it rather than
 *    navigate, so both the surface and its buttons stop the event — see
 *    `swallow`. The title and arrow below still navigate, which keeps the
 *    card's original job intact.
 *
 * 4. **The loop is muted and silent by design; the modal is not.** Autoplay
 *    in a grid is decorative and browsers will only allow it muted anyway.
 *    Opening the modal is a deliberate request to watch something, so that
 *    gets sound and full controls.
 *
 * 5. **Reduced motion and Save-Data are honoured** for the loop only. Somebody
 *    who has asked not to be sent autoplaying video still gets a poster, a
 *    play button and the modal — the request is about motion they did not
 *    ask for, not about being denied the content.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { Maximize2, Pause, Play } from "lucide-react";

import { VideoModal } from "@/components/shared/video-modal";
import { cldOptimize, cldVideo } from "@/lib/cloudinary";
import { useAutoplayAllowed, useHlsVideo } from "@/lib/use-hls-video";
import type { ClassCardVideo } from "@/lib/types/content-types";

type Props = {
  video: ClassCardVideo;
  /** Accessible name. There is no visible caption on the tile. */
  label: string;
};

/** Keep a click on the controls from reaching the card's surrounding <Link>. */
function swallow(event: React.MouseEvent) {
  event.preventDefault();
  event.stopPropagation();
}

export function CardVideo({ video, label }: Props) {
  const ref = useRef<HTMLVideoElement | null>(null);
  const [visible, setVisible] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [open, setOpen] = useState(false);
  const allowAutoplay = useAutoplayAllowed();

  const raw = video.src || "";
  // 800px into a tile that renders at 300–450px: enough for a 2x display and
  // nothing more. See cldVideo — the clip on the site is 54MB untouched.
  const source = cldVideo(raw, 800);
  const poster = video.thumbnail ? cldOptimize(video.thumbnail, 800) : undefined;

  useEffect(() => {
    const element = ref.current;
    if (!element || !source) return;

    // `rootMargin` starts the fetch a little before the tile is actually in
    // view, so scrolling to it finds it playing rather than starting.
    const observer = new IntersectionObserver(
      (entries) => setVisible(entries[0]?.isIntersecting ?? false),
      { rootMargin: "200px" },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, [source]);

  // Paused while the modal is open: two copies of the same clip playing at
  // once is wasted bandwidth, and the muted one is inaudibly fighting the
  // one with sound.
  useHlsVideo(ref, source, visible && allowAutoplay && !open, {
    capToPlayerSize: true,
  });

  const toggle = useCallback((event: React.MouseEvent) => {
    swallow(event);
    const element = ref.current;
    if (!element) return;
    if (element.paused) {
      element.play().catch(() => {});
    } else {
      element.pause();
    }
  }, []);

  const expand = useCallback((event: React.MouseEvent) => {
    swallow(event);
    setOpen(true);
  }, []);

  if (!raw) return null;

  return (
    <>
      {/*
        A button, not a div with a click handler: this is the primary way into
        the modal, and it has to be reachable by keyboard and announce itself.
        `absolute inset-0` makes the whole tile the target.
      */}
      <button
        type="button"
        onClick={expand}
        aria-label={`Play ${label} full screen`}
        className="absolute inset-0 z-10 cursor-zoom-in focus-visible:ring-2 focus-visible:ring-[#c7ff3d] focus-visible:ring-inset focus-visible:outline-none"
      >
        <span className="sr-only">{label}</span>
      </button>

      <video
        ref={ref}
        muted
        loop
        playsInline
        preload="none"
        poster={poster}
        aria-label={label}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
      />

      {/*
        A scrim under the controls. Without it the buttons sit on whatever
        the clip happens to be showing, which on a bright frame is nothing at
        all. Pointer-events off so it never eats a click meant for the tile.
      */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-24 bg-gradient-to-t from-black/70 to-transparent" />

      <div className="absolute inset-x-0 bottom-0 z-20 flex items-center justify-between p-3">
        <button
          type="button"
          onClick={toggle}
          aria-label={playing ? `Pause ${label}` : `Play ${label}`}
          className="rounded-full bg-black/50 p-2.5 text-white backdrop-blur-sm transition hover:bg-black/70 focus-visible:ring-2 focus-visible:ring-[#c7ff3d] focus-visible:outline-none"
        >
          {playing ? (
            <Pause className="h-4 w-4" aria-hidden />
          ) : (
            <Play className="h-4 w-4" aria-hidden />
          )}
        </button>

        {/*
          Duplicates what clicking the tile does. Worth the space: a bare
          video with no affordance reads as a decorative background, and
          nobody clicks a background.
        */}
        <button
          type="button"
          onClick={expand}
          aria-label={`Play ${label} full screen`}
          className="rounded-full bg-black/50 p-2.5 text-white backdrop-blur-sm transition hover:bg-black/70 focus-visible:ring-2 focus-visible:ring-[#c7ff3d] focus-visible:outline-none"
        >
          <Maximize2 className="h-4 w-4" aria-hidden />
        </button>
      </div>

      <VideoModal
        source={raw}
        poster={video.thumbnail}
        label={label}
        open={open}
        onClose={() => setOpen(false)}
      />
    </>
  );
}

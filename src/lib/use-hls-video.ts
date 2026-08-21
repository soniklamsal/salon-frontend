"use client";

/**
 * Attaching a video source to a <video>, whatever kind of source it is.
 *
 * Two places need this — the clip on a Class card and the same clip enlarged
 * in the modal — and they must not drift apart, because the failure mode is
 * subtle: a clip that plays in the grid and shows a black rectangle when
 * opened, or the reverse.
 *
 * Three things it handles that a plain `src` attribute does not:
 *
 * 1. **HLS.** Safari plays `.m3u8` natively; nothing else does. Everywhere
 *    else needs hls.js, which is ~150KB and is therefore `import()`ed at the
 *    moment a clip is actually going to play rather than shipped in the page
 *    bundle. A site whose hero is a photo should not pay for a video player
 *    it may never use.
 *
 * 2. **Teardown.** Detaching the source on cleanup matters more than it
 *    looks: Chrome will hold a decoder open for a paused <video> that still
 *    has a src, and a grid of eight of them exhausts the pool on mobile,
 *    at which point later videos silently refuse to play.
 *
 * 3. **Quality ceiling.** A 300px tile has no use for a 1080p rendition. The
 *    modal does. `capToPlayerSize` is the difference.
 */

import { useEffect, useSyncExternalStore, type RefObject } from "react";

type Options = {
  /** Cap adaptive quality to the element's rendered size. True for the grid
   *  tile, false for the modal, which is as big as the window. */
  capToPlayerSize?: boolean;
  /** Start playing as soon as there is something to play. */
  autoplay?: boolean;
};

export function useHlsVideo(
  ref: RefObject<HTMLVideoElement | null>,
  source: string,
  active: boolean,
  { capToPlayerSize = true, autoplay = true }: Options = {},
) {
  useEffect(() => {
    const element = ref.current;
    if (!element || !source || !active) return;

    let cancelled = false;
    // Typed loosely on purpose: hls.js is an optional dynamic import, and
    // naming its types here statically would defeat the code split.
    let hls: { destroy: () => void } | null = null;

    const start = () => {
      if (!autoplay) return;
      // A rejected play() is the browser declining to autoplay, which is a
      // refusal and not a fault. The poster stays up and nothing is reported.
      element.play().catch(() => {});
    };

    const isHls = source.includes(".m3u8");
    const nativeHls = element.canPlayType("application/vnd.apple.mpegurl");

    if (!isHls || nativeHls) {
      // Safari, or a plain .mp4 — which is what a pasted Cloudinary URL is.
      element.src = source;
      start();
    } else {
      import("hls.js")
        .then(({ default: Hls }) => {
          if (cancelled || !Hls.isSupported()) return;
          const instance = new Hls({
            capLevelToPlayerSize: capToPlayerSize,
            maxBufferLength: capToPlayerSize ? 10 : 30,
          });
          hls = instance;
          instance.loadSource(source);
          instance.attachMedia(element);
          instance.on(Hls.Events.MANIFEST_PARSED, start);
        })
        .catch(() => {
          /* The chunk failed to load. The poster is already showing. */
        });
    }

    return () => {
      cancelled = true;
      hls?.destroy();
      element.pause();
      element.removeAttribute("src");
      element.load();
    };
  }, [ref, source, active, capToPlayerSize, autoplay]);
}

const REDUCED_MOTION = "(prefers-reduced-motion: reduce)";

function subscribeToMotionPreference(onChange: () => void) {
  if (typeof window === "undefined" || !window.matchMedia) return () => {};
  const query = window.matchMedia(REDUCED_MOTION);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}

function autoplayAllowedNow(): boolean {
  if (typeof window === "undefined") return false;

  const reducedMotion = window.matchMedia?.(REDUCED_MOTION)?.matches;

  // Non-standard and Chromium-only, but the only signal there is for "this
  // person is paying per megabyte", which is a real constraint for a good
  // share of this site's traffic.
  const connection = (
    navigator as Navigator & { connection?: { saveData?: boolean } }
  ).connection;

  return !(reducedMotion || connection?.saveData);
}

/**
 * Whether a decorative loop may start on its own.
 *
 * Applies to the grid only — opening the modal is a request, and a request is
 * always honoured.
 *
 * `useSyncExternalStore` rather than an effect that sets state: the server has
 * no `matchMedia`, so the two passes would disagree and hydrate wrong. This
 * takes a server snapshot (`false` — never autoplay in markup nobody has
 * hydrated yet) and a client one, and re-reads if the OS preference changes
 * while the page is open.
 */
export function useAutoplayAllowed(): boolean {
  return useSyncExternalStore(
    subscribeToMotionPreference,
    autoplayAllowedNow,
    () => false,
  );
}

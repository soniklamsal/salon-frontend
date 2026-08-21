"use client";

/**
 * A clip, full size, over the page.
 *
 * Portalled to <body> rather than rendered where it is used, and that is not
 * a stylistic choice: every one of these is opened from inside a Class card,
 * which sits inside `overflow-hidden` for its rounded corners and inside a
 * `<Link>`. Rendered in place it would be clipped to a 300px tile and every
 * click inside it would navigate away.
 *
 * The grid loop is muted, decorative and has no controls. This is the
 * opposite: sound on, native controls, and as large as the window allows —
 * because opening it is a deliberate request to watch something, where the
 * loop in the grid was not.
 */

import { useCallback, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

import { cldOptimize, cldVideo } from "@/lib/cloudinary";
import { useHlsVideo } from "@/lib/use-hls-video";

type Props = {
  source: string;
  poster?: string;
  label: string;
  open: boolean;
  onClose: () => void;
};

export function VideoModal({ source, poster, label, open, onClose }: Props) {
  // Wider than the tile because this fills the window, but still capped: the
  // untransformed clip is 54MB and no laptop screen shows 4096px of it.
  const src = cldVideo(source, 1600);
  const still = poster ? cldOptimize(poster, 1600) : undefined;
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const closeRef = useRef<HTMLButtonElement | null>(null);
  const returnFocusTo = useRef<Element | null>(null);

  useHlsVideo(videoRef, src, open, {
    // The modal is as wide as the window, so the quality ceiling that suits a
    // 300px tile would leave this looking soft.
    capToPlayerSize: false,
  });

  const close = useCallback(() => onClose(), [onClose]);

  useEffect(() => {
    if (!open) return;

    returnFocusTo.current = document.activeElement;
    // Moving focus into the dialog is what makes Escape and Tab behave, and
    // what stops a screen reader carrying on down the page behind it.
    closeRef.current?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
    };
    document.addEventListener("keydown", onKeyDown);

    // The page behind must not scroll under the overlay. Restoring the
    // previous value rather than clearing it leaves any other lock intact.
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
      // Back to the tile that opened it, not to the top of the document.
      (returnFocusTo.current as HTMLElement | null)?.focus?.();
    };
  }, [open, close]);

  // `open` only ever becomes true from a click, which cannot happen before
  // hydration — so by the time this renders a portal there is a document to
  // portal into, and no mount flag is needed to prove it.
  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label={label}
      onClick={close}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 p-4 backdrop-blur-sm motion-safe:animate-[fadeIn_180ms_ease-out] sm:p-8"
    >
      <button
        ref={closeRef}
        type="button"
        onClick={close}
        aria-label="Close video"
        className="absolute top-4 right-4 rounded-full bg-white/10 p-2.5 text-white transition hover:bg-white/20 focus:ring-2 focus:ring-white focus:outline-none sm:top-6 sm:right-6"
      >
        <X className="h-5 w-5" aria-hidden />
      </button>

      {/*
        Stops a click on the video itself closing the thing — the backdrop
        handler is on the parent, and without this every attempt to hit pause
        would dismiss the dialog.
      */}
      <div
        onClick={(event) => event.stopPropagation()}
        className="w-full max-w-5xl"
      >
        <video
          ref={videoRef}
          controls
          autoPlay
          playsInline
          poster={still}
          aria-label={label}
          className="max-h-[85vh] w-full rounded-lg bg-black shadow-2xl"
        />
      </div>
    </div>,
    document.body,
  );
}

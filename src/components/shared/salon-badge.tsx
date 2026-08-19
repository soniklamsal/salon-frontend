import Image from "next/image";

import { BadgeRingIcon } from "@/components/shared/story-art";

/**
 * The circular SALON badge — a ring, the brand mark, and a caption set around
 * the outside of it.
 *
 * The mark in the middle follows the same rule the header does: the logo from
 * Site settings when one is uploaded, the brand name as text when not. There is
 * no flag for it — a non-empty `logo` is the switch.
 *
 * It appears twice on the home page, at the same 338x298 size but in two
 * different rings, so the ring is the one thing that varies:
 *   `story`   Figma 97:1118 (Follow Us) — the exported vector filled with the
 *             file's `lin-circle` gradient, #eda68c into #ecd0c7 top to bottom.
 *   `footer`  the ring in the footer group (97:1040), which runs the other way:
 *             blush at the top into #ff8e67 at the bottom — the `lin` gradient.
 *
 * Figma sets the circular caption as 32 separately rotated glyphs (its
 * text-on-a-path export). Rebuilt here as one SVG <textPath> on a r=150 circle
 * centred on the ring, which is a fraction of the markup and stays legible.
 */

type SalonBadgeProps = {
  className?: string;
  ring?: "story" | "footer";
  /** `SiteSettings.logo`. Replaces the wordmark inside the ring when set. */
  logo: string;
  /** `SiteSettings.brandName` — the wordmark inside the ring, and the logo's alt. */
  brandName: string;
  /** `SiteSettings.badgeCaption` — set around the outside of the ring. */
  caption: string;
};

export function SalonBadge({
  className,
  ring = "story",
  logo,
  brandName,
  caption,
}: SalonBadgeProps) {
  // Both badges render on the same page, so the <defs> ids have to differ.
  // There is exactly one of each variant, which makes the variant name enough
  // — and unlike useId() it keeps this a server component.
  const arcId = `salon-badge-arc-${ring}`;
  const ringId = `salon-badge-ring-${ring}`;

  return (
    <div
      className={`relative aspect-[338/298] w-[280px] shrink-0 sm:w-[338px] ${className ?? ""}`}
    >
      {/* 97:1118 — gradient ring, 29px INSIDE stroke */}
      {ring === "story" ? (
        <BadgeRingIcon className="absolute left-[7.54%] top-[12.82%] h-[87.18%] w-[84.53%]" />
      ) : null}

      {/*
        Circle centred on the ring at (168.36, 168.1) with r=150. The path starts
        at the leftmost point and sweeps clockwise, so the top of the circle sits
        at 25% along it — hence startOffset 25% with a middle anchor.
      */}
      <svg viewBox="0 0 338 298" className="absolute inset-0 h-full w-full" aria-hidden>
        <defs>
          <path
            id={arcId}
            fill="none"
            d="M 18.36,168.1 a 150,150 0 0,1 300,0 a 150,150 0 0,1 -300,0"
          />
          {ring === "footer" ? (
            <linearGradient id={ringId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0.2495" stopColor="#c7ff3d" />
              <stop offset="0.82" stopColor="#a8e02c" />
            </linearGradient>
          ) : null}
        </defs>

        {/*
          Same ellipse the exported ring traces — 285.72x259.79 at (25.5, 38.2),
          drawn as a centre-line stroke so the 29px sits inside the outer edge.
        */}
        {ring === "footer" ? (
          <ellipse
            cx="168.36"
            cy="168.1"
            rx="128.36"
            ry="115.4"
            fill="none"
            stroke={`url(#${ringId})`}
            strokeWidth="29"
          />
        ) : null}

        <text className="fill-white font-sans" fontSize="21.9" fontWeight="700">
          <textPath href={`#${arcId}`} startOffset="25%" textAnchor="middle">
            {caption}
          </textPath>
        </text>
      </svg>

      {/* 97:1117 — the mark, optically centred in the ring */}
      {logo ? (
        /*
          Sized as a box rather than a square so both shapes of upload work:
          `object-contain` fills the width for a wide wordmark and the height
          for a square mark, and never crops either. 46%x30% of the badge is
          the largest such box that still clears the ring's inner edge at the
          corners, given the mark sits slightly above the ring's centre.
        */
        <Image
          src={logo}
          alt={brandName}
          width={220}
          height={110}
          className="absolute left-1/2 top-1/2 h-[30%] w-[46%] -translate-x-1/2 -translate-y-1/2 object-contain"
        />
      ) : (
        <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-[30px] font-bold leading-[54.9px] tracking-[7.6px] text-white sm:text-[38px]">
          {brandName}
        </span>
      )}
    </div>
  );
}

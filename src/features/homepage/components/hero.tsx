import Image from "next/image";
import Link from "next/link";

import type { CtaLink, HeroContent } from "@/lib/types/content-types";

/**
 * Hero section.
 *
 * Content comes from the Django backend (`sections.HeroSection`) via
 * `lib/content.ts`; the geometry below is still the design's and stays here.
 *
 * Cloned from Figma "Landing Page Salon (Community)"
 * `zm0j05f39X27Tb9CLG73LT`, group `3:202` — a 1440x831 band. Coordinates below
 * are relative to that frame (the file stores it at origin 1253,-2589):
 *
 *   3:203  Rectangle 1   0,0     1440x831  #000000 under an IMAGE fill (FILL)
 *   3:209  eyebrow       115,342 155x17    Jost 400 16/17.04    #fbb034
 *   3:208  headline      115,381 513x90    Poppins 700 48/45.36 #ffffff
 *   3:214  body          115,493 389x66    Poppins 400 21/22.365 #9a9a9a
 *   3:216  Book Now      115,639 182x52    fill #fbb034
 *   3:211  All Services  337,639 182x53    1px inside stroke #ffffff
 *   3:215  image 2       720,206 720x625   IMAGE fill (FILL)
 *   3:217  logo mark     870,729 47x42     IMAGE fill + two dark tints
 *
 * The nav lives in `LandingNav`; it is part of the same Figma group.
 *
 * Laid out in flow rather than pinned to absolute coordinates, so it degrades
 * below the 1440 design width. The vertical rhythm falls out exactly:
 * header 105 + 237 + (17 + 22 + 90 + 22 + 66 + 80 + 52) + 139 = 831.
 *
 * That 831 is the *proportion*, not the height: from xl up the band is exactly
 * one viewport tall (`xl:h-svh`) so the whole hero reads in a single screen,
 * and the interior scales into it — the copy centres in the space under the
 * nav, and the photo is sized from its top edge so it can never outgrow the
 * band. At a viewport of exactly 831 every element lands back on its measured
 * Figma coordinate. `svh`, not `vh`: `100vh` measures the viewport with mobile
 * browser chrome retracted, which puts the bottom of the hero under the URL bar
 * on load.
 *
 * `xl:min-h-[600px]` is a floor for very short windows — below it the copy
 * would start colliding with the nav, so the page scrolls instead. Below xl the
 * band is only floored at one viewport (`min-h-svh`), not pinned to it, so a
 * headline that wraps to more lines lengthens the band instead of being clipped.
 *
 * The file has no frame under 1440. From `md` (768) up the two-column
 * composition holds: copy left, photo right, on one horizontal axis.
 *
 * Below `md` the row wraps and the photo drops *below* the copy, flush to the
 * right (`ml-auto`). No `order-*` on either child: source order is copy then
 * photo, which is already what both layouts want, so the wrapped stack and the
 * two-column row read the same top-to-bottom.
 *
 * Stacking the photo below the copy failed once before — a full-width box on a
 * 720/625 ratio is 955px tall in a 1100px window, so it landed a screen and a
 * half below the fold and read as missing. Two things keep that from
 * recurring: the stack only engages under 768 (not at 1100), and the photo is
 * capped at `max-w-[420px]`, which holds its height to ~365px whatever the
 * viewport.
 *
 * That cap is a width cap, deliberately, not a height cap or a changed
 * `aspect-ratio`: `CapeWatermark` is positioned in percentages of this box, so
 * the 720/625 ratio has to survive at every breakpoint or the mark slides off
 * the cape.
 *
 * Holding two columns on a phone costs the copy its width, so the three text
 * sizes go fluid with `clamp()` between a phone floor and the measured Figma
 * value, which they reach just before xl restates that value exactly.
 *
 * Horizontal gutters are the design values as percentages of 1440 (115 ->
 * 7.99%, 90 -> 6.25%), and the photo is half the frame width, so the whole
 * composition scales instead of overflowing between 1280 and 1440.
 */

/**
 * Figma 3:216 and 3:211 — same box, filled vs outlined, 40px apart.
 *
 * The geometry is the Figma's; the colours are not. The comp fills the primary
 * with #fbb034 and strokes the secondary in #ffffff, but every other call to
 * action on the site — the header, the footer, the booking flow — is set in
 * `accent`, the theme green. Two gold buttons at the top of the page were the
 * only thing left disagreeing with that, so they follow the theme rather than
 * the comp. The filled/outlined pairing the design established is kept.
 *
 * `max-w-full` on each button because the 182px box is wider than the copy
 * column on a small phone; without it the pair would push the column past its
 * share of the row and shove the photo off the right edge.
 */
function HeroActions({
  primary,
  secondary,
  content,
}: {
  primary: CtaLink;
  secondary: CtaLink;
  content: HeroContent;
}) {
  return (
    <div className="mt-10 flex max-w-full flex-wrap items-center gap-x-[40px] gap-y-4 xl:mt-[80px]">
      <Link
        href={primary.href}
        style={{
          backgroundColor: content.primaryButtonBg,
          color: content.primaryButtonText,
        }}
        className="flex h-[52px] w-[182px] max-w-full items-center justify-center text-[15px] leading-[15.975px] font-bold transition-opacity hover:opacity-90"
      >
        {primary.label}
      </Link>
      <Link
        href={secondary.href}
        /*
          Hover fills the button and flips the label to the dark text colour.
          The colours are only known at runtime, so they arrive as custom
          properties and every rule that uses them is a class.

          The variables carry the *values*; they are never applied inline as
          `color` or `borderColor`. An inline declaration beats any class
          selector, `:hover` included — which is exactly what went wrong here
          before: the label kept its green inline colour on hover and turned
          green-on-green, i.e. invisible.
        */
        style={
          {
            "--btn": content.secondaryButtonColor,
            "--btn-fg": content.primaryButtonText,
          } as React.CSSProperties
        }
        className="flex h-[52px] w-[182px] max-w-full items-center justify-center border border-[var(--btn)] text-[15px] leading-[15.975px] font-bold text-[var(--btn)] transition-colors hover:bg-[var(--btn)] hover:text-[var(--btn-fg)]"
      >
        {secondary.label}
      </Link>
    </div>
  );
}

/**
 * Figma 3:217 — a small logo watermark sitting on the client's cape, at
 * 150,523 within the photo. Positioned in percentages of the photo box so it
 * tracks the image as it scales. Figma paints fills bottom-first, so the two
 * translucent greys stack *over* the artwork, not under it.
 */
function CapeWatermark({ src }: { src: string }) {
  // Emptied in the admin — the cape simply carries no mark.
  if (!src) return null;

  return (
    <div
      aria-hidden
      className="pointer-events-none absolute top-[83.68%] left-[20.833%] w-[6.528%]"
    >
      <Image
        src={src}
        alt=""
        width={47}
        height={42}
        sizes="(min-width: 1280px) 4vw, 7vw"
        className="h-auto w-full"
      />
      <div className="bg-mark-shade absolute inset-0" />
      <div className="bg-mark-shade-soft absolute inset-0" />
    </div>
  );
}

export function Hero({ content }: { content: HeroContent }) {
  return (
    <section style={{ backgroundColor: content.backgroundColor }}
      className="font-brand relative flex min-h-svh w-full flex-col overflow-hidden xl:h-svh xl:min-h-[600px]">
      {/* Figma 3:203 — scratched-plaster photo over solid black. The photo is
          opaque, so the black only shows through if it fails to load. Without
          it the section's own black stands in, which is why this can be
          dropped entirely rather than needing a placeholder. */}
      {content.backgroundImage ? (
        <Image
          src={content.backgroundImage}
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
      ) : null}

      <div className="relative mx-auto flex min-h-0 w-full max-w-[1440px] flex-1 flex-col">
        {/*
          The nav used to sit here in flow (`LandingNav`). It has been replaced
          by the kinetic header ported from the devis-gym demo, which paints
          over this band from app/layout.tsx rather than inside it — so all that
          is left here is the height it occupied. The 105 the vertical rhythm
          documented above is measured against, and the 74 below xl, are now the
          *floor* inside `--header-height` rather than the whole story: the logo
          is sized in the admin, and a tall one makes the bar deeper than either
          number. Reserving the variable is what stops it landing on the
          headline.
        */}
        <div aria-hidden className="h-[var(--header-height)] shrink-0" />

        {/*
          Copy and photo share one row below xl. At xl the wrapper goes
          `display:contents` and vanishes from the box tree, handing both
          children straight back to the outer column — which is what the desktop
          layout below is measured against, and what lets the photo resolve its
          `absolute` against the 1440 frame rather than against this wrapper.

          `flex-1` on the copy therefore means width in the row and height in the
          column; `min-h-0` and `min-w-0` are both spelled out for that reason.
          Default `items-stretch` gives the copy the full row height to centre
          itself in, and the photo opts out with `self-end`.
        */}
        <div className="flex min-h-0 flex-1 flex-wrap content-center xl:contents">
          {/*
            Centred in whatever height is left under the nav, rather than pushed
            down by the literal 237px — which is what overflowed the fold.

            Biased downward by a top pad rather than centred flush.
            `justify-center` absorbs the padding out of the free space, so a 97px
            pad moves the copy down by half of it: at a band of exactly 831 it
            lands back on its measured y of 342 (nav 105 + 97 pad + half of the
            280 left over = 237). Flush centring sat at 293, a touch high under
            the nav.

            97 is also small enough to survive the 600px floor — at that height
            the block still clears the nav with ~25px of air left under it.

            `px-6` doubles as the gutter between the two columns: its right half
            is the only thing separating the copy from the photo below xl.
          */}
          <div className="flex w-full min-h-0 min-w-0 flex-col justify-center px-6 pt-8 pb-4 sm:px-10 md:w-auto md:flex-1 md:pt-16 xl:px-0 xl:pt-[97px] xl:pb-0 xl:pl-[7.99%]">
            {/* Figma 3:209 — the one line of Jost in an otherwise Poppins design. */}
            <p style={{ color: content.eyebrowColor }}
              className="font-sans text-[clamp(12px,2.6vw,16px)] leading-[1.065] xl:text-[16px] xl:leading-[17.04px]">
              {content.eyebrow}
            </p>

            {/*
              Figma 3:208 breaks the line explicitly after "For A". Rendered as
              two spans rather than a <br>, so the break applies only at the
              measured width and the headline reflows naturally below it. The
              two lines are separate fields in the admin for the same reason —
              where the break falls is a design decision, not a wrap.

              4.4vw reaches the measured 48px at ~1090 and is capped there, so it
              is already sitting on the design value when xl restates it exactly.
            */}
            <h1 style={{ color: content.headingColor }}
              className="mt-[22px] max-w-[513px] text-[clamp(22px,4.4vw,48px)] leading-[1.05] font-bold xl:text-[48px] xl:leading-[45.36px]">
              <span className="xl:block">{content.headlineLine1} </span>
              <span className="xl:block">{content.headlineLine2}</span>
            </h1>

            {/* Figma 3:214 — 21/22.365 is a 1.065 ratio, far too tight to read at
                phone widths, so the leading opens up below xl. */}
            <p style={{ color: content.bodyColor }}
              className="mt-[22px] max-w-[389px] text-[clamp(13px,2vw,21px)] leading-[1.6] xl:text-[21px] xl:leading-[22.365px]">
              {content.body}
            </p>

            <HeroActions
              primary={content.primaryCta}
              secondary={content.secondaryCta}
              content={content}
            />
          </div>

          {/*
            Figma 3:215 — flush to the frame's right and bottom edges. Absolute
            at xl so it can bleed to the bottom of the band; the right-hand
            column of the row below that. `object-contain` because the source is
            a transparent cutout whose aspect (990x859) already matches the
            720x625 box.

            Below xl it is sized off its own width and pinned to the foot of the
            row, so it always sits on the same horizontal axis as the copy. It
            takes a rising share of the row as there is more width to give it —
            720/1440 is half the frame at the design size, and anything near that
            on a phone would leave the headline nothing to wrap in.

            `shrink-0` is load-bearing: this box's only child is a `fill` image,
            which is absolutely positioned, so the box has no in-flow content and
            its automatic minimum size is zero. A shrinkable flex item with a
            zero min-content size collapses to nothing under pressure and takes
            the photo with it.

            At xl it is driven by height (625/831 = 75.21% of the band) rather
            than by width, so it can never outgrow the band it sits in, and
            capped at the measured 625 so it never grows past its design size on
            a tall window, where it would otherwise reach left across the
            headline.

            Both axes are spelled out in `svh` instead of letting `aspect-ratio`
            derive the width: the band is 100svh at xl, so 75.21svh is the same
            height, and 86.64svh is that height through the 720/625 ratio. An
            absolutely positioned box with `w-auto` cannot be trusted to take its
            width from the ratio — same zero-content problem as above, which
            collapses it horizontally instead. The two maxes cap together (both
            bite at exactly 831px of viewport), so the box stays on ratio at
            every size — which the watermark depends on, being positioned in
            percentages of this box.
          */}
          <div className="relative mr-0 ml-auto aspect-[720/625] w-full max-w-[420px] shrink-0 self-end md:mx-0 md:w-[44%] md:max-w-none lg:w-[48%] xl:absolute xl:right-0 xl:bottom-0 xl:h-[75.21svh] xl:max-h-[625px] xl:w-[86.64svh] xl:max-w-[720px]">
            {content.stylistImage ? (
              <Image
                src={content.stylistImage}
                alt={content.stylistImageAlt}
                fill
                priority
                sizes="(min-width: 1280px) 50vw, 45vw"
                className="object-contain object-bottom"
              />
            ) : null}
            <CapeWatermark src={content.watermarkImage} />
          </div>
        </div>
      </div>
    </section>
  );
}

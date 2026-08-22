import Image from "next/image";
import Link from "next/link";

import { Reveal } from "@/components/shared/reveal";
import { StatCounter } from "@/features/about/components/stat-counter";
import type {
  AboutColumn,
  AboutContent,
  TeamMember,
} from "@/lib/types/about-types";
import { cldOptimize } from "@/lib/cloudinary";

/**
 * The About page's content, rendered on the server.
 *
 * No `"use client"` here, and that is the point. This file was previously part
 * of one 371-line client component whose only browser needs were a count-up
 * animation and a scroll reset — so roughly three hundred lines of static
 * markup were shipped to the browser, hydrated, and re-rendered for nothing.
 *
 * The two interactive pieces are now leaves: `StatCounter` and `Reveal` are
 * client components this file renders. A Server Component may render a Client
 * Component; what it must not do is the reverse by import. These sections are
 * handed to `ScrollExpansionHero` (a client component) as `children` from the
 * page, which keeps them out of its module graph and out of the bundle.
 *
 * Markup and styling are unchanged from the client version.
 */

/** One social platform's glyph. Only drawn when that link is filled in. */
const SOCIAL_ICONS: Record<string, string> = {
  facebook:
    "M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z",
  twitter:
    "M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z",
  youtube:
    "M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z",
};

export const COLUMN_HEADING_STYLE = {
  fontWeight: 700,
  fontSize: "17px",
  lineHeight: "24px",
  color: "rgb(255, 255, 255)",
} as const;

export const COLUMN_BODY_STYLE = {
  fontWeight: 500,
  fontSize: "13px",
  lineHeight: "19px",
  color: "rgb(255, 255, 255)",
} as const;

/** A column is bullets or prose — whichever the admin filled in. */
function IntroColumn({ column }: { column: AboutColumn }) {
  return (
    <div className="flex-1 space-y-4">
      <h3
        className="font-gotham font-bold uppercase tracking-wider"
        style={COLUMN_HEADING_STYLE}
      >
        {column.heading}
      </h3>

      {column.items.length > 0 && (
        <ul className="space-y-3">
          {column.items.map((item) => (
            <li key={item.id} className="flex items-center gap-3">
              <span className="w-2 h-2 bg-accent rounded-full"></span>
              <span className="font-gotham" style={COLUMN_BODY_STYLE}>
                {item.text}
              </span>
            </li>
          ))}
        </ul>
      )}

      {/* A blank line in the admin starts a new paragraph. */}
      {column.body
        .split(/\n\s*\n/)
        .map((paragraph) => paragraph.trim())
        .filter(Boolean)
        .map((paragraph, index) => (
          <p key={index} className="font-gotham" style={COLUMN_BODY_STYLE}>
            {paragraph}
          </p>
        ))}
    </div>
  );
}

function TeamCard({ member }: { member: TeamMember }) {
  const socials = Object.entries(member.social).filter(
    ([platform, url]) => url && SOCIAL_ICONS[platform]
  );

  return (
    <article className="group">
      <figure className="relative h-[360px] w-full max-w-[285px] mx-auto overflow-hidden bg-background-elevated">
        <Image
          src={cldOptimize(member.image, 600)}
          alt={member.name}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-110"
          sizes="285px"
          loading="lazy"
          quality={75}
        />

        {/* Hidden entirely when nobody has added links for this person, rather
            than sliding up an empty yellow bar on hover. */}
        {socials.length > 0 && (
          <nav className="absolute bottom-0 left-0 right-0 bg-[#d4ff00] py-3 px-6 flex gap-3 justify-center translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out" aria-label={`${member.name} social links`}>
            {socials.map(([platform, url]) => (
              <a
                key={platform}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`${member.name} on ${platform}`}
                className="w-6 h-6 rounded-full bg-black/10 hover:bg-black/20 flex items-center justify-center transition-colors cursor-pointer"
              >
                <svg
                  className="w-3 h-3 text-black"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path d={SOCIAL_ICONS[platform]} />
                </svg>
              </a>
            ))}
          </nav>
        )}
      </figure>

      <div className="bg-background-elevated py-6 px-6 w-full max-w-[285px] mx-auto">
        <h3 className="font-oswald text-[24px] leading-[32px] font-bold uppercase tracking-tight mb-1 text-white">
          {member.name}
        </h3>
        <p className="text-accent text-xs uppercase tracking-wide font-bold">
          {member.role}
        </p>
      </div>
    </article>
  );
}

/**
 * The heading, intro copy and columns that sit inside the expanding hero.
 *
 * Separate from `AboutContentSections` below because the hero renders them in
 * different places: this block sits inside the expanded media frame, the
 * sections follow it.
 */
export function AboutIntro({ about }: { about: AboutContent }) {
  return (
    <header className="max-w-7xl mx-auto">
      <div className="text-center mb-16">
        <p
          className="font-gotham font-bold uppercase tracking-wider mb-1 lg:mb-1"
          style={COLUMN_HEADING_STYLE}
        >
          {about.eyebrow}
        </p>

        <h1
          className="font-gotham-condensed font-bold uppercase leading-[0.9] tracking-tight relative mb-3 lg:mb-4"
          style={{
            fontSize: "81px",
            lineHeight: "81px",
            fontWeight: 700,
            color: "rgb(255, 255, 255)",
          }}
        >
          <span className="block" style={{ color: "rgb(255, 255, 255)" }}>
            {about.headingLine1}
          </span>
          <span className="block" style={{ color: "#c7ff3d" }}>
            {about.headingLine2}
          </span>
        </h1>

        <p className="font-gotham max-w-4xl mx-auto" style={COLUMN_BODY_STYLE}>
          {about.introBody}
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-8 items-start">
        {about.columns.map((column) => (
          <IntroColumn key={column.id} column={column} />
        ))}
      </div>
    </header>
  );
}

export function AboutContentSections({ about }: { about: AboutContent }) {
  return (
    <div className="bg-background">
      {/* Stats Section - Above Team Section */}
      <section className="bg-background">
        <div className="container-edge py-16 md:py-20">
          <Reveal>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-7xl mx-auto">
              {about.stats.map((stat) => (
                <StatCounter key={stat.id} stat={stat} />
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* Team Section */}
      <section className="bg-background">
        <div className="container-edge py-16 md:py-20">
          <Reveal>
            <div className="text-center mb-12">
              <h2 className="font-oswald text-[48px] leading-[56px] font-bold uppercase tracking-tight mb-6 text-white">
                {about.teamHeading}
              </h2>
              <p className="text-muted leading-relaxed max-w-2xl mx-auto">
                {about.teamBody}
              </p>
            </div>
          </Reveal>

          <Reveal>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-5 max-w-7xl mx-auto">
              {about.team.map((member) => (
                <TeamCard key={member.id} member={member} />
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* CTA Section - Full Width */}
      <section className="w-full bg-background-elevated">
        <div className="container-edge py-16 md:py-20">
          <Reveal>
            <div className="max-w-3xl mx-auto text-center">
              <h2 className="font-oswald text-[48px] leading-[56px] md:text-[64px] md:leading-[72px] font-bold uppercase tracking-tight mb-6 text-white">
                {about.ctaHeadingLead}{" "}
                <span className="text-accent">{about.ctaHeadingAccent}</span>
              </h2>
              <p className="text-muted text-base leading-relaxed mb-8">
                {about.ctaBody}
              </p>
              <div className="flex justify-center">
                <Link
                  href={about.ctaPrimary.href}
                  className="inline-block px-8 py-4 bg-accent text-black font-bold uppercase tracking-wide rounded-none hover:bg-accent/90 transition-colors"
                >
                  {about.ctaPrimary.label}
                </Link>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/*
        An Instagram band stood here. It rendered seven hardcoded photographs
        from another business's Cloudinary account with invented like and
        comment counts, every one linking to that business's Instagram profile
        -- see the removed `components/instagram-feed.tsx`.

        Removed rather than repointed because there is nothing truthful to put
        in it: `instagramHandle` is the only Instagram field the CMS has, and a
        handle is not a feed. Restoring this band needs a real source first --
        either a model the salon fills in, or Instagram's Basic Display API --
        at which point the markup belongs here again.
      */}
    </div>
  );
}

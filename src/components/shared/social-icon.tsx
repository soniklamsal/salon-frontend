import { FacebookIcon, InstagramIcon } from "@/components/shared/story-art";
import type { SocialLink, SocialPlatform } from "@/lib/types/content-types";

/**
 * Renders one social link with its drawn icon.
 *
 * Only Facebook and Instagram have artwork in the design (Figma 97:1152), and
 * those two are exported from `story-art.tsx`. The admin can add TikTok,
 * YouTube or X, so those fall back to a small wordmark set in the same pill —
 * a missing icon should not mean a missing link.
 */

const ICONS: Partial<
  Record<SocialPlatform, ({ className }: { className?: string }) => React.ReactElement>
> = {
  facebook: FacebookIcon,
  instagram: InstagramIcon,
};

const SHORT_LABELS: Record<SocialPlatform, string> = {
  facebook: "Facebook",
  instagram: "Instagram",
  tiktok: "TikTok",
  youtube: "YouTube",
  x: "X",
};

export function SocialIconLink({
  link,
  compact = false,
}: {
  link: SocialLink;
  /** Header sizing: the 32px glyph is too heavy next to 18px nav text. */
  compact?: boolean;
}) {
  const Icon = ICONS[link.platform];

  return (
    <a
      href={link.url}
      aria-label={link.label}
      rel="noopener noreferrer"
      target="_blank"
      // `accent` is the theme green (#c7ff3d). The glyphs draw in
      // `currentColor`, so this one class colours them.
      className="text-accent transition-opacity hover:opacity-70"
    >
      {Icon ? (
        <Icon className={compact ? "h-6 w-6" : undefined} />
      ) : (
        <span
          className={`flex items-center justify-center rounded-full border border-accent font-bold ${
            compact
              ? "h-6 px-2 text-[11px]"
              : "h-[42px] px-4 text-[14px]"
          }`}
        >
          {SHORT_LABELS[link.platform]}
        </span>
      )}
    </a>
  );
}

export function SocialIconRow({
  links,
  compact = false,
}: {
  links: SocialLink[];
  compact?: boolean;
}) {
  if (links.length === 0) return null;

  return (
    <div className={`flex items-center ${compact ? "gap-3" : "gap-[15px]"}`}>
      {links.map((link) => (
        <SocialIconLink key={link.id} link={link} compact={compact} />
      ))}
    </div>
  );
}

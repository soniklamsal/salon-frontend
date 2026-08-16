/**
 * Ported from the devis-gym demo (`lib/cloudinary.ts`).
 *
 * Rewrites a Cloudinary URL to ask for an auto-format, auto-quality,
 * width-capped derivative instead of the untouched original. The source photos
 * are multi-megabyte originals, and Next's optimizer fetches the full file from
 * the origin before it resizes anything — so capping the width in the URL is
 * what keeps that fetch small.
 */
export function cldOptimize(url: string, width = 800): string {
  if (!url.includes("res.cloudinary.com") || !url.includes("/upload/")) return url;
  return url.replace("/upload/", `/upload/f_auto,q_auto,w_${width}/`);
}

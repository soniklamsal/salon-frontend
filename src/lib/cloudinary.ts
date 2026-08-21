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

/**
 * The same idea for video, and it matters far more here than it does for a
 * photo.
 *
 * A clip pasted into the admin is whatever came off a phone or a stock site.
 * The one currently on the site is 2160×4096 at 25fps and **54.5MB**, and it
 * was being served untouched into a 300px grid tile — every visitor, on every
 * load, on any connection. Asking Cloudinary for a width-capped derivative
 * takes that to 2.4MB, a 96% cut, for a tile that physically cannot show the
 * difference.
 *
 * `c_limit` and not a plain `w_`: limit only ever scales *down*. A clip that
 * arrives smaller than the cap is left alone rather than being upscaled into
 * a bigger file than the original.
 *
 * Returns the URL untouched when it is not Cloudinary's — a direct .mp4 on
 * someone else's server has no equivalent, and there is nothing to be done
 * about its size from here.
 */
export function cldVideo(url: string, width: number): string {
  if (!url.includes("res.cloudinary.com") || !url.includes("/upload/")) return url;
  return url.replace("/upload/", `/upload/f_auto,q_auto,w_${width},c_limit/`);
}

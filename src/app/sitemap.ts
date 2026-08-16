import type { MetadataRoute } from "next";

import { absoluteUrl, PUBLIC_ROUTES, warnIfUnconfigured } from "@/lib/seo/site";

/**
 * The sitemap, served at /sitemap.xml.
 *
 * Only the three public routes are listed. `/services` and `/status` are behind
 * an account and `/sign-in` and `/sign-up` are plumbing, so none of them are
 * pages a search engine should be indexing — see `PUBLIC_ROUTES`.
 *
 * `lastModified` is the build time rather than a per-page date: the content is
 * edited in the Django admin and this app has no per-section timestamp to read,
 * so a fabricated per-route date would be less honest than one shared date that
 * is genuinely when this deployment was built.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  warnIfUnconfigured();
  const lastModified = new Date();

  return PUBLIC_ROUTES.map((route) => ({
    // Same builder the canonical tags use, so a route cannot appear in the
    // sitemap under one URL and canonicalise to another.
    url: absoluteUrl(route),
    lastModified,
    changeFrequency: "monthly",
    // The home page is the entry point; the other two are equal to each other.
    priority: route === "/" ? 1 : 0.8,
  }));
}

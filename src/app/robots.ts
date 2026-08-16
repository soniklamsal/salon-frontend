import type { MetadataRoute } from "next";

import { absoluteUrl, warnIfUnconfigured } from "@/lib/seo/site";

/**
 * robots.txt.
 *
 * The disallowed paths are the ones that need an account or are auth plumbing.
 * They are already unreachable without a session — `proxy.ts` redirects and
 * each page checks `auth()` for itself — so this is not what protects them. It
 * keeps them out of the index, which is a separate problem: a crawler that
 * follows a link to /status gets a redirect to a sign-in page, and a sign-in
 * page indexed under the salon's name is just a bad search result.
 */
export default function robots(): MetadataRoute.Robots {
  warnIfUnconfigured();

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/services", "/status", "/sign-in", "/sign-up"],
    },
    sitemap: absoluteUrl("/sitemap.xml"),
  };
}

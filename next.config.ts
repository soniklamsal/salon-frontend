import type { NextConfig } from "next";

/**
 * Images now come from four places, so all four have to be allowed:
 *   - `public/` (the seeded defaults) — no config needed;
 *   - Cloudinary, still hosting the Classes cards ported from devis-gym;
 *   - the Django backend's own `/media/`, for anything uploaded in the admin;
 *   - Google, for the avatar of a signed-in customer.
 *
 * The last one is derived from NEXT_PUBLIC_SALON_API_URL rather than hardcoded, so pointing
 * the app at a deployed backend does not also require editing this file.
 */
const apiUrl = new URL(
  process.env.NEXT_PUBLIC_SALON_API_URL ?? "http://localhost:8000/api/v1"
);

/**
 * Next 16 refuses to optimise an image whose host resolves to a loopback or
 * private address — an SSRF guard, since the optimiser would otherwise fetch
 * any internal URL a page asked it to. In development the Django backend *is*
 * on 127.0.0.1, so every admin-uploaded image (barber photos, the eSewa QR)
 * fails with "url parameter is not allowed" until the guard is waived.
 *
 * Waived only when the configured backend is itself local. Point NEXT_PUBLIC_SALON_API_URL
 * at a deployed backend and the guard comes straight back on, which is where
 * it matters.
 */
const isLocalApi = ["localhost", "127.0.0.1", "[::1]", "::1"].includes(
  apiUrl.hostname
);

const nextConfig: NextConfig = {
  images: {
    dangerouslyAllowLocalIP: isLocalApi,
    qualities: [75, 90],
    remotePatterns: [
      { protocol: "https", hostname: "res.cloudinary.com" },
      {
        // Google account avatars, shown in the header once signed in. Google
        // serves them from a numbered subdomain (lh3, lh4, ...), so the
        // wildcard is the host pattern rather than a guess at one of them.
        protocol: "https",
        hostname: "*.googleusercontent.com",
        pathname: "/**",
      },
      {
        protocol: apiUrl.protocol === "https:" ? "https" : "http",
        hostname: apiUrl.hostname,
        // `URL.port` is "" for default ports, which is what this field wants.
        port: apiUrl.port,
        pathname: "/media/**",
      },
      {
        // Payment screenshots. They are no longer under /media/ — they live in
        // private storage and come through an endpoint that checks a signed
        // token first, so the optimiser has to be allowed to fetch that path.
        protocol: apiUrl.protocol === "https:" ? "https" : "http",
        hostname: apiUrl.hostname,
        port: apiUrl.port,
        pathname: "/api/v1/bookings/**",
      },
    ],
  },
};

export default nextConfig;

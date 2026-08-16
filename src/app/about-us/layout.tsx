import type { Metadata } from "next";
import { Oswald } from "next/font/google";

import { canonicalMetadata } from "@/lib/seo/site";


/**
 * Route shell for About Us.
 *
 * Two jobs. It loads Oswald — the demo's about page sets its display type in
 * it — here rather than in the root layout, so no other route pays for the
 * font, and puts `--font-oswald` on a wrapper so the `.font-oswald` /
 * `.font-gotham-condensed` rules in globals.css resolve inside this subtree
 * only. It used to render the footer too; that now lives in the root layout,
 * so every route shares one.
 *
 * `contents` keeps the wrapper out of the box tree, so <main> stays a direct
 * flex child of <body> exactly as it is on the home page.
 */
const oswald = Oswald({
  variable: "--font-oswald",
  subsets: ["latin"],
  weight: ["400", "700"],
});

export const metadata: Metadata = {
  // Bare, not "About Us — Salon": the root layout's title template appends
  // "· <brand>", so carrying the brand here too rendered "About Us — Salon ·
  // SALON". /contact has always done this correctly.
  title: "About Us",
  description:
    "More than just a salon. Our chairs, our craft, our story and the team behind them.",
  // Its own canonical and og:url. Without these both are inherited from the
  // root layout, which declares "/" — telling every crawler this page is a
  // duplicate of the homepage.
  ...canonicalMetadata("/about-us"),
};

export default function AboutUsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className={`${oswald.variable} contents`}>{children}</div>;
}

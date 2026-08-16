import { describe, expect, it } from "vitest";

import {
  buildOpeningHours,
  buildPostalAddress,
  buildSameAs,
} from "@/lib/seo/structured-data";
import type { ContactColumn, SiteContent } from "@/lib/types/content-types";

/**
 * These builders make claims to a search engine on the salon's behalf, from
 * free text an editor typed into a CMS box. The rule they exist to hold is that
 * a line they cannot read confidently produces *nothing* — never a guess.
 *
 * Wrong opening hours are worse than absent ones: a customer who turns up to a
 * closed salon because Google said it was open blames the salon, not the parser.
 */

function columns(partial: Partial<Record<string, string[]>>): ContactColumn[] {
  return Object.entries(partial).map(([heading, lines], id) => ({
    id,
    heading,
    icon: "pin",
    lines: lines ?? [],
    order: id,
  })) as ContactColumn[];
}

describe("buildPostalAddress", () => {
  it("reads the seeded Location column", () => {
    expect(buildPostalAddress(columns({ Location: ["Thamel,", "Kathmandu", "Nepal"] })))
      .toEqual({
        "@type": "PostalAddress",
        streetAddress: "Thamel",
        addressLocality: "Kathmandu",
        addressCountry: "Nepal",
      });
  });

  it("matches the heading case-insensitively, as the contact page does", () => {
    expect(buildPostalAddress(columns({ LOCATION: ["Kathmandu", "Nepal"] }))).not.toBeNull();
  });

  it("omits streetAddress when only city and country are given", () => {
    expect(buildPostalAddress(columns({ Location: ["Kathmandu", "Nepal"] }))).toEqual({
      "@type": "PostalAddress",
      addressLocality: "Kathmandu",
      addressCountry: "Nepal",
    });
  });

  it("returns null rather than guessing from a single line", () => {
    expect(buildPostalAddress(columns({ Location: ["Nepal"] }))).toBeNull();
  });

  it("returns null when there is no Location column at all", () => {
    expect(buildPostalAddress(columns({ Hours: ["Mon: 9:00 am — 5:00 pm"] }))).toBeNull();
  });
});

describe("buildOpeningHours", () => {
  it("reads the seeded Hours column, ranges and single days alike", () => {
    const spec = buildOpeningHours(
      columns({
        Hours: [
          "Mon to Fri: 7:30 am — 1:00 am",
          "Sat: 9:00 am — 1:00 am",
          "Sun: 9:00 am — 11:30 pm",
        ],
      })
    );

    expect(spec).toEqual([
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
        opens: "07:30",
        closes: "01:00",
      },
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: ["Saturday"],
        opens: "09:00",
        closes: "01:00",
      },
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: ["Sunday"],
        opens: "09:00",
        closes: "23:30",
      },
    ]);
  });

  it("accepts a plain hyphen as well as an em dash", () => {
    const spec = buildOpeningHours(columns({ Hours: ["Mon - Wed: 9 am - 5 pm"] }));
    expect(spec?.[0]).toMatchObject({ opens: "09:00", closes: "17:00" });
  });

  it("converts noon and midnight the way a clock does", () => {
    const spec = buildOpeningHours(columns({ Hours: ["Mon: 12:00 am — 12:00 pm"] }));
    expect(spec?.[0]).toMatchObject({ opens: "00:00", closes: "12:00" });
  });

  it("discards the whole week when one line is unreadable", () => {
    // A partial week is a worse answer than no answer: it would tell a crawler
    // the salon is shut on the days it failed to parse.
    expect(
      buildOpeningHours(
        columns({ Hours: ["Mon to Fri: 7:30 am — 1:00 am", "Sat: by appointment"] })
      )
    ).toBeNull();
  });

  it("rejects a backwards day range", () => {
    expect(buildOpeningHours(columns({ Hours: ["Fri to Mon: 9 am — 5 pm"] }))).toBeNull();
  });

  it("rejects a time it cannot read", () => {
    expect(buildOpeningHours(columns({ Hours: ["Mon: 25:00 am — 5 pm"] }))).toBeNull();
  });

  it("returns null for an empty column", () => {
    expect(buildOpeningHours(columns({ Hours: [] }))).toBeNull();
  });
});

describe("buildSameAs", () => {
  function withSocial(urls: string[]) {
    return {
      socialLinks: urls.map((url, id) => ({ id, platform: "facebook", url, label: "", order: id })),
    } as unknown as SiteContent;
  }

  it("drops bare origins, which are unfilled placeholders", () => {
    // The seeded rows are literally these. Publishing them would claim
    // facebook.com itself is the salon's profile.
    expect(buildSameAs(withSocial(["https://facebook.com", "https://instagram.com/"]))).toEqual([]);
  });

  it("keeps a real profile URL", () => {
    expect(buildSameAs(withSocial(["https://instagram.com/beautysalon_kathmandu"]))).toEqual([
      "https://instagram.com/beautysalon_kathmandu",
    ]);
  });

  it("drops anything that is not a URL", () => {
    expect(buildSameAs(withSocial(["", "not a url"]))).toEqual([]);
  });
});

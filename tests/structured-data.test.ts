import { describe, expect, it } from "vitest";

import { buildSameAs } from "@/lib/seo/structured-data";
import type { SiteContent } from "@/lib/types/content-types";

/**
 * `buildSameAs` makes a claim to a search engine on the salon's behalf, from
 * free text an editor typed into a CMS box. The rule it exists to hold is that
 * a value it cannot read confidently produces *nothing* — never a guess.
 *
 * `buildPostalAddress` and `buildOpeningHours` were tested here too, until the
 * `sections.ContactColumn` model they read was removed from the CMS. Nothing
 * replaced it, so the salon's JSON-LD no longer states an address or opening
 * hours at all. If a field for either comes back, the rule those tests enforced
 * is the one to bring back with it: wrong opening hours are worse than absent
 * ones, because a customer who turns up to a closed salon on Google's word
 * blames the salon, not the parser.
 */

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

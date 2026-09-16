import { describe, expect, it } from "vitest";

import { phoneNumbers, telHref } from "@/lib/phone";

/**
 * The salon publishes two numbers in one CMS field, and both places that
 * rendered them got this wrong the same way: they interpolated the whole
 * field into a single `tel:`. A comma in a `tel:` URI is a dial *pause*, so
 * `tel:9705779552,9841141439` does not offer a choice — it dials the first
 * number and then sends the second as touch tones into the live call.
 *
 * That is why the rule lives in one function, and why it is tested.
 */
describe("phoneNumbers", () => {
  it("splits the salon's two published numbers", () => {
    expect(phoneNumbers("9705779552, 9841141439")).toEqual([
      "9705779552",
      "9841141439",
    ]);
  });

  it("leaves a single number alone", () => {
    expect(phoneNumbers("9705779552")).toEqual(["9705779552"]);
  });

  it("survives the ways a person types a list", () => {
    // No space after the comma, a stray trailing one, padding around the whole
    // field — all things staff reasonably type into an admin text box.
    expect(phoneNumbers(" 9705779552,9841141439, ")).toEqual([
      "9705779552",
      "9841141439",
    ]);
  });

  it("yields nothing for an empty field, rather than one empty entry", () => {
    // `"".split(",")` is `[""]`, which would render a link to `tel:`.
    expect(phoneNumbers("")).toEqual([]);
    expect(phoneNumbers("  ")).toEqual([]);
  });
});

describe("telHref", () => {
  it("strips spaces so the dialler gets one token", () => {
    expect(telHref("970 577 9552")).toBe("tel:9705779552");
  });

  it("never emits a comma, whatever it is handed", () => {
    // The regression this whole module exists to prevent: one href must carry
    // exactly one number.
    for (const number of phoneNumbers("9705779552, 9841141439")) {
      expect(telHref(number)).not.toContain(",");
    }
  });
});

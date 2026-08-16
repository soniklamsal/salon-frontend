import { describe, expect, it } from "vitest";

import { depositFor } from "@/lib/api/booking";

/**
 * The deposit arithmetic decides the number a customer is told to transfer over
 * eSewa. It is the one calculation on the site where being wrong costs somebody
 * money, and nothing downstream re-checks it — a human compares the uploaded
 * screenshot against what the page said.
 */
describe("depositFor", () => {
  const service = (priceFrom: string | null) => ({ priceFrom });

  it("charges the full price at 100%", () => {
    expect(depositFor(service("800.00"), 100)).toEqual({ full: 800, due: 800 });
  });

  it("takes a percentage for a partial deposit", () => {
    expect(depositFor(service("800.00"), 50)).toEqual({ full: 800, due: 400 });
  });

  it("rounds to whole rupees, because eSewa transfers are not made in paisa", () => {
    // 30% of 850 is 255 exactly; 33% is 280.5 and has to land somewhere.
    expect(depositFor(service("850.00"), 33)?.due).toBe(281);
    expect(depositFor(service("999.00"), 33)?.due).toBe(330);
  });

  it("returns null when no price is set, so the caller can say so", () => {
    // A service with no price is a real state — the UI renders "we will confirm
    // the amount" for it. It must not become Rs 0 or Rs NaN.
    expect(depositFor(service(null), 100)).toBeNull();
    expect(depositFor(service(""), 100)).toBeNull();
    expect(depositFor(null, 100)).toBeNull();
  });

  it("returns null rather than NaN when the price is not a number", () => {
    // Guards against a backend sending something unexpected in a string field.
    expect(depositFor(service("not a price"), 100)).toBeNull();
  });

  it("keeps the full price alongside the amount due", () => {
    // The UI subtracts the two to show "Rs N due at the salon", so `full` has
    // to be the price and not the deposit.
    const amount = depositFor(service("1200.00"), 25);
    expect(amount).toEqual({ full: 1200, due: 300 });
    expect(amount!.full - amount!.due).toBe(900);
  });
});

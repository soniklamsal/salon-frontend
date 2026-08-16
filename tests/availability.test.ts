import { describe, expect, it } from "vitest";

import { barberStepProblem, isBookable } from "@/lib/api/booking";
import type { Barber } from "@/lib/types/content-types";

/**
 * The barber step has three outcomes and they are easy to conflate — which is
 * exactly what happened: a single `barbers.every(b => !b.isAvailable)` told
 * customers "nobody is taking bookings" whenever the API was unreachable,
 * because `[].every(...)` is vacuously true.
 */

function barber(overrides: Partial<Barber> = {}): Barber {
  return {
    id: 1,
    name: "Ram",
    role: "",
    photo: "",
    bio: "",
    initials: "R",
    schedule: "",
    isAvailable: true,
    availabilityLabel: "Available",
    order: 0,
    ...overrides,
  };
}

describe("isBookable", () => {
  it("allows an available barber", () => {
    expect(isBookable(barber())).toBe(true);
  });

  it("blocks a barber the salon marked unavailable", () => {
    expect(isBookable(barber({ isAvailable: false }))).toBe(false);
  });

  it("allows a barber whose payload predates the field", () => {
    // A response cached before the backend learned to send `isAvailable`.
    // `!undefined` is true, which locked every barber out of a working form.
    const stale = { ...barber(), isAvailable: undefined as unknown as boolean };
    expect(isBookable(stale)).toBe(true);
  });

  it("only an explicit false blocks — not null, not empty string", () => {
    for (const value of [null, "", 0, undefined]) {
      expect(
        isBookable({ isAvailable: value as unknown as boolean })
      ).toBe(true);
    }
  });
});

describe("barberStepProblem", () => {
  it("reports nothing wrong when someone is bookable", () => {
    expect(barberStepProblem([barber()])).toBe("");
  });

  it("reports nothing wrong when only some are away", () => {
    expect(
      barberStepProblem([barber({ isAvailable: false }), barber({ id: 2 })])
    ).toBe("");
  });

  it("distinguishes an empty list from everyone being away", () => {
    // The bug: both used to say "nobody is taking bookings".
    expect(barberStepProblem([])).toBe("unloadable");
    expect(barberStepProblem([barber({ isAvailable: false })])).toBe("none-free");
  });

  it("does not claim the salon is closed when the payload lacks the field", () => {
    const stale = { ...barber(), isAvailable: undefined as unknown as boolean };
    expect(barberStepProblem([stale])).toBe("");
  });

  it("reports every barber being away", () => {
    expect(
      barberStepProblem([
        barber({ isAvailable: false }),
        barber({ id: 2, isAvailable: false }),
      ])
    ).toBe("none-free");
  });
});
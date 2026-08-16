import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  DEFAULT_BOOKING_COPY,
  EMPTY_BOOKING_CONFIG,
  getBookingConfig,
} from "@/lib/api/booking";

/**
 * `getBookingConfig()` degrades in the opposite direction to `getSiteContent()`,
 * and the difference is the point: content has a shipped copy to fall back on,
 * a barber does not.
 *
 * The rule these tests hold in place is that a failure must never invent
 * bookable data. A made-up stylist wastes someone's afternoon; a QR that is not
 * the salon's takes a real payment to the wrong account.
 */

function jsonResponse(body: unknown, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    statusText: status === 200 ? "OK" : "Error",
    json: async () => body,
  } as Response;
}

beforeEach(() => {
  vi.spyOn(console, "warn").mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("getBookingConfig", () => {
  it("invents nothing when the backend is unreachable", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValue(new Error("ECONNREFUSED"))
    );

    const config = await getBookingConfig();

    expect(config).toEqual(EMPTY_BOOKING_CONFIG);
    // Named explicitly rather than left to the object comparison above: these
    // three being empty is the safety property, and it should fail loudly and
    // specifically if anyone ever seeds them.
    expect(config.services).toEqual([]);
    expect(config.barbers).toEqual([]);
    expect(config.esewa.qr).toBe("");
  });

  it("still supplies wording so the unavailable state can render", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse({}, 503)));

    const config = await getBookingConfig();

    // The data is empty but the strings are not, or the page prints "undefined".
    expect(config.copy.pageHeading).toBe(DEFAULT_BOOKING_COPY.pageHeading);
    expect(config.copy.submitLabel).toBe(DEFAULT_BOOKING_COPY.submitLabel);
  });

  it("merges partial copy instead of blanking the fields it did not send", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        jsonResponse({
          services: [],
          barbers: [],
          copy: { pageHeading: "Book your chair" },
        })
      )
    );

    const config = await getBookingConfig();

    expect(config.copy.pageHeading).toBe("Book your chair");
    // A backend that has not learned a newer field yet must not blank it.
    expect(config.copy.barberHeading).toBe(DEFAULT_BOOKING_COPY.barberHeading);
  });

  it("passes real services and barbers through untouched", async () => {
    const services = [
      {
        id: 1,
        label: "Haircut",
        icon: "hair",
        iconImage: "",
        image: "",
        href: "",
        description: "",
        priceFrom: "800.00",
        order: 0,
      },
    ];
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(jsonResponse({ services, barbers: [] }))
    );

    const config = await getBookingConfig();

    expect(config.services).toEqual(services);
    // DRF serialises DecimalField as a string; it must not arrive as a number,
    // because the card renders it with `.replace(/\.00$/, "")`.
    expect(typeof config.services[0].priceFrom).toBe("string");
  });
});

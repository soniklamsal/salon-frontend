import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { getSiteContent } from "@/lib/api/content";
import { FALLBACK_CONTENT } from "@/lib/fallbacks/content-fallback";

/**
 * `getSiteContent()` is the single point where a Django outage either costs the
 * salon its website or costs it nothing. Its contract is that it never throws
 * and never returns a partial object, so every one of these cases is about what
 * a visitor sees when something upstream has gone wrong.
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
  // The module warns on every failure path by design. Silenced so a passing run
  // is quiet; the assertions below are what prove the fallback happened.
  vi.spyOn(console, "warn").mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("getSiteContent", () => {
  it("serves bundled content when the backend is unreachable", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValue(new Error("ECONNREFUSED"))
    );

    await expect(getSiteContent()).resolves.toEqual(FALLBACK_CONTENT);
  });

  it("serves bundled content on a non-200, rather than rendering an error", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse({}, 500)));

    await expect(getSiteContent()).resolves.toEqual(FALLBACK_CONTENT);
  });

  it("serves bundled content when the body is not JSON", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        statusText: "OK",
        json: async () => {
          throw new SyntaxError("Unexpected token <");
        },
      } as unknown as Response)
    );

    await expect(getSiteContent()).resolves.toEqual(FALLBACK_CONTENT);
  });

  it("fills in only the sections the backend omitted", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        jsonResponse({
          site: { brandName: "CHOPPERS" },
        })
      )
    );

    const content = await getSiteContent();

    // The key that was sent wins.
    expect(content.site.brandName).toBe("CHOPPERS");
    // Its siblings survive rather than becoming undefined — the merge is
    // per-key, so a backend that sends one field does not blank the rest.
    expect(content.site.metaTitle).toBe(FALLBACK_CONTENT.site.metaTitle);
    // And a section that was not mentioned at all is intact.
    expect(content.hero).toEqual(FALLBACK_CONTENT.hero);
  });

  it("treats an empty array as a real answer, not a missing one", async () => {
    // The distinction `pick()` exists for. An admin who unpublishes every nav
    // link means it: resurrecting the bundled links would put items in the
    // header that the salon deliberately removed.
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(jsonResponse({ navLinks: [], socialLinks: [] }))
    );

    const content = await getSiteContent();

    expect(content.navLinks).toEqual([]);
    expect(content.socialLinks).toEqual([]);
  });

  it("falls back for a key sent as null, which is not an answer", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(jsonResponse({ navLinks: null }))
    );

    const content = await getSiteContent();

    expect(content.navLinks).toEqual(FALLBACK_CONTENT.navLinks);
  });

  it("requests the homepage endpoint with a timeout and a cache tag", async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({}));
    vi.stubGlobal("fetch", fetchMock);

    await getSiteContent();

    const [url, init] = fetchMock.mock.calls[0];
    expect(String(url)).toMatch(/\/homepage\/$/);
    // Without the signal a stopped backend holds the render open until the
    // platform's own timeout, which is far longer than a visitor will wait.
    expect(init.signal).toBeInstanceOf(AbortSignal);
    expect(init.next.tags).toContain("site-content");
  });
});

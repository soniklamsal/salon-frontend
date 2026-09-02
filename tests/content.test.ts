import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { getSiteContent } from "@/lib/api/content";

/**
 * `getSiteContent()` is the single point where a Django outage is handled. Its
 * contract: it never throws, it returns `null` when the backend cannot be
 * reached (so callers show a loading/updating state rather than invented
 * content), and on success it guarantees the array bands are present so a
 * partial payload degrades to empty sections rather than a crash.
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
  // is quiet; the assertions below are what prove the behaviour.
  vi.spyOn(console, "warn").mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("getSiteContent", () => {
  it("returns null when the backend is unreachable, never fake content", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValue(new Error("ECONNREFUSED"))
    );

    await expect(getSiteContent()).resolves.toBeNull();
  });

  it("returns null on a non-200 rather than throwing", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse({}, 500)));

    await expect(getSiteContent()).resolves.toBeNull();
  });

  it("returns null when the body is not JSON", async () => {
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

    await expect(getSiteContent()).resolves.toBeNull();
  });

  it("passes the backend's content straight through on success", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        jsonResponse({ site: { brandName: "CHOPPERS" } })
      )
    );

    const content = await getSiteContent();

    // What the backend sent is what is served — no bundled copy merged over it.
    expect(content?.site.brandName).toBe("CHOPPERS");
  });

  it("treats an empty array as a real answer", async () => {
    // An admin who unpublishes every nav link means it: the empty array is
    // preserved, not resurrected from a default.
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(jsonResponse({ navLinks: [], socialLinks: [] }))
    );

    const content = await getSiteContent();

    expect(content?.navLinks).toEqual([]);
    expect(content?.socialLinks).toEqual([]);
  });

  it("guarantees the array bands exist even if the backend omits them", async () => {
    // A missing array must not crash a `.map()` deep in a component; it degrades
    // to an empty section instead.
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse({})));

    const content = await getSiteContent();

    expect(content?.navLinks).toEqual([]);
    expect(content?.footerLinks).toEqual([]);
    expect(content?.socialLinks).toEqual([]);
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

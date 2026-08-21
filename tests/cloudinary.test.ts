import { describe, expect, it } from "vitest";

import { cldOptimize, cldVideo } from "@/lib/cloudinary";

/**
 * The rule these hold is a bandwidth one, and it was worth an entire page load
 * before it existed.
 *
 * The clip on the live site is 2160×4096 at 25fps and **54.5MB**, and it was
 * served untouched into a 300px grid tile — to every visitor, on every load.
 * A width-capped derivative of the same clip is 2.4MB. That is the whole
 * reason `cldVideo` exists, and the reason it must never silently no-op on a
 * URL it should have rewritten.
 */

const VIDEO = "https://res.cloudinary.com/demo/video/upload/v1/clip.mp4";

describe("cldVideo", () => {
  it("caps the width of a Cloudinary video", () => {
    expect(cldVideo(VIDEO, 800)).toBe(
      "https://res.cloudinary.com/demo/video/upload/f_auto,q_auto,w_800,c_limit/v1/clip.mp4",
    );
  });

  it("limits rather than scales, so a small clip is never blown up", () => {
    // c_limit is the difference between "make it 800 wide" and "make it no
    // more than 800 wide". Without it a 400px clip becomes a bigger file
    // than the original it came from.
    expect(cldVideo(VIDEO, 800)).toContain("c_limit");
  });

  it("asks for a different size for the modal than for the tile", () => {
    expect(cldVideo(VIDEO, 1600)).toContain("w_1600");
    expect(cldVideo(VIDEO, 800)).toContain("w_800");
  });

  it("leaves a non-Cloudinary URL exactly as it is", () => {
    // Somebody else's server has no transformation API, and inventing a path
    // into one produces a 404 where there was a working video.
    const other = "https://example.com/clip.mp4";
    expect(cldVideo(other, 800)).toBe(other);
  });

  it("leaves a Cloudinary URL with no /upload/ segment alone", () => {
    const odd = "https://res.cloudinary.com/demo/video/fetch/clip.mp4";
    expect(cldVideo(odd, 800)).toBe(odd);
  });

  it("handles an HLS manifest the same way", () => {
    const hls = "https://res.cloudinary.com/demo/video/upload/v1/clip.m3u8";
    expect(cldVideo(hls, 800)).toContain("w_800,c_limit");
  });
});

describe("cldOptimize", () => {
  it("still rewrites images, including a poster derived from a video", () => {
    const poster = "https://res.cloudinary.com/demo/video/upload/v1/clip.jpg";
    expect(cldOptimize(poster, 800)).toBe(
      "https://res.cloudinary.com/demo/video/upload/f_auto,q_auto,w_800/v1/clip.jpg",
    );
  });

  it("leaves anything that is not Cloudinary alone", () => {
    expect(cldOptimize("/images/local.webp")).toBe("/images/local.webp");
  });
});

/**
 * The reader's motion preference.
 *
 * Seven components animate, and every one of them has to check this before it
 * starts — a scrubbed parallax or a scroll-driven expansion is exactly what
 * someone with vestibular sensitivity turns the setting on to avoid. Until this
 * existed the same `matchMedia` call was written out seven times, which is
 * seven chances for the eighth animation to be added without it. That failure
 * is invisible to anyone who has not set the preference, so nothing would have
 * caught it.
 *
 * Deliberately a plain function rather than a React hook. Every call site is an
 * imperative guard *inside* a `useEffect` — the point where a GSAP timeline is
 * about to be built — and hooks cannot be called there. Making it a hook would
 * mean reading it at render, threading it through seven dependency arrays, and
 * having those effects tear down and rebuild GSAP timelines when it changed.
 * That is real risk in animation code, bought for the ability to react to
 * someone toggling an OS setting mid-visit. A function is a true 1:1
 * replacement for what each call site already does.
 *
 * Server-safe: returns `false` where `window` does not exist, so importing this
 * into a module that a Server Component also touches cannot throw. `false` is
 * the right default there anyway — the server cannot know, and the effect that
 * calls this only ever runs in the browser.
 */
export function prefersReducedMotion(): boolean {
  if (typeof window === "undefined" || !window.matchMedia) return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

/**
 * Ported from the devis-gym demo (`components/ui/BackButton.tsx`).
 *
 * Same behaviour: goes back if there is history, home if the page was opened
 * cold. The demo's framer-motion mount tween (0.3s, 0.1s delay, from x:-20) and
 * its hover/tap scales are CSS transitions here, and the lucide `ArrowLeft` is
 * inlined — neither package is a dependency of this project.
 */
export function BackButton() {
  const router = useRouter();
  const [entered, setEntered] = useState(false);

  useEffect(() => {
    const timeout = window.setTimeout(() => setEntered(true), 100);
    return () => window.clearTimeout(timeout);
  }, []);

  const handleBack = () => {
    // Check if there's history to go back to
    if (window.history.length > 1) {
      router.back();
    } else {
      // If no history, go to homepage
      router.push("/");
    }
  };

  return (
    <button
      type="button"
      onClick={handleBack}
      className={`group fixed top-4 left-4 z-50 flex h-12 w-12 cursor-pointer items-center justify-center text-white transition-all duration-300 hover:scale-105 hover:text-accent active:scale-95 ${
        entered ? "translate-x-0 opacity-100" : "-translate-x-5 opacity-0"
      }`}
      aria-label="Go back"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
        className="transition-transform duration-300 group-hover:-translate-x-0.5"
      >
        <path d="m12 19-7-7 7-7" />
        <path d="M19 12H5" />
      </svg>
    </button>
  );
}

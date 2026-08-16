import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

/**
 * Test runner config.
 *
 * `node` rather than a DOM environment on purpose. What is worth testing here
 * is the logic that is expensive to get wrong and invisible when it breaks —
 * the fallback merging that decides what a visitor sees when Django is down,
 * and the deposit arithmetic that decides what a customer is told to pay.
 * None of that needs a DOM, and pulling jsdom in to avoid saying so would cost
 * a dependency and several seconds a run for nothing.
 *
 * Rendering tests would need jsdom and @testing-library/react; that is a
 * deliberate next step, not an oversight.
 */
export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
  },
  resolve: {
    alias: {
      // Mirrors the `@/*` path in tsconfig.json.
      "@": fileURLToPath(new URL("./src/", import.meta.url)),
    },
  },
});

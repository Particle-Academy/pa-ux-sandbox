import { defineConfig } from "vitest/config";

/**
 * JS-side unit tests. Deliberately a SEPARATE config from `vite.config.ts` —
 * the app's Vite config loads the Laravel + Tailwind plugins, which have
 * nothing to say about a pure-function test run.
 *
 * Pest covers PHP; this covers the TypeScript that Pest can't reach — today the
 * Fancy Docs TUI's model, its ANSI renderer, and the React layer that wires the
 * two to `<Terminal>`.
 */
export default defineConfig({
    test: {
        include: ["tests/js/**/*.test.ts", "tests/js/**/*.test.tsx"],
        // Node by default — the model + renderer are pure. The component test
        // opts into jsdom with a `@vitest-environment` docblock.
        environment: "node",
    },
});

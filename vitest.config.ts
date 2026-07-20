import { defineConfig } from "vitest/config";

/**
 * JS-side unit tests. Deliberately a SEPARATE config from `vite.config.ts` —
 * the app's Vite config loads the Laravel + Tailwind plugins, which have
 * nothing to say about a pure-function test run.
 *
 * Pest covers PHP; this covers the pure TypeScript that Pest can't reach —
 * today the Fancy Docs TUI's model + ANSI renderer.
 */
export default defineConfig({
    test: {
        include: ["tests/js/**/*.test.ts"],
        environment: "node",
    },
});

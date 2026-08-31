import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const kitVersion = JSON.parse(
    readFileSync(fileURLToPath(new URL("./kit.json", import.meta.url)), "utf8"),
).version;

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
    define: {
        __KIT_VERSION__: JSON.stringify(kitVersion),
    },
    test: {
        include: ["tests/js/**/*.test.ts", "tests/js/**/*.test.tsx"],
        // Node by default — the model + renderer are pure. The component test
        // opts into jsdom with a `@vitest-environment` docblock.
        environment: "node",
        // The docs TUI renders frames for a browser terminal, which always
        // wants colour. Ink derives its colour level from the process stdout,
        // which is not a TTY under a test runner — so pin truecolor here, the
        // same lever the service uses (`tui-service/src/force-color.ts`). Every
        // content assertion strips ANSI first, so this only lets the colour
        // tests SEE the SGR codes; it changes no measured width or height.
        env: { FORCE_COLOR: "3" },
    },
});

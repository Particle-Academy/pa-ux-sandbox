/**
 * Force truecolor output — imported for its side effect, BEFORE ink/chalk load.
 *
 * The docs TUI renders for xterm.js in a browser, a surface that ALWAYS speaks
 * 24-bit colour. But Ink colours through the global `chalk`, whose level is
 * decided once at import time from THIS process's stdout. Under a supervised
 * daemon (Forge) or a captured pipe (a process manager), that stdout is not a
 * TTY, so chalk resolves level 0 and silently drops EVERY colour — the browser
 * would then receive a monochrome frame no matter how rich the theme is.
 *
 * Setting `FORCE_COLOR` before chalk evaluates pins the level to truecolor, so
 * the frames the browser receives are always vivid, regardless of how the
 * service was launched. An explicit `FORCE_COLOR` in the environment still wins.
 *
 * This module MUST be the first import in any entry that renders a frame
 * (`session.tsx`, `render.tsx`) so it runs before `ink` — and therefore
 * `chalk` — is evaluated. ES modules evaluate imports depth-first in source
 * order, so a leading `import "./force-color.js";` is enough.
 */
if (!process.env.FORCE_COLOR) {
  process.env.FORCE_COLOR = "3";
}

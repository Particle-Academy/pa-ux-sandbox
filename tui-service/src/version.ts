import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

/**
 * The fancy-tui version actually installed, read from its own package.json.
 *
 * The brand bar used to carry a typed string "bumped with the installed
 * fancy-tui", and it went unbumped through two upgrades. Resolving by specifier
 * is not an option — the package's `exports` map does not expose its
 * package.json — so this walks up to the nearest `node_modules` that holds it
 * rather than assuming a depth.
 */
export function installedFancyTuiVersion(from: string = fileURLToPath(import.meta.url)): string {
  let dir = dirname(from);
  for (;;) {
    const manifest = join(dir, "node_modules", "@particle-academy", "fancy-tui", "package.json");
    if (existsSync(manifest)) {
      return (JSON.parse(readFileSync(manifest, "utf8")) as { version: string }).version;
    }
    const parent = dirname(dir);
    if (parent === dir) {
      throw new Error(`@particle-academy/fancy-tui is not installed above ${from}`);
    }
    dir = parent;
  }
}

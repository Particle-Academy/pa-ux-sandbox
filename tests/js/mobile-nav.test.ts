import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * The main nav must be reachable at every width.
 *
 * It was not: `.nav-links` is `display: none` below 1180px and nothing replaced
 * it, so Docs / Packages / TUI / Flow / Starter Kits / Inspiration / Showcase /
 * Leaderboard were unreachable from the header — on any narrow window, not just
 * on a phone.
 *
 * Asserted against the CSS and the layout source rather than a rendered page:
 * the bug is a *media-query gap*, and jsdom does not evaluate media queries, so
 * a render test would have passed happily while the site stayed unnavigable.
 */
const css = readFileSync(resolve(process.cwd(), "resources/css/showcase/landing.css"), "utf8");
const layout = readFileSync(resolve(process.cwd(), "resources/js/Pages/Layout.tsx"), "utf8");

/** The body of the LAST `@media (max-width: <px>)` block, brace-matched. */
function mediaBlock(maxWidth: number): string {
    const marker = `@media (max-width: ${maxWidth}px) {`;
    let from = -1;
    // Several blocks share a breakpoint; the nav rules live in the one that
    // mentions the nav, so pick that rather than the first match.
    for (let i = css.indexOf(marker); i !== -1; i = css.indexOf(marker, i + 1)) {
        const slice = css.slice(i, i + 900);
        if (slice.includes("nav-")) from = i;
    }
    if (from === -1) return "";

    let depth = 0;
    for (let i = from + marker.length - 1; i < css.length; i++) {
        if (css[i] === "{") depth++;
        if (css[i] === "}") {
            depth--;
            if (depth === 0) return css.slice(from, i + 1);
        }
    }

    return "";
}

describe("the main nav is reachable at every width", () => {
    it("shows the inline links and no burger on a wide window", () => {
        expect(css).toMatch(/\.nav-burger \{ display: none; \}/);
    });

    it("swaps links for the burger at the breakpoint where they would overflow", () => {
        const block = mediaBlock(1180);

        expect(block).toMatch(/\.nav-links \{ display: none; \}/);
        expect(block).toMatch(/\.nav-burger \{ display: inline-flex/);
    });

    it("keeps the burger on phones, where the row sheds other affordances", () => {
        // The phone block drops the ⌘K palette, the transition toggle and the
        // GitHub link. Dropping the burger too would leave the site with no
        // route to its own nav — the original bug, one breakpoint lower.
        const block = mediaBlock(640);

        expect(block).not.toMatch(/\.nav-burger[^{}]*\{[^}]*display:\s*none/);
        expect(block).toMatch(/nav-burger/); // it is deliberately ordered first
    });

    it("puts every nav item in the flyout, not a hand-picked subset", () => {
        // A curated shortlist silently drops whatever is added to NAV_ITEMS
        // later; mapping the same array cannot.
        expect(layout).toContain("MobileMenu.Flyout");
        expect(layout).toMatch(/navItems\.map\(\(item\) => \(\s*<MobileMenu\.Item/);
    });

    it("closes the flyout on navigation", () => {
        // Inertia swaps the page without unmounting the layout, so a flyout
        // left open hangs over the page you just arrived at.
        expect(layout).toMatch(/useEffect\(\(\) => setNavOpen\(false\), \[path\]\)/);
    });

    it("labels the toggle and announces its state", () => {
        expect(layout).toContain('aria-label={navOpen ? "Close menu" : "Open menu"}');
        expect(layout).toContain("aria-expanded={navOpen}");
    });
});

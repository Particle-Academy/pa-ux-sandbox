import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * The admin shell's mobile navigation.
 *
 * The rail used to become a hand-rolled off-canvas drawer below 860px — a
 * fixed `.sb` translated off-screen plus an `.admin-mobile-scrim`, with no
 * body-scroll lock, no Escape-to-close and no aria. It is now react-fancy's
 * own `MobileMenu.Flyout`, the same component the main site nav uses.
 *
 * Asserted against the CSS and the layout source rather than a rendered page:
 * every failure mode here is a *media-query gap*, and jsdom does not evaluate
 * media queries — a render test would pass happily while the admin stayed
 * unnavigable on a phone. Same reasoning as `mobile-nav.test.ts`.
 */
const css = readFileSync(resolve(process.cwd(), "resources/css/admin.css"), "utf8");
const layout = readFileSync(resolve(process.cwd(), "resources/js/Pages/Admin/AdminLayout.tsx"), "utf8");

/**
 * Both files carry comments naming the drawer that was REMOVED, so the
 * "it is gone" assertions have to read code rather than prose — otherwise the
 * explanation of the fix reads as the bug.
 */
const cssCode = css.replace(/\/\*[\s\S]*?\*\//g, "");
const layoutCode = layout.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*$/gm, "");

/** The body of the `@media (max-width: <px>)` block that mentions the rail. */
function mediaBlock(maxWidth: number): string {
    const marker = `@media (max-width: ${maxWidth}px) {`;
    let from = -1;
    for (let i = css.indexOf(marker); i !== -1; i = css.indexOf(marker, i + 1)) {
        if (css.slice(i, i + 900).includes(".sb")) from = i;
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

describe("the admin nav is reachable on a phone", () => {
    it("hides the rail at the breakpoint where the flyout takes over", () => {
        expect(mediaBlock(860)).toMatch(/\.sb \{ display: none; \}/);
    });

    it("has no hand-rolled drawer left — no off-canvas transform, no scrim", () => {
        // The two halves of the old drawer. Either one coming back means the
        // shell has drifted off the component again.
        expect(cssCode).not.toContain("admin-mobile-scrim");
        expect(cssCode).not.toContain("mobile-open");
        expect(cssCode).not.toContain("translateX(-100%)");
        expect(layoutCode).not.toContain("admin-mobile-scrim");
        expect(layoutCode).not.toContain("mobile-open");
    });

    it("uses react-fancy's MobileMenu, not a bespoke panel", () => {
        expect(layout).toContain("MobileMenu.Flyout");
        expect(layout).toContain("MobileMenu.Item");
    });

    it("puts every rail item in the drawer, not a hand-picked subset", () => {
        // Mapping the same NAV array is what stops a link added to the rail
        // later from silently missing on mobile.
        expect(layout).toMatch(/NAV\.map\(/);
        expect(layout).toMatch(/grp\.items\.map\(\(it\) => \{/);
    });

    it("does not collapse the rail and open the drawer with one click", () => {
        // The original bug: the toggle ran BOTH setters, so opening the drawer
        // on a phone also collapsed it — 256px of unlabelled icons.
        expect(layout).not.toMatch(/setCollapsed\(\(c\) => !c\);\s*setMobileOpen/);
        expect(layout).toMatch(/isMobile \? setMobileOpen\(\(m\) => !m\) : setCollapsed\(\(c\) => !c\)/);
    });

    it("closes the drawer when the viewport widens past the breakpoint", () => {
        // The flyout is portalled and position:fixed, so it does not tuck away
        // with the layout — it hangs over the desktop admin, scroll still locked.
        expect(layout).toMatch(/if \(!mq\.matches\) \{\s*setMobileOpen\(false\);/);
    });

    it("closes the drawer on navigation", () => {
        expect(layout).toMatch(/useEffect\(\(\) => setMobileOpen\(false\), \[path\]\)/);
    });

    it("labels the toggle and announces its state", () => {
        expect(layout).toContain('aria-expanded={isMobile ? mobileOpen : undefined}');
        expect(layout).toContain('aria-controls={isMobile ? "admin-mobile-nav" : undefined}');
    });
});

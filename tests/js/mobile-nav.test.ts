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

    it("hands the nav to the bottom bar on phones, and only then drops the burger", () => {
        // The guarantee has never been "keep the burger" — it is that the site
        // is always navigable. On phones that job moved to the bottom bar, so
        // the burger goes: two routes to the same nav on one screen is clutter.
        //
        // The pairing is what matters. Hiding the burger WITHOUT showing the bar
        // is the original bug wearing new clothes, so assert both in the same
        // block rather than trusting them to be edited together.
        const block = mediaBlock(640);

        expect(block).toMatch(/\.site-bottom-nav \{ display: block; \}/);
        expect(block).toMatch(/\.nav-burger \{ display: none; \}/);
    });

    it("reserves space for the fixed bar so the page does not end under it", () => {
        // A fixed bar overlaps the last of the content, and on a phone that is
        // usually the footer or a submit button.
        expect(mediaBlock(640)).toMatch(/body \{ padding-bottom: calc\(58px \+ env\(safe-area-inset-bottom\)\)/);
    });

    it("keeps the burger between phone and desktop, where a bar has no ergonomics", () => {
        // The bar is a thumb-reach pattern. A tablet has the width for a drawer
        // and not the grip for a bar, so 640–1180 keeps the burger.
        const block = mediaBlock(1180);

        expect(block).toMatch(/\.nav-burger \{ display: inline-flex/);
        expect(block).not.toMatch(/site-bottom-nav/);
    });

    it("routes bottom-bar destinations through Inertia, not full page loads", () => {
        // MobileMenu.Item renders a plain <a> unless given `as`. Without this
        // every tap on the bar is a full page load — the site's own nav being
        // the slowest way to move around it.
        const bar = layout.slice(layout.indexOf("MobileMenu.BottomBar"));

        expect(bar).toMatch(/as=\{Link\}\s+href="\/docs"/);
        expect(bar).toMatch(/as=\{Link\}\s+href="\/packages"/);
        expect(bar).toMatch(/as=\{Link\}\s+href="\/flow"/);
    });

    it("gives the profile menu a button, since the header avatar is unreachable", () => {
        // The actions row sheds most of itself on a phone, taking the avatar
        // dropdown's trigger with it. Without this the account menu simply has
        // no route on the surface most people use.
        expect(layout).toMatch(/setProfileOpen\(true\)/);
        expect(layout).toMatch(/title="Your account"/);
        // Signed out, the same slot offers the way in rather than sitting dead.
        expect(layout).toMatch(/href="\/auth\/github" icon=\{<LogIn/);
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

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * The "What's new" notice must not sit under the Fancy Pixel badge.
 *
 * Both are fixed to the bottom-right corner, 16px in: the notice by
 * fancy-whats-new's `bottom-right` preset, the badge by fancy-pixel's
 * `floating` mode (32px tall, z-index 2147483647, above the notice's
 * 2147483000). At 1550px the badge covered the notice's "got it" button, so it
 * could not be clicked.
 *
 * Asserted against the CSS rather than a render: the overlap is two fixed
 * boxes and a media query, none of which jsdom lays out or evaluates.
 */
const css = readFileSync(resolve(process.cwd(), "resources/css/showcase/landing.css"), "utf8");

/** Every rule body whose selector mentions both the badge and the notice. */
function liftRules(): Array<{ media: string | null; body: string }> {
    const out: Array<{ media: string | null; body: string }> = [];
    const selector = /body:has\(\[data-fancy-badge\]\)\s+\[data-fancy-whats-new-stack\]:has\(\.showcase-whats-new\)\s*\{([^}]*)\}/g;
    for (let m = selector.exec(css); m !== null; m = selector.exec(css)) {
        const before = css.slice(0, m.index);
        const open = before.lastIndexOf("@media");
        // Inside a media block when the braces opened since that @media are unbalanced.
        let media: string | null = null;
        if (open !== -1) {
            const span = before.slice(open);
            const depth = (span.match(/\{/g) ?? []).length - (span.match(/\}/g) ?? []).length;
            if (depth > 0) media = span.slice(0, span.indexOf("{")).trim();
        }
        out.push({ media, body: m[1] });
    }
    return out;
}

describe("the What's new notice clears the Fancy Pixel badge", () => {
    it("lifts the notice above the badge, only when a badge is on the page", () => {
        const rules = liftRules();
        expect(rules.length).toBe(1);

        const bottom = /bottom:\s*calc\(([^;]+)\)\s*!important/.exec(rules[0].body);
        expect(bottom).not.toBeNull();
        // 16px badge inset + 32px badge + a gap: anything under 48px overlaps.
        const px = (bottom![1].match(/(\d+)px/g) ?? []).reduce((sum, v) => sum + parseInt(v, 10), 0);
        expect(px).toBeGreaterThan(48);
    });

    it("leaves phones to the bottom-nav lift, which already clears the badge", () => {
        // On a phone the notice is lifted 70px for the bottom nav, above the
        // badge's 48px. A desktop lift reaching phones would pull it back down
        // onto the nav, because it is the more specific selector.
        const [rule] = liftRules();
        expect(rule.media).toMatch(/min-width:\s*641px/);
        expect(css).toMatch(/bottom: calc\(58px \+ 12px \+ env\(safe-area-inset-bottom\)\) !important;/);
    });
});

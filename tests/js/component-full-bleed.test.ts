/**
 * The full-bleed list is data about demos declared in another file, so the two
 * can drift — and drift here is silent in the worst direction: a renamed demo
 * simply stops being full-bleed, and nobody notices until they look at a canvas
 * rendered into a box inset from a box.
 *
 * Same shape as the `PackageRegistry` / component-directory drift that went
 * unnoticed for weeks until a test compared the two.
 *
 * It reads `ComponentDemo.tsx` as TEXT rather than importing it. That module is
 * lazy-loaded through `clientOnly` and pulls in xterm, Babylon and the rest of
 * the demo surface; importing it here fails outright, and even where it did not
 * it would be a heavy import to answer a question about strings.
 */
import { describe, expect, test } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { FULL_BLEED_KEYS, demoIsFullBleed } from "../../resources/js/Pages/Packages/component-full-bleed";

/** Every `"pkg/slug":` key the demo registry answers to. */
function registryKeys(): Set<string> {
    const source = readFileSync(
        resolve(__dirname, "../../resources/js/Pages/Packages/ComponentDemo.tsx"),
        "utf8",
    );
    const block = source.slice(source.indexOf("const REGISTRY"));

    return new Set([...block.matchAll(/"([a-z0-9-]+\/[a-z0-9-]+)":/g)].map((m) => m[1]));
}

describe("the full-bleed preview list", () => {
    test("every key still resolves to a real demo", () => {
        const known = registryKeys();
        const orphans = FULL_BLEED_KEYS.filter((k) => !known.has(k));

        // An orphan means a demo was renamed or removed and this list was not
        // updated — so its preview quietly went back to being padded.
        expect(orphans).toEqual([]);
    });

    test("the premise holds: the registry actually parsed", () => {
        // If the parse breaks, the assertion above passes by finding nothing to
        // contradict it — which is the failure mode a drift test must not have.
        expect(registryKeys().size).toBeGreaterThan(50);
        expect(FULL_BLEED_KEYS.length).toBeGreaterThan(0);
    });

    test("the canvas surfaces that prompted this are in it", () => {
        // `fancy-whiteboard/drawing` is the case that surfaced the bug: a pen
        // surface whose usable area was smaller than the space available for it.
        expect(demoIsFullBleed("fancy-whiteboard", "drawing")).toBe(true);
        expect(demoIsFullBleed("fancy-map", "map")).toBe(true);
        expect(demoIsFullBleed("fancy-3d", "canvas")).toBe(true);
    });

    test("ordinary content demos are NOT full-bleed", () => {
        // The padding is right for anything that sizes to its content. If this
        // ever passes for a Button, the rule has been applied too broadly.
        expect(demoIsFullBleed("react-fancy", "button")).toBe(false);
        expect(demoIsFullBleed("react-fancy", "table")).toBe(false);
    });

    test("a package-qualified slug resolves the way the demo lookup does", () => {
        // The registry qualifies a name when it would collide across packages,
        // so `fancy-whiteboard-drawing` must match `fancy-whiteboard/drawing` —
        // otherwise the components most likely to collide are the ones that miss.
        expect(demoIsFullBleed("fancy-whiteboard", "fancy-whiteboard-drawing")).toBe(true);
    });
});

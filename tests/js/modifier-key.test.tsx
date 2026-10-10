// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { act } from "react";
import { createRoot } from "react-dom/client";

import { PaletteHint } from "../../resources/js/components/ModifierKey";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const COMMAND = "⌘";

/** The two places the site's own chrome names the palette shortcut. */
const CHROME = ["../../resources/js/Pages/Layout.tsx", "../../resources/js/Pages/Admin/AdminLayout.tsx"];

/**
 * The site told every visitor to press a key most of them do not have.
 *
 * Both the public header and the admin toolbar hardcoded `⌘K`, while
 * `CommandPalette` has always listened for `metaKey || ctrlKey` — so the
 * shortcut worked everywhere and the label was wrong for every Windows and
 * Linux reader. A consumer found the identical bug in `PromptInput` the same
 * day (react-fancy 5.35.0, reported from a Linux container), which is what sent
 * anyone looking here.
 *
 * The hint is now derived from the kit's exported `modifierKeyLabel`, so the app
 * does not carry its own copy of the rule.
 */
describe("the palette hint names a key the reader has", () => {
    it("renders Ctrl on a platform with no Command key", () => {
        // jsdom reports neither macOS nor a Mac user agent, which is the
        // non-Apple branch — and also the SSR first-paint value.
        const host = document.createElement("div");
        document.body.append(host);
        const root = createRoot(host);
        act(() => root.render(<PaletteHint />));

        expect(host.textContent).toBe("CtrlK");
        expect(host.textContent).not.toContain(COMMAND);

        act(() => root.unmount());
    });

    for (const file of CHROME) {
        it(`${file.split("/").pop()} does not hardcode the glyph`, () => {
            const source = readFileSync(fileURLToPath(new URL(file, import.meta.url)), "utf8");

            // Guard: a renamed or moved file would otherwise pass by reading
            // nothing — the failure this whole file exists to stop.
            expect(source).toContain("PaletteHint");
            expect(source.includes(COMMAND + "K")).toBe(false);
        });
    }
});

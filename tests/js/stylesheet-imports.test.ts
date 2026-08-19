import { describe, expect, it } from "vitest";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

/**
 * Every file that RENDERS a component must import that component's stylesheet.
 *
 * This exists because the failure is silent and reads as a different bug
 * entirely. `leaflet/dist/leaflet.css` was imported by `ComponentDemo.tsx` and
 * by nothing else, so every "is it imported?" check said yes — while the page
 * that actually rendered the map got a chunk without it. Leaflet still fetched
 * and painted its tiles; they just stacked 256px apart because
 * `.leaflet-tile { position: absolute }` never applied. It was filed, and sat,
 * as a stale-container-geometry bug that did not exist.
 *
 * Relying on Vite to hoist the CSS into a shared chunk is not a defence. It
 * does that today for several of these, which is exactly why they looked fine:
 * the CSS was present *incidentally*, and would vanish the moment chunking
 * changed. The stylesheet has to travel with the chunk that renders the
 * component.
 */

/** Visual exports per package. Importing only a `register*Bridge` or a type needs no CSS. */
const VISUAL: Record<string, RegExp> = {
    "@particle-academy/agent-integrations":
        /\b(AgentCursor|ShareControls|AgentPanel|ConnectorButtons|AgentActivityBadge|ScreensActivityBridge)\b/,
    "@particle-academy/fancy-whiteboard": /\b(Board|StickyNote|Shape|Connector|CursorLayer|Drawing)\b/,
    "@particle-academy/fancy-sheets": /\b(SheetWorkbook|SheetGrid)\b/,
    "@particle-academy/fancy-slides": /\b(DeckEditor|SlideViewer|SlideElement|TextElement|ShapeElement|ImageElement)\b/,
    "@particle-academy/fancy-artboard": /\b(ArtBoard|ArtPiece|ArtNote)\b/,
    "@particle-academy/fancy-passkeys-ui": /\b(PasskeyManager|PasskeyStatus|PasskeySignIn)\b/,
    "@particle-academy/fancy-diff": /\bFancyDiff\b/,
    "@particle-academy/fancy-pwa": /\b(InstallBanner|OfflineBanner|UpdateToast)\b/,
    "@particle-academy/fancy-git-ui": /\b(CommitHistory|WorkingTree|PullRequestList)\b/,
    "@particle-academy/fancy-mlm-ui": /\b(DownlineTree|CommissionStatement|RankProgress)\b/,
};

/** Packages whose stylesheet the app loads globally, so a per-file import is redundant. */
const GLOBAL = new Set([
    "@particle-academy/react-fancy",
    "@particle-academy/fancy-code",
    "@particle-academy/fancy-flow",
    "@particle-academy/fancy-mlm-ui",
]);

function sourceFiles(dir: string): string[] {
    return readdirSync(dir).flatMap((entry) => {
        const path = join(dir, entry);
        if (statSync(path).isDirectory()) return sourceFiles(path);
        return /\.tsx?$/.test(path) ? [path] : [];
    });
}

/** Strip template literals — several demo files quote an `import ...` line as documentation. */
function stripDocStrings(src: string): string {
    return src.replace(/`[\s\S]*?`/g, "``");
}

describe("stylesheet imports", () => {
    it("every file rendering a component imports that component's stylesheet", () => {
        const offences: string[] = [];
        const root = join(__dirname, "..", "..", "resources", "js");

        for (const file of sourceFiles(root)) {
            const src = stripDocStrings(readFileSync(file, "utf8"));

            for (const [spec, visual] of Object.entries(VISUAL)) {
                if (GLOBAL.has(spec)) continue;

                // A named VALUE import — `import type` brings no runtime and no CSS.
                const named = new RegExp(
                    `import\\s+\\{([^}]*)\\}\\s+from\\s+["']${spec}(/[^"']*)?["']`,
                ).exec(src);
                const dynamic = new RegExp(
                    `\\{([^}]*)\\}\\s*=\\s*await\\s+import\\(\\s*["']${spec}(/[^"']*)?["']`,
                ).exec(src);
                const bindings = named?.[1] ?? dynamic?.[1];
                if (!bindings || !visual.test(bindings)) continue;

                // Static or dynamic — either travels with this chunk.
                const hasCss = new RegExp(`["']${spec}/[^"']*\\.css["']`).test(src);
                if (hasCss) continue;

                offences.push(`${file.split(/[\\/]/).slice(-2).join("/")}  needs  ${spec}/styles.css`);
            }
        }

        expect(offences, `missing stylesheet imports:\n  ${offences.join("\n  ")}`).toEqual([]);
    });
});

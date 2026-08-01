import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative, resolve } from "node:path";
import * as lucide from "lucide-react";
import { describe, expect, it } from "vitest";

/**
 * Every `<Icon name="…">` in the app has to name an icon that actually exists.
 *
 * react-fancy's `<Icon>` resolves a kebab-case name by PascalCasing it and
 * looking it up on the lucide-react barrel — and when the lookup misses it
 * renders the wrapper span with NOTHING inside. No warning, no fallback glyph,
 * no failed build: a typo'd or wrong-library name is invisible in code review
 * and shows up only as a gap in the UI. `icon: "gear"` (Phosphor's name for
 * lucide's `settings`) sat in the admin rail exactly that way.
 *
 * This app registers no icons of its own — there is no `registerIcons()` call
 * anywhere in `resources/js` — so lucide's export list is the whole vocabulary.
 *
 * Deliberately a SOURCE scan, not a render test: the names live in nav arrays
 * and doc fixtures spread over ~100 files, and rendering each one to check a
 * span is non-empty would be far slower and cover less.
 */

const root = process.cwd();

/** The same kebab → Pascal transform `Icon`'s resolver applies. */
function kebabToPascal(name: string): string {
    return name
        .split("-")
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join("");
}

function resolvesInLucide(name: string): boolean {
    const icon = (lucide as Record<string, unknown>)[kebabToPascal(name)];
    return typeof icon === "function" || (typeof icon === "object" && icon !== null);
}

function walk(dir: string, out: string[] = []): string[] {
    for (const entry of readdirSync(dir)) {
        const full = join(dir, entry);
        if (statSync(full).isDirectory()) {
            walk(full, out);
        } else if (/\.(tsx|ts)$/.test(entry)) {
            out.push(full);
        }
    }
    return out;
}

/**
 * Literal `<Icon … name="…">` usages. JSX only, on purpose — a bare
 * `icon: "…"` key is also an ECharts option (`pointer: { icon: "rect" }`) and
 * matching it blind would fail on names lucide was never asked for.
 */
function iconNamesIn(source: string): string[] {
    const names: string[] = [];
    const re = /<Icon\b[^>]*?\bname=["']([a-z0-9][a-z0-9-]*)["']/g;
    let match: RegExpExecArray | null;
    while ((match = re.exec(source)) !== null) {
        names.push(match[1]);
    }
    return names;
}

describe("every <Icon name> resolves to a real lucide icon", () => {
    it("across resources/js", () => {
        const unresolved: string[] = [];

        for (const file of walk(resolve(root, "resources/js"))) {
            for (const name of iconNamesIn(readFileSync(file, "utf8"))) {
                if (!resolvesInLucide(name)) {
                    unresolved.push(`${name} (${relative(root, file)})`);
                }
            }
        }

        expect(unresolved).toEqual([]);
    });

    it("finds icons at all — so an empty scan can never pass by accident", () => {
        const names = walk(resolve(root, "resources/js")).flatMap((file) =>
            iconNamesIn(readFileSync(file, "utf8")),
        );

        expect(new Set(names).size).toBeGreaterThan(20);
    });
});

describe("the admin rail's nav icons", () => {
    /**
     * The rail declares its icons as `icon: "…"` inside the NAV array rather
     * than as JSX, so the scan above cannot see them — and this is where the
     * bug actually shipped. Read the array itself.
     */
    const layout = readFileSync(resolve(root, "resources/js/Pages/Admin/AdminLayout.tsx"), "utf8");
    const nav = layout.slice(layout.indexOf("const NAV"), layout.indexOf("const CRUMB"));

    const entries = [...nav.matchAll(/label: "([^"]+)", icon: "([a-z0-9-]+)"/g)].map((m) => ({
        label: m[1],
        icon: m[2],
    }));

    it("reads every item in the array", () => {
        // 11 today; the guard is that the regex still matches the array's shape.
        expect(entries.length).toBeGreaterThanOrEqual(11);
        expect(entries.map((e) => e.label)).toContain("Settings");
    });

    it.each(entries)("$label renders the $icon icon", ({ icon }) => {
        expect(resolvesInLucide(icon)).toBe(true);
    });
});

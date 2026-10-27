import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import * as lucide from "lucide-react";
import { describe, expect, it } from "vitest";

/**
 * The Features' icons are named in PHP (App\Support\FeatureSites) and drawn by
 * react-fancy's `<Icon>`, which renders an EMPTY span for a name lucide does
 * not have. `icon-names.test.ts` only sees literal `<Icon name="…">` in TSX, so
 * names that arrive as data need their own check.
 */
const php = readFileSync(resolve(process.cwd(), "app/Support/FeatureSites.php"), "utf8");
const names = [...php.matchAll(/'icon' => '([a-z0-9-]+)'/g)].map((m) => m[1]);

const pascal = (name: string) =>
    name
        .split("-")
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join("");

describe("Feature icons", () => {
    it("finds all eight", () => {
        expect(names).toHaveLength(8);
    });

    it.each(names)("%s is a lucide icon", (name) => {
        const icon = (lucide as Record<string, unknown>)[pascal(name)];
        expect(typeof icon === "function" || (typeof icon === "object" && icon !== null)).toBe(true);
    });
});

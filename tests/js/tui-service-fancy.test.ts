import { afterEach, describe, expect, it } from "vitest";
import { renderAppFrame } from "../../tui-service/src/render.js";
import { SessionManager } from "../../tui-service/src/session.js";
import { tokenizeTsx } from "../../tui-service/src/highlight.js";

/**
 * "Make it Fancy" — the docs TUI demonstrating itself. One keypress (`f`) flips
 * the WHOLE UI between a vivid Fancy look and a genuinely plain b/w one. These
 * tests cover the toggle, the syntax highlighter that rides it, and the Hero
 * preview copy override.
 *
 * Colour is forced on for the whole js suite (see `vitest.config.ts`), so the
 * highlighting tests can inspect the real SGR codes the browser terminal gets.
 */

const ESC = String.fromCharCode(27);
const ANSI = new RegExp(`${ESC}\\[[0-9;]*m`, "g");
const strip = (frame: string) => frame.replace(ANSI, "");
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// ── the tokenizer (pure) ─────────────────────────────────────────────────────

describe("the fancy tokenizer", () => {
    const kindOf = (line: string, text: string) => {
        const token = tokenizeTsx(line).find((t) => t.text === text);
        return token?.kind;
    };

    it("never changes a line's visible width — tokens partition the input exactly", () => {
        const line = `<Pagination id="jobs" page={2} pages={5} onChange={setPage} />`;
        expect(tokenizeTsx(line).map((t) => t.text).join("")).toBe(line);
    });

    it("classifies keywords, tags, attributes, strings and numbers", () => {
        const line = `const x = <Input id="branch" page={2} />;`;
        expect(kindOf(line, "const")).toBe("keyword");
        expect(kindOf(line, "Input")).toBe("tag");
        expect(kindOf(line, "id")).toBe("attr");
        expect(kindOf(line, '"branch"')).toBe("string");
        expect(kindOf(line, "page")).toBe("attr");
        expect(kindOf(line, "2")).toBe("number");
    });

    it("reads a // line comment through to the end of the line", () => {
        const tokens = tokenizeTsx("value // the rest is a comment");
        expect(tokens.some((t) => t.kind === "comment" && t.text.includes("the rest"))).toBe(true);
    });

    it("does not mistake an arrow-function param for an attribute", () => {
        const line = "onChange={(r) => r.id}";
        expect(kindOf(line, "onChange")).toBe("attr"); // real attribute
        expect(kindOf(line, "r")).not.toBe("attr"); // the `=>` must not fool it
    });
});

// ── the f toggle (live) ──────────────────────────────────────────────────────

describe("the fancy toggle (key f)", () => {
    let mgr: SessionManager | undefined;
    afterEach(() => mgr?.destroy());

    it("flips the whole UI live, and the footer indicator flips with it", async () => {
        mgr = new SessionManager();
        const started = mgr.start("docs", 110, 30); // default look is Fancy
        if ("error" in started) throw new Error(started.error);

        await sleep(90);
        const before = mgr.key(started.id, "")!;
        expect(strip(before.frame), "Fancy on shows the ✨ badge").toContain("✨ Fancy");
        expect(strip(before.frame)).not.toContain("Fancy: off");

        mgr.key(started.id, "f"); // the one keypress the whole thing is about
        await sleep(90);
        const after = mgr.key(started.id, "")!;

        expect(after.seq, "the toggle redrew").toBeGreaterThan(before.seq);
        expect(after.frame, "the whole look changed").not.toBe(before.frame);
        expect(strip(after.frame), "Plain shows the off badge").toContain("Fancy: off");
        expect(strip(after.frame), "no sparkle in Plain").not.toContain("✨");
    });
});

// ── source syntax highlighting ───────────────────────────────────────────────

describe("source syntax highlighting", () => {
    const sgr = (code: string) => new RegExp(`${ESC}\\[${code}m`);

    // The code portion of the SOURCE row, past the list column and the gutter.
    // Only the highlighter can put a cyan/yellow/blue SGR here (the list panel's
    // own coloured borders sit BEFORE the gutter, and are sliced away).
    const sourceCode = (fancy: boolean) => {
        const raw = renderAppFrame(110, 36, { initialSlug: "pagination", fancy });
        const row = raw.split("\r\n").find((line) => strip(line).includes("<Pagination"))!;
        return row.slice(row.indexOf("1 │ "));
    };

    it("colours tags, attributes and numbers in Fancy mode", () => {
        const code = sourceCode(true);
        expect(code, "tag → cyan").toMatch(sgr("36"));
        expect(code, "attribute → yellow").toMatch(sgr("33"));
        expect(code, "number → blue").toMatch(sgr("34"));
        expect(code, "string → green").toMatch(sgr("32"));
    });

    it("renders the same source monochrome in Plain mode", () => {
        // Not one of the token colours (green/yellow/blue/magenta/cyan = 32–36).
        expect(sourceCode(false)).not.toMatch(new RegExp(`${ESC}\\[3[2-6]m`));
    });
});

// ── the Hero preview override ────────────────────────────────────────────────

describe("the Hero preview override", () => {
    it("shows the app's own copy — in the live preview AND the source", () => {
        const clean = strip(renderAppFrame(140, 40, { initialSlug: "hero" }));

        expect(clean, "overridden title").toContain("Fancy TUI");
        expect(clean, "overridden tagline").toContain("Live components in your terminal");
        // The source panel agrees with the preview.
        expect(clean, "source matches preview").toContain('title="Fancy TUI"');

        // fancy-tui's own demo copy — which name-drops the dropped registry — is gone.
        expect(clean).not.toContain("Fancy Docs");
        expect(clean).not.toContain("Browse the Fancy UI registry");
    });
});

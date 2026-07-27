import { describe, expect, it } from "vitest";
import { ansiWidth, parseAnsi } from "../../resources/js/lib/ansi";

/**
 * The fancy-tui tiles paint captured ANSI as HTML.
 *
 * Worth testing directly rather than through a render: every one of these cases
 * is a real sequence from `resources/registry/tui-previews.json`, and getting
 * one wrong shows up as a subtly wrong colour on one tile out of 52 — which
 * nobody notices by eye.
 */
const ESC = "\x1b";

describe("parseAnsi", () => {
    it("returns plain text as a single unstyled segment", () => {
        expect(parseAnsi("hello")).toEqual([[{ text: "hello", style: {} }]]);
    });

    it("colours a run and stops at the reset", () => {
        // The Spinner's actual frame: cyan text, default after.
        const [line] = parseAnsi(`${ESC}[36m⠋ thinking…${ESC}[39m done`);

        expect(line[0]).toEqual({ text: "⠋ thinking…", style: { color: "#56b6c2" } });
        expect(line[1].style).toEqual({});
    });

    it("keeps foreground and background independent", () => {
        // Badge: green background, black text — `39` must clear only the text.
        const [line] = parseAnsi(`${ESC}[42m${ESC}[30m passing ${ESC}[39m${ESC}[49m`);

        expect(line[0].style).toEqual({ color: "#1e222a", background: "#98c379" });
    });

    it("swaps the pair on inverse, defaults included", () => {
        // How a captured frame draws a selected row without naming a colour:
        // if this fell through, the row would render as invisible text.
        const [line] = parseAnsi(`${ESC}[7mselected${ESC}[27m`);

        expect(line[0].style.color).toBe("var(--tui-bg, #10141c)");
        expect(line[0].style.background).toBe("var(--tui-fg, #c8ccd4)");
    });

    it("ends bold and dim on the same code, as SGR 22 does", () => {
        const [line] = parseAnsi(`${ESC}[1m${ESC}[2ma${ESC}[22mb`);

        expect(line[0].style).toEqual({ fontWeight: "600", opacity: "0.6" });
        expect(line[1].style).toEqual({});
    });

    it("resets everything on a bare escape, which means 0", () => {
        const [line] = parseAnsi(`${ESC}[1m${ESC}[31ma${ESC}[mb`);

        expect(line[1].style).toEqual({});
    });

    it("carries style across a newline", () => {
        // Box borders open on one line and close several later; dropping the
        // colour at the newline would leave every frame half-painted.
        const lines = parseAnsi(`${ESC}[36m╭─╮\n╰─╯${ESC}[39m`);

        expect(lines).toHaveLength(2);
        expect(lines[1][0].style.color).toBe("#56b6c2");
    });

    it("preserves blank lines, which are layout in a captured frame", () => {
        expect(parseAnsi("a\n\nb")).toHaveLength(3);
        expect(parseAnsi("a\n\nb")[1]).toEqual([]);
    });

    it("reads 256-colour and truecolor extensions", () => {
        expect(parseAnsi(`${ESC}[38;5;196mx`)[0][0].style.color).toBe("rgb(255 0 0)");
        expect(parseAnsi(`${ESC}[38;2;1;2;3mx`)[0][0].style.color).toBe("rgb(1 2 3)");
        // The argument-consuming branch must not leave `5`/`2` to be read as
        // their own SGR codes — `2` is dim, and the text would silently fade.
        expect(parseAnsi(`${ESC}[38;5;196mx`)[0][0].style.opacity).toBeUndefined();
    });

    it("drops cursor movement rather than half-emulating it", () => {
        expect(parseAnsi(`${ESC}[2Ka${ESC}[1;1Hb`)[0]).toEqual([{ text: "ab", style: {} }]);
    });
});

describe("ansiWidth", () => {
    it("measures visible columns, not bytes", () => {
        expect(ansiWidth(`${ESC}[36m╭─╮${ESC}[39m`)).toBe(3);
    });

    it("takes the widest line", () => {
        expect(ansiWidth("ab\nabcd\na")).toBe(4);
    });
});

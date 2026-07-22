import { describe, expect, it } from "vitest";
import { renderAppFrame, crlf } from "../../tui-service/src/render.js";

const CR = "\r";
const LF = "\n";

/**
 * Every line feed must be preceded by a carriage return.
 *
 * xterm.js is a raw emulator with no line discipline: a bare `\n` moves the
 * cursor DOWN without returning it to column 0, so each line starts one column
 * further right than the last and the frame staircases off the screen. Ink
 * emits bare `\n` because it targets a TTY, where the kernel's ONLCR supplies
 * the `\r` — there is no kernel between this service and a browser.
 */
function bareLineFeeds(frame: string): number {
    let bare = 0;
    for (let i = 0; i < frame.length; i++) {
        if (frame[i] === LF && frame[i - 1] !== CR) bare++;
    }
    return bare;
}

describe("tui-service render — line endings", () => {
    it("renders a frame with no bare line feeds", () => {
        const frame = renderAppFrame(80, 20);

        expect(frame.length).toBeGreaterThan(0);
        expect(frame).toContain(LF);
        expect(bareLineFeeds(frame)).toBe(0);
    });

    it("does not double up a carriage return", () => {
        // The translation must be idempotent — a frame that already ends its
        // lines with CRLF has to pass through untouched, or the cursor would
        // take an extra return and blank lines would appear.
        expect(crlf("a\r\nb\r\n")).toBe("a\r\nb\r\n");
        expect(crlf("a\nb\n")).toBe("a\r\nb\r\n");
        expect(renderAppFrame(60, 18)).not.toContain(`${CR}${CR}`);
    });
});

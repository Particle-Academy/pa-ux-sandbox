import { readFileSync } from "node:fs";
import { afterEach, describe, expect, it } from "vitest";
import { SessionManager } from "../../tui-service/src/session.js";

/**
 * The docs terminal's brand bar names the fancy-tui version rendering it.
 *
 * It used to be a typed string commented "bumped with the installed fancy-tui".
 * Nobody bumped it: the terminal at /fancy-tui said v0.9.0 through the 0.10 and
 * 0.11 upgrades, on the one page whose job is to show that package.
 */

const ANSI = new RegExp(`${String.fromCharCode(27)}\\[[0-9;?]*[A-Za-z]`, "g");

const installed = (
    JSON.parse(
        readFileSync(new URL("../../node_modules/@particle-academy/fancy-tui/package.json", import.meta.url), "utf8"),
    ) as { version: string }
).version;

let mgr: SessionManager;
afterEach(() => mgr?.destroy());

describe("docs terminal — the fancy-tui version it shows", () => {
    it("names the installed version in the rendered frame", () => {
        mgr = new SessionManager();
        const started = mgr.start("docs", 160, 40);
        if ("error" in started) throw new Error(started.error);
        const text = started.frame.replace(ANSI, "");

        // Vacuity guard: a frame without the brand bar would pass the check below.
        expect(text).toMatch(/fancy-tui v\d+\.\d+\.\d+/);
        expect(text).toContain(`fancy-tui v${installed}`);
    });

    it("never types the version into the app source", () => {
        const source = readFileSync(new URL("../../tui-service/src/app.tsx", import.meta.url), "utf8");
        expect(source).not.toMatch(/fancy-tui v\d+\.\d+\.\d+/);
    });
});

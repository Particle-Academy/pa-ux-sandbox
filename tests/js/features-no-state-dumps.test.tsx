// @vitest-environment jsdom
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { renderToString } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { ChannelsDemo } from "../../resources/js/Pages/Features/Media/ChannelsDemo";
import { StationsDemo } from "../../resources/js/Pages/Features/Media/StationsDemo";
import { LiveState } from "../../resources/js/Pages/Packages/LiveState";

/**
 * A feature micro-site (/features/*) is a product page, not a debugger: it
 * prints no raw controlled-state dump. The Media page did, as
 * `value: {"channelId":"thunder",...}` in monospace under the player, wrapping
 * mid-word.
 *
 * On /packages docs pages the state is the point, so it stays, but through the
 * shared <LiveState>: collapsed by default, pretty-printed JSON in a code block.
 */

// The suite runs from the app root (vitest.config.ts); jsdom makes import.meta.url non-file.
const ROOT = join(process.cwd(), "resources/js/Pages");

function sources(dir: string): string[] {
    return readdirSync(dir).flatMap((name) => {
        const path = join(dir, name);
        if (statSync(path).isDirectory()) return sources(path);
        return /\.tsx$/.test(name) ? [path] : [];
    });
}

/**
 * JSX text that labels a JSON.stringify of state: `value: {JSON.stringify(...)}`,
 * `detail: {JSON.stringify(...)}`, `tracks: {...}, trackId: {JSON.stringify(...)}`.
 * A `label: {JSON.stringify(` pair cannot occur in an object literal (a value
 * there is never wrapped in braces), so this only matches rendered text.
 */
const LABELLED_DUMP = /\b[A-Za-z]+:\s*\{\s*JSON\.stringify\(/;

function dumpsIn(dir: string): string[] {
    return sources(dir).flatMap((file) =>
        readFileSync(file, "utf8")
            .split(/\r?\n/)
            .flatMap((line, i) => (LABELLED_DUMP.test(line) ? [`${relative(ROOT, file)}:${i + 1}: ${line.trim()}`] : [])),
    );
}

describe("feature pages show no raw state dumps", () => {
    it("no /features page source renders a labelled JSON.stringify of state", () => {
        expect(dumpsIn(join(ROOT, "Features"))).toEqual([]);
    });

    it("the Media demos render no `value:` line", () => {
        for (const Demo of [StationsDemo, ChannelsDemo]) {
            const html = renderToString(<Demo />);
            expect(html).not.toMatch(/value:\s*\{/);
            expect(html).not.toContain("data-media-readout");
        }
    });
});

describe("docs pages show state through <LiveState>", () => {
    it("no /packages page source hand-rolls a labelled state one-liner", () => {
        expect(dumpsIn(join(ROOT, "Packages"))).toEqual([]);
    });

    it("renders collapsed, with pretty-printed JSON in a code block", () => {
        const host = document.createElement("div");
        document.body.append(host);
        const root = createRoot(host);
        act(() => root.render(<LiveState value={{ channelId: "thunder", trackId: "t1" }} demo="probe" />));

        const trigger = host.querySelector("[data-react-fancy-accordion-trigger]");
        expect(trigger?.textContent).toContain("Live state");
        expect(trigger?.getAttribute("aria-expanded")).toBe("false");
        const panel = host.querySelector("[data-demo='probe']");
        expect(panel?.textContent).toContain('"channelId": "thunder"');
        expect(panel?.textContent).toContain("\n");
        expect(panel?.querySelector("[data-react-fancy-code-block]")).not.toBeNull();

        act(() => root.unmount());
        host.remove();
    });
});

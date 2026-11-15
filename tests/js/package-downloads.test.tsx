// @vitest-environment jsdom
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { formatCount } from "../../resources/js/lib/downloads";
import { DownloadStats, DownloadsBadge } from "../../resources/js/Pages/Packages/Downloads";

/**
 * Download counts, rendered. The PHP side proves the pages receive the numbers
 * (and null when there are none); this proves what a visitor then sees: a
 * human-readable figure labelled "downloads", and nothing at all for null.
 */

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let host: HTMLDivElement;
let root: ReturnType<typeof createRoot>;

beforeEach(() => {
    host = document.createElement("div");
    document.body.appendChild(host);
    root = createRoot(host);
});

afterEach(() => {
    act(() => root.unmount());
    host.remove();
});

describe("formatCount", () => {
    it.each([
        [0, "0"],
        [950, "950"],
        [1000, "1k"],
        [1049, "1k"],
        [1060, "1.1k"],
        [28_700, "28.7k"],
        [28_749, "28.7k"],
        [120_000, "120k"],
        [999_499, "999k"],
        [999_960, "1M"],
        [1_234_567, "1.2M"],
        [250_000_000, "250M"],
        [3_400_000_000, "3.4B"],
    ])("%d -> %s", (n, out) => {
        expect(formatCount(n)).toBe(out);
    });
});

describe("DownloadStats", () => {
    it("shows this month and all-time, formatted, labelled as downloads", () => {
        act(() => root.render(<DownloadStats downloads={{ monthly: 28_700, total: 120_000 }} />));

        const text = host.textContent ?? "";
        expect(text).toContain("28.7k");
        expect(text).toContain("downloads this month");
        expect(text).toContain("120k");
        expect(text).toContain("downloads all-time");
        expect(text.toLowerCase()).not.toContain("users");
    });

    it("leaves out all-time when the sources keep no total", () => {
        act(() => root.render(<DownloadStats downloads={{ monthly: 210, total: null }} />));

        expect(host.textContent).toContain("210");
        expect(host.textContent).not.toContain("all-time");
    });

    it("renders nothing at all when there is no measurement", () => {
        act(() => root.render(<DownloadStats downloads={null} />));
        expect(host.innerHTML).toBe("");

        act(() => root.render(<DownloadsBadge downloads={null} />));
        expect(host.innerHTML).toBe("");
    });

    it("shows a measured zero as zero", () => {
        act(() => root.render(<DownloadsBadge downloads={{ monthly: 0, total: 0 }} />));
        expect(host.textContent).toBe("0 downloads/mo");
    });
});

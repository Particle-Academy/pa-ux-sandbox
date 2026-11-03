/** @vitest-environment jsdom */
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, it, vi } from "vitest";
import { WhatsNew, type WhatsNewGroup } from "@particle-academy/fancy-inertia/whats-new";

/*
 * The real fancy-whats-new, unmocked: the one line under a release's name and
 * version is the card's `description`, and it reaches the page as text.
 */

function release(description: string): WhatsNewGroup {
    return {
        id: "2026-11-03T00:00:00Z~release~react-fancy@6.6.0",
        label: "Release",
        date: "Nov 3, 2026",
        cards: [
            {
                id: "react-fancy@6.6.0",
                title: "react-fancy 6.6.0",
                description,
                action: { label: "View package", href: "/packages/react-fancy" },
            },
        ],
    };
}

async function show(group: WhatsNewGroup) {
    const container = document.createElement("div");
    document.body.append(container);
    const root = createRoot(container);

    await act(async () => {
        root.render(<WhatsNew load={async () => [group]} open onOpenChange={() => {}} seenUrl={null} />);
    });
    await act(async () => {
        await vi.dynamicImportSettled();
    });

    return root;
}

afterEach(() => {
    document.body.innerHTML = "";
    localStorage.clear();
});

describe("a release card", () => {
    it("shows the summary under the package and version", async () => {
        const root = await show(release("Cancel button contrast"));

        const text = document.body.textContent ?? "";
        expect(text).toContain("react-fancy 6.6.0");
        expect(text).toContain("Cancel button contrast");
        expect(text.indexOf("react-fancy 6.6.0")).toBeLessThan(text.indexOf("Cancel button contrast"));

        await act(async () => root.unmount());
    });

    it("shows the plain version line when there is no summary", async () => {
        const root = await show(release("Version 6.6.0 is on npm."));

        expect(document.body.textContent).toContain("Version 6.6.0 is on npm.");
        expect(document.body.textContent).toContain("View package");

        await act(async () => root.unmount());
    });

    it("renders markup in a summary as the literal characters", async () => {
        const hostile = '<script>window.hacked = 1</script><img src=x onerror="window.hacked = 1"> handled';
        const root = await show(release(hostile));

        expect(document.body.textContent).toContain(hostile);
        expect(document.querySelector("script")).toBeNull();
        expect(document.querySelector("img")).toBeNull();
        expect((window as unknown as { hacked?: number }).hacked).toBeUndefined();

        await act(async () => root.unmount());
    });
});

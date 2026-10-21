/** @vitest-environment jsdom */
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, it, vi } from "vitest";

const navigateListeners: Array<(event: { detail: { page: unknown } }) => void> = [];
vi.mock("@inertiajs/react", () => ({
    router: {
        on: (name: string, cb: (event: { detail: { page: unknown } }) => void) => {
            if (name === "navigate") navigateListeners.push(cb);
            return () => navigateListeners.splice(navigateListeners.indexOf(cb), 1);
        },
    },
}));

const rendered: Array<Record<string, unknown>> = [];
vi.mock("@particle-academy/fancy-inertia/whats-new", () => ({
    WhatsNew: (props: Record<string, unknown>) => {
        rendered.push(props);
        return null;
    },
}));

import {
    ShowcaseWhatsNew,
    accountFromPage,
    loadWhatsNew,
    useShowcaseWhatsNew,
} from "../../resources/js/lib/whats-new";

/*
 * The showcase dogfoods fancy-whats-new: one notice, mounted in the provider
 * tree, fed by GET /whats-new and remembering "seen" on the account when
 * someone is signed in (localStorage otherwise). The provider sits ABOVE
 * Inertia's <App>, so it reads who is signed in from the page JSON and every
 * navigation rather than usePage().
 */

afterEach(() => {
    document.body.innerHTML = "";
    rendered.length = 0;
    navigateListeners.length = 0;
    vi.unstubAllGlobals();
});

describe("loadWhatsNew", () => {
    it("asks for the groups newer than the cursor", async () => {
        const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => [{ id: "a", cards: [] }] });
        vi.stubGlobal("fetch", fetchMock);

        await expect(loadWhatsNew("2026-10-21T15:50:30Z~notice~x y")).resolves.toEqual([{ id: "a", cards: [] }]);
        expect(fetchMock.mock.calls[0][0]).toBe("/whats-new?since=2026-10-21T15%3A50%3A30Z~notice~x%20y");
    });

    it("asks with no cursor on a first visit", async () => {
        const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => [] });
        vi.stubGlobal("fetch", fetchMock);

        await loadWhatsNew(null);
        expect(fetchMock.mock.calls[0][0]).toBe("/whats-new");
    });

    it("throws on a failed answer, so the notice shows nothing", async () => {
        vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status: 500 }));

        await expect(loadWhatsNew(null)).rejects.toThrow("500");
    });
});

describe("accountFromPage", () => {
    it("is null for a guest and an identity for a signed-in user", () => {
        expect(accountFromPage({ props: { auth: { user: null } } })).toBeNull();
        expect(accountFromPage({})).toBeNull();
        expect(accountFromPage(null)).toBeNull();
        expect(accountFromPage({ props: { auth: { user: { name: "Ada", github_username: "ada" } } } })).toBe("ada");
        expect(accountFromPage({ props: { auth: { user: { name: "Ada" } } } })).toBe("Ada");
    });
});

function mountWithPage(page: unknown) {
    const script = document.createElement("script");
    script.setAttribute("data-page", "app");
    script.type = "application/json";
    script.textContent = JSON.stringify(page);
    document.body.append(script);

    let api: ReturnType<typeof useShowcaseWhatsNew> | null = null;
    function Probe() {
        api = useShowcaseWhatsNew();
        return null;
    }

    const container = document.createElement("div");
    document.body.append(container);
    const root = createRoot(container);

    return {
        root,
        render: () => root.render(<ShowcaseWhatsNew><Probe /></ShowcaseWhatsNew>),
        api: () => api!,
    };
}

describe("ShowcaseWhatsNew", () => {
    it("uses localStorage for a guest and the account route once signed in", async () => {
        const mounted = mountWithPage({ props: { auth: { user: null } } });
        await act(async () => mounted.render());

        expect(rendered.at(-1)).toMatchObject({ seenUrl: null, load: loadWhatsNew });
        // The package defaults stay: first visit "latest", missed "all".
        expect(rendered.at(-1)!.firstVisit).toBeUndefined();
        expect(rendered.at(-1)!.missed).toBeUndefined();

        await act(async () => navigateListeners.forEach((cb) => cb({ detail: { page: { props: { auth: { user: { name: "Ada" } } } } } })));
        expect(rendered.at(-1)).toMatchObject({ seenUrl: "/me/seen-notices" });

        await act(async () => mounted.root.unmount());
    });

    it("reads a signed-in first page from the page JSON", async () => {
        const mounted = mountWithPage({ props: { auth: { user: { name: "Ada" } } } });
        await act(async () => mounted.render());

        expect(rendered[0]).toMatchObject({ seenUrl: "/me/seen-notices" });

        await act(async () => mounted.root.unmount());
    });

    it("opens the notice from the header button's show()", async () => {
        const mounted = mountWithPage({ props: { auth: { user: null } } });
        await act(async () => mounted.render());
        expect(rendered.at(-1)!.open).toBe(false);

        await act(async () => mounted.api().show());
        expect(rendered.at(-1)!.open).toBe(true);

        await act(async () => (rendered.at(-1)!.onOpenChange as (open: boolean) => void)(false));
        expect(rendered.at(-1)!.open).toBe(false);

        await act(async () => mounted.root.unmount());
    });
});

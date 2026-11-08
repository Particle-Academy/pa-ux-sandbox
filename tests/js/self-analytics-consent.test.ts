/** @vitest-environment jsdom */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
    activeSelfCollector,
    pageContextFrom,
    resetSelfAnalytics,
    setPageContext,
    syncSelfAnalytics,
} from "../../resources/js/analytics/selfAnalytics";

/*
 * The showcase's own analytics collector (fancy-heuristics-js 0.4) under the
 * fancy-compliance `analytics` category: nothing until the visitor grants it,
 * events once they do, and nothing again the moment they withdraw.
 *
 * The REAL collector runs here; only the transport is stubbed, so "sends
 * nothing" is measured at the network edge, not inferred from a flag.
 */

const SELF = { siteKey: "site_self", endpoint: "https://ui.example.com/heuristics", collect: true };

type Batch = { schemaVersion: number; siteKey: string; events: Array<Record<string, any>> };
let sent: Batch[] = [];

function batches(): Batch[] {
    return sent;
}
const names = () => batches().flatMap((b) => b.events.map((e) => e.name as string));

async function flush(): Promise<void> {
    activeSelfCollector()?.flush();
    await Promise.resolve();
}

beforeEach(() => {
    sent = [];
    // jsdom has no sendBeacon, so the collector falls back to keepalive fetch.
    vi.stubGlobal(
        "fetch",
        vi.fn(async (_url: string, init?: { body?: string }) => {
            if (init?.body) sent.push(JSON.parse(init.body));
            return new Response(null, { status: 202 });
        }),
    );
    document.title = "Docs — Fancy UI";
    document.body.innerHTML = `
        <header><nav>Kit v0.5 <a href="/docs">Docs</a>
            <button data-react-fancy-button="" type="button">Sign in</button>
        </nav></header>`;
    setPageContext({ route: { name: "docs.show", pattern: "/docs/{slug}" }, title: "Docs — Fancy UI" });
});

afterEach(() => {
    resetSelfAnalytics();
    vi.unstubAllGlobals();
    document.body.innerHTML = "";
});

const clickSignIn = () => (document.querySelector("button") as HTMLButtonElement).click();

describe("before consent", () => {
    it("starts nothing and sends nothing, however much the visitor clicks", async () => {
        syncSelfAnalytics(SELF, false);
        clickSignIn();
        clickSignIn();
        await flush();

        expect(fetch).not.toHaveBeenCalled();
    });

    it("mounts no collector at all without a configured site, or with collection turned off", async () => {
        syncSelfAnalytics(null, true);
        expect(activeSelfCollector()).toBeNull();

        syncSelfAnalytics({ ...SELF, collect: false }, true);
        expect(activeSelfCollector()).toBeNull();
        clickSignIn();
        await flush();
        expect(fetch).not.toHaveBeenCalled();
    });
});

describe("after the visitor grants analytics", () => {
    it("sends a v2 view with the route and the title as separate fields", async () => {
        syncSelfAnalytics(SELF, false);
        syncSelfAnalytics(SELF, true);
        await flush();

        const view = batches().flatMap((b) => b.events).find((e) => e.name === "ui.view");
        expect(batches()[0].schemaVersion).toBe(2);
        expect(batches()[0].siteKey).toBe("site_self");
        expect(view?.route).toEqual({ name: "docs.show", pattern: "/docs/{slug}" });
        expect(view?.title).toBe("Docs — Fancy UI");
    });

    it("labels a header button's click with its own text, never the header's", async () => {
        syncSelfAnalytics(SELF, true);
        clickSignIn();
        await flush();

        const click = batches().flatMap((b) => b.events).find((e) => e.name === "ui.activate");
        expect(click?.target?.name).toBe("Sign in");
        expect(click?.target?.component).toBe("button");
        expect(JSON.stringify(click)).not.toContain("Kit v0.5");
    });

    it("reads the route and title current at each view, not the first page's", async () => {
        syncSelfAnalytics(SELF, true);
        await flush();
        sent = [];

        // An SPA visit: the new page's context lands, then the URL changes,
        // and the collector records the view once the page has settled.
        setPageContext(pageContextFrom({ analyticsRoute: { name: "packages.index", pattern: "/packages" }, seo: { title: "Packages — Fancy UI" } }));
        history.pushState({}, "", "/packages");
        await new Promise((r) => setTimeout(r, 120));
        await flush();

        const view = batches().flatMap((b) => b.events).find((e) => e.name === "ui.view");
        expect(view?.route).toEqual({ name: "packages.index", pattern: "/packages" });
        expect(view?.title).toBe("Packages — Fancy UI");
    });

    it("leaves agent activity to the agent sink, so it is never counted twice", () => {
        const create = vi.fn(() => ({ start() {}, stop() {}, flush() {}, view() {}, setConsent() {}, track() {} }));
        syncSelfAnalytics(SELF, true, create);

        expect(create).toHaveBeenCalledTimes(1);
        expect(create.mock.calls[0][0]).toMatchObject({ siteKey: "site_self", endpoint: SELF.endpoint, consent: true, track: { agent: false } });
    });
});

describe("when the visitor withdraws", () => {
    it("stops at once: the next clicks send nothing", async () => {
        syncSelfAnalytics(SELF, true);
        await flush();
        expect(names()).toContain("ui.view");

        sent = [];
        (fetch as ReturnType<typeof vi.fn>).mockClear();
        syncSelfAnalytics(SELF, false);
        clickSignIn();
        await flush();

        expect(fetch).not.toHaveBeenCalled();
    });

    it("re-grants on the same collector rather than building a second one", () => {
        const collector = { start: vi.fn(), stop: vi.fn(), flush() {}, view() {}, setConsent: vi.fn(), track() {} };
        const create = vi.fn(() => collector);

        syncSelfAnalytics(SELF, false, create);
        syncSelfAnalytics(SELF, true, create);
        syncSelfAnalytics(SELF, true, create);
        syncSelfAnalytics(SELF, false, create);

        expect(create).toHaveBeenCalledTimes(1);
        expect(collector.setConsent.mock.calls).toEqual([[true], [false]]);
    });
});

describe("pageContextFrom", () => {
    it("reads the shared route and the server's title, and tolerates their absence", () => {
        expect(pageContextFrom({ analyticsRoute: { name: "home", pattern: "/" }, seo: { title: "Fancy UI" } })).toEqual({
            route: { name: "home", pattern: "/" },
            title: "Fancy UI",
        });
        expect(pageContextFrom({})).toEqual({ route: undefined, title: undefined });
        expect(pageContextFrom({ analyticsRoute: { name: null, pattern: "/x" } })).toEqual({ route: { pattern: "/x" }, title: undefined });
    });
});

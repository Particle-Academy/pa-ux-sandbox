import { describe, expect, it } from "vitest";
import { MicroMcpServer } from "@particle-academy/agent-integrations";
import {
    activeScreenIdOfKind,
    registerPlaygroundBridges,
} from "../../resources/js/Pages/AgentPlayground/registerPlaygroundBridges";
import {
    createPlaygroundStore,
    PLAYGROUND_AGENT,
} from "../../resources/js/Pages/AgentPlayground/usePlaygroundServer";

/**
 * agent-integrations#7 — "site tools always; page tools while mounted".
 *
 * The playground stood up its OWN MicroMcpServer with its own relay session,
 * token and share link. The tool sets were therefore disjoint: an agent handed
 * the site-driving link could not touch a playground surface at all, which from
 * the driver's seat is indistinguishable from the playground interfering.
 *
 * The decided fix contributes the playground's bridges to the co-browse session
 * **as well**, for as long as the page is mounted, rather than replacing the
 * standalone flow. That only works if the same bridges can be registered on two
 * servers at once — which they can, because every adapter resolves against the
 * shared store rather than capturing screen state. These tests pin exactly that,
 * since it is the assumption the whole approach rests on.
 */

function makeServer() {
    return new MicroMcpServer({ info: { name: "t", version: "1" } });
}

describe("registerPlaygroundBridges", () => {
    it("registers the screens surface and the per-kind tools", () => {
        const server = makeServer();
        registerPlaygroundBridges(server, createPlaygroundStore(), PLAYGROUND_AGENT);

        const names = server.listTools().map((t) => t.name);

        expect(names).toContain("screens_list_kinds");
        expect(names).toContain("screens_create");
        // Undo is part of the surface, not a separate concern.
        expect(names).toContain("agent_undo");
        // A representative per-kind bridge.
        expect(names.some((n) => n.startsWith("artboard_"))).toBe(true);
    });

    it("withdraws everything it registered when disposed", () => {
        const server = makeServer();
        const dispose = registerPlaygroundBridges(server, createPlaygroundStore(), PLAYGROUND_AGENT);

        expect(server.listTools().length).toBeGreaterThan(10);

        dispose();

        // Undo tools are intentionally NOT withdrawn — they are registered once
        // per server by `ensureUndoToolsRegistered` and are not this page's to
        // remove. Everything else goes.
        const left = server.listTools().map((t) => t.name);
        expect(left.some((n) => n.startsWith("screens_"))).toBe(false);
        expect(left.some((n) => n.startsWith("artboard_"))).toBe(false);
    });

    it("registers on TWO servers over one store, which is what the dual session needs", () => {
        // The load-bearing assumption: the playground's own server and the
        // co-browse server both carry the surface, driving the same screens.
        const store = createPlaygroundStore();
        const own = makeServer();
        const site = makeServer();

        registerPlaygroundBridges(own, store, PLAYGROUND_AGENT);
        const disposeSite = registerPlaygroundBridges(site, store, PLAYGROUND_AGENT);

        expect(own.listTools().length).toBe(site.listTools().length);

        // Navigating away withdraws from the site session ONLY; the playground's
        // own console must keep working.
        disposeSite();

        expect(site.listTools().some((t) => t.name.startsWith("screens_"))).toBe(false);
        expect(own.listTools().some((t) => t.name.startsWith("screens_"))).toBe(true);
    });

    it("drives the shared store from either server", () => {
        const store = createPlaygroundStore();
        const own = makeServer();
        const site = makeServer();
        registerPlaygroundBridges(own, store, PLAYGROUND_AGENT);
        registerPlaygroundBridges(site, store, PLAYGROUND_AGENT);

        // A screen created through the site session is visible to the
        // playground's own surface, because neither owns the state.
        store.getState().addScreen("composition", "From the site", "s1");

        expect(store.getState().screens.map((s) => s.id)).toContain("s1");
        expect(own.listTools().length).toBeGreaterThan(0);
        expect(site.listTools().length).toBeGreaterThan(0);
    });

    it("falls back to the MOST RECENT screen of a kind, not the first", () => {
        // Nearly regressed while extracting this: the original fell back to
        // `sameKind[sameKind.length - 1]`, a rewrite used `.find`, and that
        // silently retargets every per-kind tool at the OLDEST screen. An agent
        // that creates a second artboard expects its next `artboard_*` call to
        // land on the one it just made.
        //
        // Reaching the fallback needs the ACTIVE screen to be a different kind:
        // `addScreen` appends AND activates, so with an artboard active the
        // first branch returns it and the fallback never runs. An earlier
        // version of this test set `activeId` to "" instead — which `setActive`
        // ignores for an unknown id, so it asserted nothing.
        const store = createPlaygroundStore();
        store.getState().addScreen("artboard", "first", "a1");
        store.getState().addScreen("artboard", "second", "a2");
        store.getState().addScreen("composition", "elsewhere", "c1");

        expect(store.getState().activeId).toBe("c1");
        expect(activeScreenIdOfKind(store, "artboard")).toBe("a2");
    });
});

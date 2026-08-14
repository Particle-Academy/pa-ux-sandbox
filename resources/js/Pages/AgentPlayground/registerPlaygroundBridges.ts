import {
    registerScreensBridge,
    registerUndoTools,
    type MicroMcpServer,
} from "@particle-academy/agent-integrations";
import { KIND_MODULES, type Agent } from "./kinds";
import type { createPlaygroundStore } from "./usePlaygroundServer";

export type PlaygroundStore = ReturnType<typeof createPlaygroundStore>;

/**
 * The active screen of a given kind, or null when none is open.
 *
 * Falls back to the MOST RECENT screen of that kind, not the first — an agent
 * that creates a second artboard expects its next `artboard_*` call to land on
 * the one it just made.
 */
export function activeScreenIdOfKind(store: PlaygroundStore, kind: string): string | null {
    const s = store.getState();
    const active = s.screens.find((x) => x.id === s.activeId);
    if (active && active.kind === kind) return active.id;
    const sameKind = s.screens.filter((x) => x.kind === kind);
    return sameKind.length ? sameKind[sameKind.length - 1].id : null;
}

/**
 * Register the playground's whole tool surface on a server, and return the
 * disposer that withdraws it.
 *
 * Extracted from `usePlaygroundServer`'s mount effect so it can be applied to
 * **two** servers at once (agent-integrations#7):
 *
 *  - the playground's own server, which backs the in-page console and the
 *    playground's standalone share link; and
 *  - the site-wide co-browse session, for as long as this page is mounted, via
 *    `CoBrowseSession.contributeBridges`.
 *
 * That is the decided design — *site tools always, page tools while mounted* —
 * without removing the standalone flow. It works because every adapter below
 * resolves against the SAME store rather than capturing screen state, so both
 * servers drive one set of surfaces and neither owns them.
 *
 * Registering the same bridges twice does not double-report activity: a tool
 * call arrives at exactly one server, and only that server's handler runs.
 */
export function registerPlaygroundBridges(
    server: MicroMcpServer,
    store: PlaygroundStore,
    agent: Agent,
): () => void {
    registerUndoTools(server, { defaultAgentId: agent.id });

    const screensBridge = registerScreensBridge(server, {
        adapter: {
            listScreens: () => {
                const s = store.getState();
                return s.screens.map((x) => ({
                    id: x.id,
                    title: x.title,
                    kind: x.kind,
                    active: x.id === s.activeId,
                    // Tells the agent a screen it created failed to render.
                    status: x.error ? "error" : "ok",
                    error: x.error ?? undefined,
                }));
            },
            getActive: () => store.getState().activeId,
            setActive: (id) => store.getState().setActive(id),
            createScreen: (spec) => {
                const id = store.getState().addScreen(spec.kind, spec.title, spec.id);
                // Composition screens accept an initial schema via config.schema.
                if (id && spec.kind === "composition" && spec.config && "schema" in spec.config) {
                    store
                        .getState()
                        .setScreenState(id, { schema: (spec.config as { schema: unknown }).schema });
                }
            },
            destroyScreen: (id) => store.getState().removeScreen(id),
            updateScreenContent: (id, partial) => {
                const entry = store.getState().screens.find((x) => x.id === id);
                if (!entry) return;
                // For composition screens, `partial` carries { schema }. For other
                // kinds, shallow-merge into the existing state slice.
                const cur = (entry.state as Record<string, unknown>) ?? {};
                store.getState().setScreenState(id, { ...cur, ...partial });
            },
            listKinds: () =>
                KIND_MODULES.map((k) => ({
                    kind: k.kind,
                    label: k.label,
                    description: k.description,
                })),
        },
        agent,
    });

    // One bridge per kind. Each adapter resolves to the active screen of that
    // kind so a single bridge drives whichever screen of that kind is current.
    const kindBridges = KIND_MODULES.map((mod) =>
        mod.register(server, {
            agent,
            getActiveScreenId: () => activeScreenIdOfKind(store, mod.kind),
            getActiveState: () => {
                const id = activeScreenIdOfKind(store, mod.kind);
                return id ? store.getState().screens.find((x) => x.id === id)?.state : undefined;
            },
            setActiveState: (next) => {
                const id = activeScreenIdOfKind(store, mod.kind);
                if (id) store.getState().setScreenState(id, next);
            },
        }),
    );

    return () => {
        screensBridge.dispose();
        kindBridges.forEach((b) => b.dispose());
    };
}

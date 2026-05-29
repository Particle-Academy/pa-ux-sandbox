/**
 * Kind contract for the Agent Playground.
 *
 * Every screen "kind" (composition / artboard / whiteboard / chart / form /
 * sheet / flow / slides / code / scene) is described by a `KindModule`:
 *
 *  - `kind` / `label` / `description` — catalog metadata the screens bridge
 *    exposes to the agent via `screens_list_kinds`.
 *  - `createState()` — produces the initial per-screen state slice.
 *  - `register(server, ctx)` — registers the surface's bridge against the
 *    shared MicroMcpServer. The adapter resolves to the ACTIVE screen of this
 *    kind via `ctx.getActiveState()` so a single bridge drives whichever
 *    screen of that kind the human is currently on. Returns a disposer.
 *  - `Surface` — the React component that renders a screen of this kind from
 *    its state slice + an onChange setter.
 *
 * State is held centrally in the playground store (a plain Map keyed by screen
 * id) so the bridge adapter and the surface read/write the same slice.
 */
import type { ComponentType } from "react";
import type { MicroMcpServer } from "@particle-academy/agent-integrations";

export type Agent = { id: string; name?: string; color?: string };

/** Wiring context handed to each kind's bridge registrar. */
export type KindBridgeContext = {
  /** Identity stamped onto activity / authorship. */
  agent: Agent;
  /** Read the state slice of the active screen of THIS kind (or null). */
  getActiveState: () => unknown;
  /** Write the state slice of the active screen of THIS kind. */
  setActiveState: (next: unknown) => void;
  /** Active screen id of this kind, or null when none is active/visible. */
  getActiveScreenId: () => string | null;
};

/** Props every kind Surface receives. */
export type SurfaceProps = {
  screenId: string;
  state: unknown;
  onChange: (next: unknown) => void;
  /** Whether this screen is the currently-active one (drives focus, etc.). */
  active: boolean;
};

export type KindModule = {
  kind: string;
  label: string;
  description: string;
  /** Whether this kind is fully wired (bridge + live surface) or a stub. */
  status: "wired" | "stub";
  /** Initial state for a new screen of this kind. */
  createState: () => unknown;
  /** Register this kind's bridge once against the shared server. */
  register: (server: MicroMcpServer, ctx: KindBridgeContext) => { dispose: () => void };
  /** Render a screen of this kind. */
  Surface: ComponentType<SurfaceProps>;
};

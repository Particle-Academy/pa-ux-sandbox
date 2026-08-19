/**
 * The authoring surface every connector node shares.
 *
 * ## The model, and where it came from
 *
 * IFTTT's authoring UX is the one non-engineers actually complete, and three of
 * its four ideas map onto fancy-flow without distortion:
 *
 * 1. **Service first, then capability.** You pick Stripe, *then* pick what about
 *    Stripe. Not a flat wall of four hundred nodes. Here that lives in the
 *    registry — `connector.service` groups a provider's nodes, and the listing
 *    tools narrow in two steps.
 * 2. **The connection is a thing, not a field.** You authorize a service once
 *    and every applet reuses it. Here: `connection.ts` in the runtime, and the
 *    single `connection` config field below.
 * 3. **Ingredients.** A trigger's output fields become named tokens you drop
 *    into a downstream action's fields. fancy-flow already has the machinery —
 *    `outputShape` on the kind, `availableVariables()` reading it off direct
 *    predecessors — so a connector's job is simply to DECLARE its shape. See
 *    `ingredients.ts`.
 * 4. **A sentence, not a form dump.** `summarize()` below.
 *
 * ## Where it does NOT map, and what we did instead
 *
 * An IFTTT applet is one trigger and one action, so "the ingredients" is
 * unambiguous: there is only one upstream. A fancy-flow graph branches, fans
 * out, merges and nests, so a connector node several hops downstream has no
 * single trigger to draw from — `availableVariables()` deliberately offers only
 * DIRECT predecessors, because a grandparent's field resolves to `null` at run
 * time and a suggestion that silently produces nothing is worse than no
 * suggestion.
 *
 * We did not paper over that. Connector triggers publish their event as a
 * single object with a declared shape, so the natural thing an author does —
 * carry it forward on the wire — keeps the ingredients available at each step.
 * Reaching further up the graph is a fancy-flow concern, recorded as a finding
 * rather than reimplemented per node.
 */

import type { ConfigField, NodeKindDefinition, OutputField } from "@particle-academy/fancy-flow/engine";

/** The domains the catalogue is grouped by. Mirrors the plan's taxonomy. */
export type ConnectorDomain =
  | "payments"
  | "commerce"
  | "messaging"
  | "email"
  | "crm"
  | "support"
  | "storage"
  | "calendar"
  | "productivity"
  | "database"
  | "devtools"
  | "analytics"
  | "marketing"
  | "ai"
  | "forms"
  | "hr"
  | "geo";

/** What a connector node does in the graph — IFTTT's "this" versus "that". */
export type ConnectorRole = "trigger" | "action" | "search";

/** How the provider exposes a test estate. Kept in step with the runtime's `SandboxKind`. */
export type SandboxKind = "credential" | "base-url" | "separate-account" | "none";

export type ConnectorMeta = {
  service: string;
  serviceTitle: string;
  domain: ConnectorDomain;
  role: ConnectorRole;
  /** The provider's name for this operation, so search finds what people type. */
  operation: string;
  sandbox: SandboxKind;
  /** Link to the provider documentation this node was written against. */
  docs?: string;
};

/**
 * The two fields EVERY connector node carries, in the same order, with the same
 * keys.
 *
 * Uniformity is the feature. An agent that has configured one connector has
 * configured all of them, and a human who has learned where the sandbox switch
 * lives never has to look for it again.
 */
export function connectionFields(meta: ConnectorMeta): ConfigField[] {
  const modes: Array<{ value: string; label: string }> = [
    { value: "auto", label: "Auto — sandbox locally, live in production" },
    { value: "fake", label: "Fake — no credentials, no network" },
  ];

  // Only offer sandbox where one exists. A select listing a mode the provider
  // does not have is an invitation to pick it and then read an error.
  if (meta.sandbox !== "none") {
    modes.push({ value: "sandbox", label: sandboxLabel(meta.sandbox) });
  }
  modes.push({ value: "live", label: "Live — the real account" });

  return [
    {
      type: "credential",
      key: "connection",
      label: `${meta.serviceTitle} connection`,
      credentialType: `connector:${meta.service}`,
      description:
        `Which configured ${meta.serviceTitle} connection to use. Credentials live in the host's ` +
        "configuration, never in the workflow — a graph is exported, committed and handed to agents.",
    },
    {
      type: "select",
      key: "mode",
      label: "Environment",
      options: modes,
      default: "auto",
      description:
        meta.sandbox === "none"
          ? `${meta.serviceTitle} has no sandbox estate, so "auto" means fake locally and live in production.`
          : "Auto follows the environment. Setting this explicitly overrides it everywhere, including in production.",
    },
  ];
}

function sandboxLabel(kind: SandboxKind): string {
  return kind === "base-url"
    ? "Sandbox — the provider's separate test host"
    : kind === "separate-account"
      ? "Sandbox — your separate test account"
      : "Sandbox — the provider's test estate";
}

/**
 * Build a connector node's authoring surface.
 *
 * Prepends the shared connection fields, applies the domain accent, and stamps
 * the metadata the registry reads. A connector that hand-rolled these would
 * drift from its siblings in exactly the small ways that make a catalogue feel
 * like a pile.
 */
export function defineConnectorKind(
  meta: ConnectorMeta,
  kind: Omit<NodeKindDefinition, "category"> & { category?: NodeKindDefinition["category"] },
): NodeKindDefinition & { connector: ConnectorMeta } {
  return {
    ...kind,
    // `category` stays fancy-flow's own taxonomy — it describes what the node
    // does to the GRAPH, which is what the palette groups by. Connector-ness is
    // a separate axis and is carried separately; overloading one field with two
    // meanings would make "show me the triggers" and "hide the connectors"
    // impossible to ask at the same time.
    category: kind.category ?? (meta.role === "trigger" ? "trigger" : "io"),
    accent: kind.accent ?? DOMAIN_ACCENT[meta.domain],
    configSchema: [...connectionFields(meta), ...(kind.configSchema ?? [])],
    connector: meta,
  };
}

/**
 * One line describing what a configured node will do, in IFTTT's register.
 *
 * A configured connector should read as a sentence, not as a form dump — it is
 * what makes a canvas skimmable, and it is also what an agent quotes back to a
 * human when asking whether to proceed.
 */
export function summarize(meta: ConnectorMeta, config: Record<string, unknown>, detail?: string): string {
  const mode = typeof config.mode === "string" ? config.mode : "auto";
  const where =
    mode === "fake"
      ? " (faked — nothing leaves this machine)"
      : mode === "sandbox"
        ? " in the sandbox"
        : mode === "live"
          ? " on the live account"
          : "";

  const what = detail?.trim() ? detail.trim() : meta.operation.replace(/_/g, " ");

  return meta.role === "trigger"
    ? `When ${meta.serviceTitle} reports ${what}${where}`
    : `Then ${meta.serviceTitle} will ${what}${where}`;
}

/** Declare a trigger's event fields — the "ingredients" downstream nodes pick from. */
export function ingredients(fields: OutputField[]): OutputField[] {
  return fields;
}

const DOMAIN_ACCENT: Record<ConnectorDomain, string> = {
  payments: "#635bff",
  commerce: "#96bf48",
  messaging: "#4a154b",
  email: "#0f9d58",
  crm: "#00a1e0",
  support: "#03363d",
  storage: "#ff9900",
  calendar: "#4285f4",
  productivity: "#2f3437",
  database: "#336791",
  devtools: "#24292f",
  analytics: "#f9a03c",
  marketing: "#1877f2",
  ai: "#d97757",
  forms: "#262627",
  hr: "#5c4ee5",
  geo: "#34a853",
};

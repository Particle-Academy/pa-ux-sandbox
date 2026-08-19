// GENERATED from @particle-academy/fancy-connector-core — src/connection.ts
// Do not edit here. Fix it in the package and re-run `php artisan flow:build`;
// a test fails the build when this copy and the package disagree.

/**
 * A CONNECTION — credentials plus an environment choice — configured once per
 * service and referenced by every node that uses it.
 *
 * ## Why this is not per-node config
 *
 * The obvious design is to put an API key field on each node. It is also wrong,
 * for three reasons that only show up later:
 *
 * 1. **Rotation.** A key on twelve nodes is twelve edits and one you will miss.
 * 2. **The sandbox/live switch has to live somewhere singular.** If each node
 *    carries its own, a graph can be half in the test estate and half in the
 *    real one, and nothing about the canvas shows it.
 * 3. **Credentials would be in the graph.** A `WorkflowSchema` is plain JSON
 *    that gets exported, committed, MCP'd to an agent and pasted into issues.
 *    Nothing secret may ever be in it.
 *
 * So a node's config stores a **connection id** — an opaque, non-secret name
 * like `"stripe"` or `"stripe-eu"` — and the host resolves it to credentials at
 * run time. This is the same arrangement fancy-flow already uses for LLM clients
 * and `fancy-git` uses for providers: the node cannot reach for a credential,
 * the host has to hand one over.
 *
 * ```ts
 * registerConnectionHost({
 *   environment: { production: process.env.NODE_ENV === "production" },
 *   connections: {
 *     stripe: {
 *       service: "stripe",
 *       live:    { secretKey: process.env.STRIPE_SECRET_KEY },
 *       sandbox: { secretKey: process.env.STRIPE_TEST_SECRET_KEY },
 *     },
 *   },
 * });
 * ```
 *
 * Note what is NOT here: no key, no token, no placeholder that looks like one.
 * Credentials are configuration, and configuration comes from the consumer's
 * environment.
 */

import { ConnectorConfigError } from "./errors";
import {
  ConnectorModeError,
  resolveConnectorMode,
  sandboxIsSelectable,
  sandboxRefusal,
  type ConnectorMode,
  type HostEnvironment,
  type RequestedMode,
  type SandboxKind,
} from "./mode";

/**
 * Credentials for one estate. Values are opaque strings the node's auth
 * strategy understands — `secretKey`, `clientId`/`clientSecret`, `token`.
 */
export type ConnectionCredentials = Record<string, string | undefined>;

/** One configured connection to one service. */
export type ConnectionSpec = {
  /** The service this connection is for — must match the node's `connector.service`. */
  service: string;
  /** Human label, shown in the picker. Defaults to the id. */
  label?: string;
  /**
   * Pin this connection to a mode. Optional, and usually absent: leaving it
   * unset is what lets the environment supply the default.
   */
  mode?: ConnectorMode;
  live?: ConnectionCredentials;
  sandbox?: ConnectionCredentials;
  /**
   * Override the base URL per mode. Only needed for a `separate-account`
   * provider whose tenant has its own host (a Salesforce instance URL); the
   * `base-url` providers carry theirs in the node's service descriptor.
   */
  baseUrl?: Partial<Record<ConnectorMode, string>>;
};

export type ConnectionHost = {
  environment: HostEnvironment;
  connections: Record<string, ConnectionSpec>;
};

let host: ConnectionHost | null = null;

/**
 * Install the host's connections. Returns an unregister function.
 *
 * One registration for the whole app, matching how a person thinks about it:
 * you authorize Stripe once, then every node that needs Stripe already has it.
 */
export function registerConnectionHost(next: ConnectionHost | null): () => void {
  host = next;

  return () => {
    if (host === next) host = null;
  };
}

export function getConnectionHost(): ConnectionHost | null {
  return host;
}

/** Connection ids the host has configured for a service — feeds the picker. */
export function connectionsFor(service: string): Array<{ id: string; label: string }> {
  const current = getConnectionHost();
  if (!current) return [];

  return Object.entries(current.connections)
    .filter(([, spec]) => spec.service === service)
    .map(([id, spec]) => ({ id, label: spec.label ?? id }));
}

/** What a node's executor actually needs, once everything has been resolved. */
export type ResolvedConnection = {
  id: string;
  service: string;
  mode: ConnectorMode;
  /** Empty in `fake` mode — there is nothing to authenticate against. */
  credentials: ConnectionCredentials;
  /** Undefined in `fake` mode. */
  baseUrl?: string;
};

export type ResolveOptions = {
  service: string;
  operation: string;
  /** The connection id from host config. Defaults to the service name. */
  connectionId?: string | null;
  /** The mode the caller asked for. */
  requested?: RequestedMode | null;
  /**
   * Credentials handed straight in, bypassing the registry entirely.
   *
   * The primary path for a host that already owns credential storage and has no
   * wish to hand a package a second copy: it passes them per call, this resolver
   * does not consult any global, and there is nothing to initialise. The
   * registry below remains for hosts that prefer to configure once.
   *
   * An EMPTY object is not the same as `null`: it means "the caller supplied
   * credentials and there are none", which fails the `requires` check loudly
   * rather than falling through to the registry and silently using someone
   * else's.
   */
  credentials?: ConnectionCredentials | null;
  sandbox: SandboxKind;
  /** Base URL per mode, from the node's service descriptor. */
  baseUrls?: Partial<Record<ConnectorMode, string>>;
  /** Credential keys that must be present for a remote call. */
  requires?: string[];
};

/**
 * Resolve the connection and mode for one call.
 *
 * ## `fake` needs no host at all
 *
 * A freshly vendored connector runs before anything is configured, and that is
 * deliberate: it is the difference between a marketplace someone can try and
 * one they can only read about. So the no-host case resolves to `fake` rather
 * than throwing — UNLESS the author explicitly asked for a remote mode, in
 * which case the ask is honoured by failing loudly instead of quietly doing
 * something else.
 */
export function resolveConnection(options: ResolveOptions): ResolvedConnection {
  const { service, operation, sandbox } = options;
  const requestedMode = options.requested ?? "auto";

  // Checked FIRST, before anything about the host, because it is a static fact
  // about the SERVICE. Asking for a sandbox that does not exist should say so
  // whether or not a connection happens to be configured — otherwise the same
  // mistake produces two different errors depending on unrelated state, and the
  // more useful one is the one you never see.
  if (requestedMode === "sandbox" && !sandboxIsSelectable(sandbox)) {
    throw new ConnectorModeError(sandboxRefusal(service, sandbox));
  }

  const id = options.connectionId?.trim() || service;

  // Explicit credentials win over everything. A host that passes them has
  // already made every decision this resolver would otherwise make, and reading
  // a global on top of that is how two sources of truth start disagreeing.
  if (options.credentials) {
    // Asking for the faker wins even here — an explicit `fake` is a statement,
    // and credentials sitting in the same call do not override it. Nothing
    // secret is carried into the fake path.
    if (requestedMode === "fake") return { id, service, mode: "fake", credentials: {} };

    // Otherwise: supplying credentials IS the statement that a real call is
    // intended, so `auto` resolves to `live` rather than consulting an
    // environment this resolver was told nothing about. `sandbox` is honoured
    // as asked.
    const mode: ConnectorMode = requestedMode === "auto" ? "live" : requestedMode;
    const missing = (options.requires ?? []).filter((key) => !options.credentials?.[key]);

    if (missing.length > 0) {
      throw new ConnectorConfigError(
        `${service}.${operation} was given credentials with no ${missing.join(", ")}. ` +
          "Nothing is inferred from an incomplete credential set — a partial one is a configuration mistake, " +
          "and quietly falling back to another source is how the wrong account gets written to.",
        { service, operation },
      );
    }

    const explicitBase = options.baseUrls?.[mode];

    return {
      id,
      service,
      mode,
      credentials: options.credentials,
      ...(explicitBase ? { baseUrl: explicitBase } : {}),
    };
  }

  const current = getConnectionHost();
  const spec = current?.connections[id];

  if (spec && spec.service !== service) {
    throw new ConnectorConfigError(
      `connection "${id}" is configured for the "${spec.service}" service, but this node needs "${service}".`,
      { service, operation },
    );
  }

  if (!current || !spec) {
    if (requestedMode !== "auto" && requestedMode !== "fake") {
      throw new ConnectorConfigError(
        `no "${id}" connection is registered, so ${service}.${operation} cannot run in "${requestedMode}" mode. ` +
          "Call registerConnectionHost({ connections: { " +
          `${id}: { service: "${service}", live: { … } } } }) — the node has no credentials of its own ` +
          'and must not invent any. Set the node\'s mode to "fake" to develop without one.',
        { service, operation },
      );
    }

    return { id, service, mode: "fake", credentials: {} };
  }

  const sandboxCreds = spec.sandbox ?? {};
  const mode = resolveConnectorMode({
    requested: requestedMode,
    connectionMode: spec.mode ?? null,
    sandbox,
    hasSandboxCredentials: hasAll(sandboxCreds, options.requires ?? []),
    environment: current.environment,
  });

  if (mode === "fake") {
    return { id, service, mode, credentials: {} };
  }

  const credentials = (mode === "sandbox" ? spec.sandbox : spec.live) ?? {};
  const missing = (options.requires ?? []).filter((key) => !credentials[key]);

  if (missing.length > 0) {
    // Never silently degrade to the faker here. A run that "succeeded" because
    // it quietly stopped talking to the provider is the worst failure this
    // whole design exists to prevent — it is green, it is wrong, and nothing
    // reports it.
    throw new ConnectorConfigError(
      `connection "${id}" has no ${missing.join(", ")} for ${mode} mode. ` +
        `Set connections.${id}.${mode}.${missing[0]}, or run this node in "fake" mode.`,
      { service, operation },
    );
  }

  const baseUrl = spec.baseUrl?.[mode] ?? options.baseUrls?.[mode];

  return { id, service, mode, credentials, ...(baseUrl ? { baseUrl } : {}) };
}

function hasAll(creds: ConnectionCredentials, keys: string[]): boolean {
  return keys.length > 0 && keys.every((key) => Boolean(creds[key]));
}

// GENERATED from @particle-academy/fancy-connectors — src/mode.ts
// Do not edit here. Fix it in the package and re-run `php artisan flow:build`;
// a test fails the build when this copy and the package disagree.

/**
 * Which copy of a provider a connector talks to — and who decides.
 *
 * Three modes, and the third is the one that makes this marketplace usable:
 *
 * | mode      | talks to                    | needs credentials | needs network |
 * |-----------|-----------------------------|-------------------|---------------|
 * | `live`    | the provider, for real      | yes               | yes           |
 * | `sandbox` | the provider's test estate  | yes (test ones)   | yes           |
 * | `fake`    | the node's own faker        | no                | no            |
 *
 * ## The environment is the DEFAULT, never the constraint
 *
 * A locally-hosted project defaults to sandbox. It is not *pinned* to sandbox:
 * an author who explicitly asks for `live` on their laptop gets `live`, because
 * the alternative — an environment that silently overrides a stated intention —
 * produces the worst outcome available here, which is a workflow that reports
 * success while having charged nobody. Equally, `sandbox` set explicitly stays
 * sandbox in production, which is how you stage a connector before cutting it
 * over.
 *
 * So: explicit beats the connection, the connection beats the environment.
 *
 * ## Why "fake" is a MODE and not a test double
 *
 * Every connector ships a faker (see `faker.ts`), and it is reachable the same
 * way in a test, in a demo and on a laptop with no credentials. Making it a
 * separate mechanism — a mock injected only under test — would mean the code
 * path a consumer develops against is not the one that runs, and the fixtures
 * would prove nothing about the executor.
 */

/** The three environments a connector node can run against. */
export type ConnectorMode = "fake" | "sandbox" | "live";

/** What a node's `mode` config field may say. `auto` means "let the rules decide". */
export type RequestedMode = ConnectorMode | "auto";

export const CONNECTOR_MODES: ConnectorMode[] = ["fake", "sandbox", "live"];

/**
 * How a provider exposes its test estate — the four shapes that actually exist.
 *
 * This is data, not per-node code, because getting it wrong is the difference
 * between hitting a test ledger and hitting a real one. Verified per provider in
 * `.ai/plans/fancy-flow-connector-nodes.md`; a node declares which of the four
 * it is and the core does the rest.
 *
 * - `credential` — same base URL, a test-scoped key selects the estate
 *   (Stripe's `sk_test_…`). The trap: pointing a live key at it works, so the
 *   only guard is the key itself.
 * - `base-url` — a different host entirely (PayPal's `api-m.sandbox.paypal.com`).
 * - `separate-account` — a distinct tenant you must create, often with its own
 *   login host (Salesforce sandbox orgs on `test.salesforce.com`).
 * - `none` — the provider has no test estate. `sandbox` is then not offered at
 *   all, and the node's honest choices are `fake` and `live`.
 */
export type SandboxKind = "credential" | "base-url" | "separate-account" | "none";

/** The host's view of where it is running. Kept tiny so it is trivial to fake. */
export type HostEnvironment = {
  /** True only in a real production deployment. Everything else is "local". */
  production: boolean;
};

export type ModeInputs = {
  /** What the node's config asked for. `undefined` / `"auto"` means "decide". */
  requested?: RequestedMode | null;
  /** A mode pinned on the CONNECTION, if the host pinned one. */
  connectionMode?: ConnectorMode | null;
  /** Whether the provider has a test estate at all. */
  sandbox: SandboxKind;
  /** Whether the connection actually carries credentials for the sandbox estate. */
  hasSandboxCredentials: boolean;
  environment: HostEnvironment;
};

/**
 * Resolve the mode a connector call runs in.
 *
 * Deliberately a pure function of stated facts, so both runtimes can be held to
 * the same table of cases and a host can unit-test its own wiring without a
 * network or a provider.
 */
export function resolveConnectorMode(inputs: ModeInputs): ConnectorMode {
  const { requested, connectionMode, sandbox, hasSandboxCredentials, environment } = inputs;

  // 1. An explicit ask wins everywhere. This is the rule that makes the
  //    environment a default rather than a cage.
  if (requested && requested !== "auto") {
    if (requested === "sandbox" && sandbox === "none") {
      throw new ConnectorModeError(
        'This connector\'s provider has no sandbox estate, so "sandbox" cannot be honoured. ' +
          'Use "fake" to develop without credentials, or "live" to talk to the provider.',
      );
    }

    return requested;
  }

  // 2. A mode pinned on the connection. One place per service, which is the
  //    whole reason connections exist as a separate thing.
  if (connectionMode) return connectionMode;

  // 3. Otherwise the environment decides.
  if (environment.production) return "live";

  // Local: prefer the provider's own test estate when it exists AND is wired.
  // Falling through to `fake` when it is not is what makes a freshly vendored
  // node runnable with no setup at all — the difference between a marketplace
  // you can try and one you can only read about.
  return sandbox !== "none" && hasSandboxCredentials ? "sandbox" : "fake";
}

/** Raised when a requested mode cannot be honoured. Never downgraded silently. */
export class ConnectorModeError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ConnectorModeError";
  }
}

/** True when the mode reaches the provider over the network. */
export function isRemote(mode: ConnectorMode): boolean {
  return mode !== "fake";
}

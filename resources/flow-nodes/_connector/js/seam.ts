// GENERATED from @particle-academy/fancy-connector-core — src/seam.ts
// Do not edit here. Fix it in the package and re-run `php artisan flow:build`;
// a test fails the build when this copy and the package disagree.

/**
 * The seam — two objects, deliberately separate.
 *
 * They answer different questions and change on different clocks:
 *
 * - **`ProviderAdapter`** — *how does an operator stand this up, and does it
 *   work?* Credential shapes, setup steps with the trap in each one named,
 *   scopes, a read-only verify. It changes when the provider changes its
 *   onboarding, which is rarely and disruptively.
 * - **`Connector`** — *what does calling this actually involve?* Capabilities,
 *   delivery behaviour, validation, rendering, the call itself, measurement. It
 *   changes when the API changes, which is often and quietly.
 *
 * Folding them together produces an object that has to be edited for both, and
 * a diff that cannot tell you which happened.
 *
 * ## What this package does NOT own, and never will
 *
 * Everything on this list belongs to the HOST, because each is enforced in one
 * place and every connector inherits it from the dispatch path rather than
 * implementing it:
 *
 * - **approval** — whether this may go out at all;
 * - **liveness** — `call(..., { dryRun })` takes the flag; a connector must
 *   never resolve its own. A host may require two independent yeses, or ten;
 *   that is its business and the package cannot help it get that wrong;
 * - **the approved-bytes comparison** — the host re-renders and refuses on
 *   mismatch. The package makes that possible by keeping `render` pure and
 *   versioned, and does not perform it;
 * - **consent** for anything reaching a list of people;
 * - **any journal** — decisions, dispatches, runs;
 * - **credential storage.** Credentials are ARGUMENTS. Nothing in this package
 *   reads `process.env`, and a test asserts that it does not.
 *
 * A packager that owned any of those would be unusable by a host that takes them
 * seriously — which is the only kind of host worth building for.
 */

import type { DeliveryDeclaration } from "./delivery";
import type { RenderRules, RenderedPayload } from "./render";
import type { ConnectorMode, SandboxKind } from "./mode";

/* ── Standing a provider up ───────────────────────────────────────────────── */

/**
 * One credential a provider needs.
 *
 * **`secret` is chosen per field, never inferred from the type.** A Discord
 * webhook URL is a URL and is entirely a secret — it carries its token in the
 * path — and the reference implementation very nearly stored it as
 * configuration because it looked like a URL.
 */
/**
 * Who a credential belongs to.
 *
 * Exported as a runtime constant as well as a type — see `CREDENTIAL_SCOPES`.
 */
export type CredentialScope = "provider" | "account";

/**
 * The scopes, as DATA.
 *
 * Because this union crosses a JSON boundary and the compiler cannot follow it
 * there. When these values were renamed from `app`/`brand`, a consumer that
 * re-declared the field shape on its client kept compiling — their
 * `f.scope === "brand"` silently became never-true, and every credential field
 * would have rendered as shared. `tsc` gives a host mirroring these types no
 * help at all, so the values ship as data a host can validate against at the
 * boundary where the compiler stops.
 */
export const CREDENTIAL_SCOPES: readonly CredentialScope[] = ["provider", "account"];

/** Severities, as data, for the same reason. */
export const PROBLEM_SEVERITIES = ["block", "warn"] as const;

/** Canonical metric names, as data, for the same reason. */
export const CANONICAL_METRICS = ["like", "share", "reply", "quote", "view"] as const;

export type CredentialField = {
  /** Stable key. The host maps it to wherever it keeps values. */
  key: string;
  label: string;
  /** What it is, where it comes from, and what it does NOT prove. */
  help: string;
  /**
   * `provider` — one value for the whole installation (an OAuth app serves
   * every account). `account` — one value per connected account.
   *
   * The distinction exists because getting it wrong means either asking for the
   * same app secret five times or letting one account's token reach another's.
   */
  scope: CredentialScope;
  secret: boolean;
  required: boolean;
  /** A hint for an empty field. NEVER a real value. */
  placeholder?: string;
};

export type SetupStep = {
  title: string;
  /** The step, and the trap in it. A step with no trap named is usually wrong. */
  detail: string;
  url?: string;
};

/**
 * The result of a read-only credential check.
 *
 * **`proves` is not decoration.** Telegram's `getMe` validates the token and
 * says nothing about whether the bot was added to the target chat — which is the
 * step everyone actually gets stuck on. A green tick that means more than it
 * should is worse than no tick, so a verify states its own scope.
 */
export type VerifyResult = {
  ok: boolean;
  /** What was learned — ideally the account's real name, so the id can be checked. */
  detail: string;
  /** Exactly what this proves, and what it does not. */
  proves?: string;
};

/**
 * How an operator stands a provider up.
 *
 * Every provider worth listing is declared, **including the ones that cannot
 * work yet**: a provider missing from a catalogue reads as unsupported, while a
 * provider listed as `implemented: false` tells you exactly what it would take.
 */
export type ProviderAdapter = {
  id: string;
  label: string;
  /** True when this can actually be used today. A real state, not a placeholder. */
  implemented: boolean;
  /** One line on what it is for, shown before anyone opens the setup. */
  summary: string;
  fields: CredentialField[];
  setup: SetupStep[];
  /** Exactly what to ask for, and no more. */
  scopes: string[];
  /**
   * How long credentials last, where the provider publishes a figure.
   *
   * Undefined means the provider states no lifetime — which a surface should
   * report as "no published expiry" rather than inventing one, and still note
   * that anything can be revoked. "No known expiry" is not "cannot stop working".
   */
  credentialLifetimeDays?: number;
  /**
   * How the provider exposes a test estate.
   *
   * **`"unverified"` is a real answer and is the right one until somebody has
   * actually checked.** Being wrong here points a workflow at a live estate
   * while a person believes it is a test one, so the type carries "nobody
   * looked" rather than forcing a guess — a comment saying so is not a type, and
   * `providerProblems()` reports the combination `implemented: true` +
   * `unverified`.
   */
  sandbox: SandboxKind;
  /**
   * What `verify` proves, and what it does NOT.
   *
   * Required whenever `verify` exists, and checked by `providerProblems()`.
   * Telegram's `getMe` validates the token and says nothing about whether the
   * bot was added to the target chat — which is the step everyone actually gets
   * stuck on. A green tick that means more than it should is worse than no tick.
   */
  proves?: string;
  /**
   * A read-only call proving the credential works AND reaches the right account.
   *
   * Deliberately a read. A verify that wrote something would be a send, and
   * sends are gated.
   */
  verify?(credentials: Record<string, string>): Promise<VerifyResult>;
};

/* ── Calling a provider ───────────────────────────────────────────────────── */

export type Problem = {
  severity: "block" | "warn";
  message: string;
};

/**
 * The result of one call.
 *
 * `ref` is how the provider identifies what was done — the handle every later
 * question is joined on. **A 2xx with no ref is a failure**, and the connector
 * says so rather than reporting a success nobody can point at.
 */
export type CallResult = {
  ok: boolean;
  ref: string | null;
  /** True when nothing actually left the building. */
  dryRun: boolean;
  detail: string;
  /** Which estate this ran against. Always reported, never inferred. */
  mode?: ConnectorMode;
};

/**
 * What a connector can report, in its own words — **declared, not inferred**.
 *
 * Inferring the shape from whatever a pull last returned gives an empty shape
 * when nothing has been pulled, and then *"this reports nothing"* and *"nobody
 * has asked yet"* are the same blank, needing opposite actions.
 *
 * `canonical` is what the metric IS across providers, where an honest equivalent
 * exists. A like and a favourite are the same act; a repost and a boost are the
 * same act; a quote often has no equivalent, and `null` says so — which is more
 * useful than a mapping somebody invented to make a table line up.
 */
export type MetricDescriptor = {
  /** The key the connector's own mapping actually returns. */
  key: string;
  /** What the provider itself calls it. */
  label: string;
  canonical: "like" | "share" | "reply" | "quote" | "view" | null;
  means: string;
};

export type MetricSample = {
  ref: string;
  at: string;
  /** Only what the provider actually reported. **Absent stays absent.** */
  metrics: Record<string, number>;
};

/**
 * What a connector can do.
 *
 * **A capability flag must not outrun the code**, and this is checkable rather
 * than a rule people remember: `assertCapabilitiesHonest` in `metrics.ts` fails
 * when `metrics: true` has no declared shape. In the reference implementation
 * two connectors claimed metrics while returning `[]` for weeks — so a pull did
 * not skip them, it asked, got nothing, and reported nothing, which on a
 * dashboard is indistinguishable from *"we asked and nobody engaged"*.
 */
export type Capabilities = {
  call: boolean;
  metrics: boolean;
  feedback: boolean;
};

/**
 * One capability of one provider.
 *
 * `Target` is the host's own content shape — the package has no opinion about
 * it, and a field named for one host's content model has no business in a shared
 * contract.
 */
export type Connector<Target = unknown> = {
  id: string;
  label: string;
  /** Which `ProviderAdapter` stands this up. */
  provider: string;
  /**
   * The connector API version this was written against.
   *
   * Required, and checked at registration by `assertConnectorApi`. The core and
   * the catalogue release on separate clocks, and a connector is VENDORED — a
   * copy in someone else's repository, with no manifest of its own to carry a
   * version range. This number is the only thing that can say "this copy was
   * written for a core you no longer have", and it says it at build time rather
   * than in production. See `compat.ts`.
   */
  connectorApi: number;
  capabilities: Capabilities;
  /**
   * How this behaves when a call goes wrong, and how fast it may be used.
   * Cited, not asserted — see `DeliveryDeclaration`.
   */
  delivery: DeliveryDeclaration;
  /** Declared metric shape. **Absent, not empty**, where there are none. */
  metricShape?: MetricDescriptor[];
  /**
   * Rendering rules, where this connector renders text.
   *
   * Data rather than code for the common case. A provider whose rendering
   * genuinely needs code supplies `render` instead.
   */
  renderRules?: RenderRules;
  /**
   * Everything the renderer cannot judge — media, alt text, a required field.
   * **Never length**: see the note at the top of `render.ts`.
   */
  validate(target: Target): Problem[];
  /** Pure and versioned. Overrides `renderRules` when both are present. */
  render?(target: Target, rules?: Record<string, number>): RenderedPayload;
  /**
   * Do the thing.
   *
   * `credentials` are passed IN. `dryRun` is decided by the HOST. Neither is
   * negotiable, and both are asserted by tests in this package.
   */
  call(
    target: Target,
    options: { dryRun: boolean; credentials: Record<string, string>; mode?: ConnectorMode },
  ): Promise<CallResult>;
  fetchMetrics?(refs: string[], credentials: Record<string, string>): Promise<MetricSample[]>;
  /**
   * Feedback on things we did, for refs the host already holds.
   *
   * **Optional, and absent is a real answer** rather than a gap to be filled. A
   * connector with no feedback mechanism must not pretend by returning an empty
   * array — "nobody replied" and "this cannot tell you" are different, and only
   * one of them is news.
   */
  fetchFeedback?(
    refs: string[],
    credentials: Record<string, string>,
  ): Promise<
    Array<{
      id: string;
      inReplyTo: string;
      author: string;
      text: string;
      at: string;
      url: string | null;
      /** What answering this would need. Opaque to the host. */
      context: Record<string, string>;
    }>
  >;
};

/**
 * A catalogue of connectors and the providers that stand them up.
 *
 * A plain lookup rather than a registry with lifecycle: the host owns which
 * connectors it installed, and a package-level global would be one more thing
 * that can be half-initialised.
 */
export type Catalogue<Target = unknown> = {
  providers: Record<string, ProviderAdapter>;
  connectors: Record<string, Connector<Target>>;
};

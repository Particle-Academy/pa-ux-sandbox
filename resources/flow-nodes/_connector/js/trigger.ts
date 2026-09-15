// GENERATED from @particle-academy/fancy-connector-core — src/trigger.ts
// Do not edit here. Fix it in the package and re-run `node scripts/vendor.mjs --target <this directory>` there;
// a test fails the build when this copy and the package disagree.

/**
 * How a connector trigger learns that something happened.
 *
 * **Not every provider pushes, and assuming webhooks is the single most common
 * way a connector catalogue ends up lying.** Google Drive and Microsoft Graph
 * want a *subscription* you must renew before it expires. Salesforce wants a
 * Pub/Sub or CometD stream. S3 wants an event notification routed to
 * infrastructure the consumer provisions. Reddit wants you to poll. Each of
 * those is a different obligation on the host, and a node that declared
 * "webhook" for all of them would install cleanly and then never fire.
 *
 * So a trigger declares its delivery mechanism, and the host can refuse to mount
 * one it has no machinery for — at author time, not at 3am.
 */

import type { ResolvedConnection } from "./connection";
import type { ConnectorFaker } from "./faker";
import { fakeRequest } from "./faker";
import type { LeaseDeclaration } from "./lease";
import type { ChallengeHandshake, HmacScheme, SharedTokenScheme, WebhookVerification } from "./webhook";
import { header, isSharedTokenScheme, verifyHmac, verifySharedToken } from "./webhook";

/**
 * The delivery mechanisms that actually exist in the wild.
 *
 * - `webhook` — the provider POSTs to a URL you own. Verify the signature.
 * - `subscription` — a webhook that EXPIRES. Someone has to renew it, forever,
 *   and if nobody does the workflow stops firing without an error anywhere.
 *   Distinct from `webhook` precisely because that ongoing duty is invisible.
 * - `poll` — you ask, on a schedule, and track a cursor.
 * - `pubsub` — the provider publishes to a broker (Google Pub/Sub, Salesforce
 *   Pub/Sub API, SNS/SQS) that the consumer must provision.
 * - `stream` — a long-lived connection the host maintains (websocket, gRPC,
 *   SSE, CometD).
 */
export type DeliveryMechanism = "webhook" | "subscription" | "poll" | "pubsub" | "stream";

export type TriggerDescriptor = {
  service: string;
  operation: string;
  delivery: DeliveryMechanism;
  /**
   * What the host has to do before this fires, in one sentence, aimed at the
   * person who has to do it. Surfaced by the editor and by the MCP, because a
   * trigger whose setup is undocumented is a trigger that silently never fires.
   */
  setup: string;
  /** For `subscription`: how long the provider keeps it alive, in seconds. */
  subscriptionTtl?: number;
  /**
   * For `subscription`: where the provider's expiry sits in the create/renew
   * response and how it is spelled, so a host builds the `SubscriptionLease`
   * with `leaseFromResponse` and runs ONE renewal scheduler for every
   * expiring trigger.
   */
  lease?: LeaseDeclaration;
  /** For `webhook` / `subscription`: how a delivery is authenticated. */
  verification?: WebhookVerificationSpec;
  /** For `poll`: the provider's smallest sane interval, in seconds. */
  minPollSeconds?: number;
  /** A faked sample event, so the node is runnable before any of the above. */
  faker: ConnectorFaker;
};

/** The provider SIGNS each delivery. */
export type HmacVerificationSpec = {
  /** Header carrying the signature. */
  signatureHeader: string;
  /** Header carrying the timestamp, when the scheme signs one. */
  timestampHeader?: string;
  scheme: HmacScheme;
  /**
   * Some schemes pack the timestamp INTO the signature header
   * (Stripe: `t=…,v1=…`). Given the raw header value, return the parts.
   */
  parse?: (raw: string) => { signature?: string; timestamp?: string };
  /** A challenge the provider makes before it will deliver anything. */
  handshake?: ChallengeHandshake;
};

/**
 * The provider ECHOES a token the subscriber chose. Google Calendar's channel
 * token, Graph's `clientState`. See `SharedTokenScheme`.
 */
export type SharedTokenVerificationSpec = {
  scheme: SharedTokenScheme;
  /** A challenge the provider makes before it will deliver anything. */
  handshake?: ChallengeHandshake;
};

export type WebhookVerificationSpec = HmacVerificationSpec | SharedTokenVerificationSpec;

export function isSharedTokenSpec(spec: WebhookVerificationSpec): spec is SharedTokenVerificationSpec {
  return isSharedTokenScheme(spec.scheme);
}

export type InboundDelivery = {
  /** The body EXACTLY as received. Not re-serialised. See `webhook.ts`. */
  raw: string;
  headers: Record<string, string | string[] | undefined>;
};

/**
 * Verify an inbound delivery against a trigger's declared scheme.
 *
 * A trigger with no `verification` REFUSES rather than accepts. That asymmetry
 * is the whole safety property: an unverifiable endpoint is a stranger's button
 * for starting workflows in your account, and defaulting to "allow" would make
 * every misconfiguration into an open door that looks shut.
 */
export async function verifyDelivery(
  trigger: TriggerDescriptor,
  delivery: InboundDelivery,
  secret: string | undefined,
  now?: number,
): Promise<WebhookVerification> {
  const spec = trigger.verification;

  if (!spec) {
    return {
      ok: false,
      reason: `${trigger.service}.${trigger.operation} declares no signature scheme, so a delivery cannot be trusted.`,
    };
  }

  if (isSharedTokenSpec(spec)) {
    return verifySharedToken({ raw: delivery.raw, headers: delivery.headers, secret, scheme: spec.scheme });
  }

  // Dispatch on a NAMED kind, and refuse a name nobody serves. "Has no kind"
  // means HMAC only because every pre-0.8.0 scheme was one; a scheme that
  // names anything else must not be verified as if it were.
  const kind = (spec.scheme as { kind?: string }).kind ?? "hmac";
  if (kind !== "hmac") {
    return {
      ok: false,
      reason: `${trigger.service}.${trigger.operation} declares a verification scheme "${kind}" this runtime does not know — refusing rather than guessing.`,
    };
  }

  const rawHeader = header(delivery.headers, spec.signatureHeader);
  const parsed = spec.parse && rawHeader ? spec.parse(rawHeader) : { signature: rawHeader };
  const timestamp = parsed.timestamp
    ?? (spec.timestampHeader ? header(delivery.headers, spec.timestampHeader) : undefined);

  return verifyHmac({
    raw: delivery.raw,
    signature: parsed.signature,
    secret,
    scheme: spec.scheme,
    timestamp,
    ...(now === undefined ? {} : { now }),
  });
}

/**
 * The event a trigger node publishes when it runs.
 *
 * Three sources, in order, and the third is why a connector trigger is usable
 * on day one:
 *
 * 1. A verified delivery the host injected on the `in` port.
 * 2. Nothing injected, but the connection is remote — that is a host wiring
 *    error, and it fails loudly rather than emitting a plausible blank.
 * 3. `fake` mode — the trigger emits its own sample event, so an author can
 *    press Run, see the real field names, and wire the downstream nodes against
 *    them before the provider has ever been contacted.
 */
export function triggerEvent(
  trigger: TriggerDescriptor,
  connection: ResolvedConnection,
  injected: unknown,
  config: Record<string, unknown>,
): unknown {
  if (hasDelivery(injected)) return injected;

  if (connection.mode === "fake") {
    return trigger.faker(
      trigger.operation,
      fakeRequest(trigger.service, trigger.operation, config),
    );
  }

  throw new Error(
    `${trigger.service}.${trigger.operation}: no event was delivered to this trigger. ` +
      `Its delivery mechanism is "${trigger.delivery}" — ${trigger.setup} ` +
      'Set the node\'s mode to "fake" to design against a sample event instead.',
  );
}

/**
 * Whether a value on the `in` port is an actual delivery.
 *
 * An EMPTY object or array counts as nothing delivered, and that is not
 * fussiness: a manually started run seeds `{}` on the trigger's input, so a
 * bare null check would hand the executor an empty envelope and call it an
 * event. Downstream every field would be `null`, the run would be green, and
 * nothing would say the trigger never fired.
 */
function hasDelivery(value: unknown): boolean {
  if (value === undefined || value === null) return false;
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === "object") return Object.keys(value as object).length > 0;

  return true;
}

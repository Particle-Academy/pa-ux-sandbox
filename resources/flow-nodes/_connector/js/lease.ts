// GENERATED from @particle-academy/fancy-connector-core — src/lease.ts
// Do not edit here. Fix it in the package and re-run `node scripts/vendor.mjs --target <this directory>` there;
// a test fails the build when this copy and the package disagree.

/**
 * A subscription that EXPIRES, and when the host must act on it.
 *
 * `DeliveryMechanism` has said since 0.1.0 that a `subscription` trigger is a
 * webhook somebody has to renew, forever, and that if nobody does the workflow
 * stops firing with no error anywhere. This is the value for that duty — ONE
 * shape every expiring trigger declares, so a host runs one renewal scheduler
 * rather than learning a loop per connector, each with its own boundary bugs.
 *
 * Three facts and two verbs:
 *
 * - `expiresAt` — the provider's expiry, as an RFC 3339 instant. Google Calendar
 *   hands back `expiration` as epoch MILLISECONDS in a string and Microsoft
 *   Graph hands back `expirationDateTime` as ISO 8601; the CONNECTOR converts on
 *   the way in, and this module refuses anything that is not an instant rather
 *   than guessing units.
 * - `renewBeforeSeconds` — the connector's margin. Positive, because zero would
 *   make `due` unreachable (the moment it applied, `expired` would win) — a
 *   lease nobody ever renews, declared in a way nothing would report.
 * - `renewOperation` — the operation the host calls when the lease is due. For
 *   Graph that is a renew; for a Google Calendar channel, which cannot be
 *   renewed, it is the create again (the connector stops the old channel
 *   itself). The lease says WHEN; the connector says WHAT.
 *
 * - `leaseState` — where the lease IS: `active`, `due` (inclusive at renewAt),
 *   `expired` (inclusive at expiresAt, and it wins over `due`: a lease that has
 *   just expired cannot be renewed).
 * - `leaseAction` — what the host DOES: `none`, `renew`, or `resync`. A missed
 *   lease is never a quiet re-create: notifications during the gap are gone, so
 *   the host must re-list (sync token or full) AND re-subscribe.
 *
 * The boundaries are DECIDED, not measured, and they are pinned in
 * `fixtures/subscription-lease/cases.json`, which the PHP twin reads too.
 */
import { ConnectorConfigError, type ConnectorErrorContext } from "./errors";

export type SubscriptionLease = {
  /** The provider's expiry, an RFC 3339 instant. */
  expiresAt: string;
  /** How early the host renews, in seconds. Positive. */
  renewBeforeSeconds: number;
  /** The operation the host calls when the lease is due. */
  renewOperation: string;
};

export type LeaseState = "active" | "due" | "expired";

export type LeaseAction = "none" | "renew" | "resync";

/** RFC 3339: date, `T`, time, optional fraction, `Z` or a numeric offset. */
const INSTANT = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,9})?(?:Z|[+-]\d{2}:\d{2})$/;

const DEFAULT_CONTEXT: ConnectorErrorContext = { service: "", operation: "subscription" };

function instantMs(value: unknown, field: string, at: ConnectorErrorContext): number {
  if (typeof value !== "string" || !INSTANT.test(value)) {
    throw new ConnectorConfigError(
      `${field} must be an RFC 3339 instant such as "2026-09-22T00:00:00Z", got ${JSON.stringify(value)}. ` +
        "A provider's own shape — Google's epoch milliseconds, say — is converted by the connector, never guessed at here.",
      at,
    );
  }
  const ms = Date.parse(value);
  if (Number.isNaN(ms)) {
    throw new ConnectorConfigError(`${field} is not a real instant: ${JSON.stringify(value)}`, at);
  }
  return ms;
}

/**
 * Validate a declaration and return the lease — a plain value a host stores
 * beside the trigger and hands back to `leaseState` / `leaseAction` later.
 */
export function subscriptionLease(
  input: { expiresAt: string; renewBeforeSeconds: number; renewOperation: string },
  at: ConnectorErrorContext = DEFAULT_CONTEXT,
): SubscriptionLease {
  instantMs(input.expiresAt, "expiresAt", at);

  if (!Number.isInteger(input.renewBeforeSeconds) || input.renewBeforeSeconds <= 0) {
    throw new ConnectorConfigError(
      `renewBeforeSeconds must be a positive whole number of seconds, got ${JSON.stringify(input.renewBeforeSeconds)}. ` +
        "Zero would make the lease due only at the instant it expires, which is a lease nobody renews.",
      at,
    );
  }

  if (typeof input.renewOperation !== "string" || input.renewOperation.trim() === "") {
    throw new ConnectorConfigError(
      "renewOperation must name the operation the host calls when the lease is due; a due lease with nothing to call is one nobody renews.",
      at,
    );
  }

  return { expiresAt: input.expiresAt, renewBeforeSeconds: input.renewBeforeSeconds, renewOperation: input.renewOperation };
}

/** The instant the lease becomes due: `expiresAt - renewBeforeSeconds`. */
export function leaseRenewAt(lease: SubscriptionLease): string {
  return new Date(instantMs(lease.expiresAt, "expiresAt", DEFAULT_CONTEXT) - lease.renewBeforeSeconds * 1000).toISOString();
}

/** Where the lease is at `now`. Both boundaries are inclusive; `expired` wins. */
export function leaseState(lease: SubscriptionLease, now: string | Date): LeaseState {
  const at = now instanceof Date ? now.getTime() : instantMs(now, "now", DEFAULT_CONTEXT);
  const expires = instantMs(lease.expiresAt, "expiresAt", DEFAULT_CONTEXT);

  if (at >= expires) return "expired";
  if (at >= expires - lease.renewBeforeSeconds * 1000) return "due";
  return "active";
}

/** What the host does about the lease at `now`. */
export function leaseAction(lease: SubscriptionLease, now: string | Date): LeaseAction {
  switch (leaseState(lease, now)) {
    case "active":
      return "none";
    case "due":
      return "renew";
    case "expired":
      return "resync";
  }
}

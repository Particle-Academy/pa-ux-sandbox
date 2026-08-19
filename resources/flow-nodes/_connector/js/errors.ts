// GENERATED from @particle-academy/fancy-connectors — src/errors.ts
// Do not edit here. Fix it in the package and re-run `php artisan flow:build`;
// a test fails the build when this copy and the package disagree.

/**
 * The connector error taxonomy.
 *
 * A host that retries needs to know WHICH KIND of failure it is looking at.
 * "Something went wrong" is not enough information to choose between retrying,
 * pausing for a person, and stopping — so every failure is classified at the
 * point it is known, which is inside the connector, not three frames up where
 * the type has already been lost.
 *
 * | class | kind | retry? |
 * |---|---|---|
 * | `ConnectorConfigError` | `rejected` | never — nothing about a second attempt changes an unset key |
 * | `ConnectorAuthError` | `rejected` | never — the credential is wrong; hammering it locks accounts |
 * | `ConnectorRateLimited` | `refused-explicitly` | yes, after `retryAfter` |
 * | `ConnectorTransient` | `refused-explicitly` | yes — a 5xx is the provider saying it did nothing |
 * | `ConnectorAmbiguous` | `ambiguous` | **only** where the connector is idempotent |
 * | `ConnectorUnreachable` | `unreachable` | yes — it never arrived |
 * | `ConnectorRequestError` | `rejected` | never — a 4xx we caused fails the same way twice |
 *
 * ## What changed, and why it is a fix rather than a refactor
 *
 * `ConnectorTransient` used to mean *5xx OR a thrown transport*, with
 * `retryable = true`. Those are opposite cases. A 5xx is the provider reporting
 * that it did nothing; a thrown transport may be a socket that closed after the
 * bytes went out. Retrying the second on a connector with no idempotency key is
 * a silent double write — the failure this whole layer exists to prevent.
 *
 * So the two are separate classes now, `kind` is the primitive, and `retryable`
 * answers the narrow question *is this safe whatever the connector is?* An older
 * caller reading `.retryable` therefore becomes conservative rather than wrong.
 */

import {
  classifyError,
  classifyStatus,
  isUnconditionallyRetryable,
  type Classified,
  type FailureKind,
} from "./delivery";

export type ConnectorErrorContext = {
  service: string;
  operation: string;
  /** HTTP status when there was one. */
  status?: number;
  /** The provider's own error code, when it publishes one. */
  providerCode?: string;
};

/** Base for everything below, so a host can catch the family in one clause. */
export class ConnectorError extends Error {
  readonly service: string;

  readonly operation: string;

  readonly status?: number;

  readonly providerCode?: string;

  /**
   * What kind of failure this is. The primitive every retry decision reads.
   *
   * Defaults to `ambiguous` on the base class deliberately: an unclassified
   * failure must not be assumed safe.
   */
  readonly kind: FailureKind = "ambiguous";

  constructor(message: string, ctx: ConnectorErrorContext) {
    super(message);
    this.name = new.target.name;
    this.service = ctx.service;
    this.operation = ctx.operation;
    this.status = ctx.status;
    this.providerCode = ctx.providerCode;
  }

  /**
   * Safe to retry **without knowing anything about the connector**.
   *
   * Ambiguous failures answer `false` here even though they may be retryable on
   * an idempotent connector — ask `shouldRetry(error.kind, { idempotent })` for
   * that. This getter is the conservative half on purpose.
   */
  get retryable(): boolean {
    return isUnconditionallyRetryable(this.kind);
  }

  /** The classification, in the shape `deliver()` reads off a thrown error. */
  get classified(): Classified {
    return { kind: this.kind, detail: this.message };
  }
}

/**
 * A required piece of configuration is missing or unusable.
 *
 * The message must name the exact key the consumer has to set. "Stripe is not
 * configured" sends someone reading source; "no `secretKey` on the `stripe`
 * connection" sends them to the line.
 */
export class ConnectorConfigError extends ConnectorError {
  override readonly kind: FailureKind = "rejected";
}

/** The provider rejected the credential. Retrying cannot help. */
export class ConnectorAuthError extends ConnectorError {
  override readonly kind: FailureKind = "rejected";
}

/** The provider asked us to slow down. It did nothing, and said so. */
export class ConnectorRateLimited extends ConnectorError {
  override readonly kind: FailureKind = "refused-explicitly";

  /** Seconds to wait, when the provider said. */
  readonly retryAfter?: number;

  constructor(message: string, ctx: ConnectorErrorContext & { retryAfter?: number }) {
    super(message, ctx);
    this.retryAfter = ctx.retryAfter;
  }

  override get classified(): Classified {
    return {
      kind: this.kind,
      detail: this.message,
      ...(this.retryAfter === undefined ? {} : { retryAfter: this.retryAfter }),
    };
  }
}

/**
 * A 5xx. The provider answered, and its answer was "not now".
 *
 * Named for what it is rather than for how it feels: this is an *explicit
 * refusal*, which is why it is always safe to repeat. A timeout feels the same
 * to the caller and is not the same thing — see `ConnectorAmbiguous`.
 */
export class ConnectorTransient extends ConnectorError {
  override readonly kind: FailureKind = "refused-explicitly";
}

/**
 * The request never reached the provider — DNS, refused connection, a socket
 * closed before anything went out.
 *
 * Always safe to repeat, and the only transport-level failure of which that is
 * true.
 */
export class ConnectorUnreachable extends ConnectorError {
  override readonly kind: FailureKind = "unreachable";
}

/**
 * Nobody can tell whether the provider acted on it. A timeout, an abort, an
 * error nothing recognises.
 *
 * **Retryable only where the connector declared that repeating a request is
 * harmless.** On anything else this is reported for a person, because the
 * alternative is a duplicate that nobody will ever trace back to a bug.
 */
export class ConnectorAmbiguous extends ConnectorError {
  override readonly kind: FailureKind = "ambiguous";
}

/** A 4xx we caused. The same request will fail the same way. */
export class ConnectorRequestError extends ConnectorError {
  override readonly kind: FailureKind = "rejected";
}

/**
 * Classify an HTTP response into the taxonomy.
 *
 * 429 before the 4xx sweep, deliberately — see `classifyStatus`.
 */
export function classifyHttp(
  status: number,
  ctx: ConnectorErrorContext,
  body: string,
  retryAfter?: number,
): ConnectorError {
  const detail = body.trim() === "" ? "" : ` — ${truncate(body, 400)}`;
  const where = `${ctx.service}.${ctx.operation}`;

  if (status === 429) {
    return new ConnectorRateLimited(`${where}: rate limited by the provider${detail}`, {
      ...ctx,
      status,
      ...(retryAfter === undefined ? {} : { retryAfter }),
    });
  }

  if (status === 401 || status === 403) {
    return new ConnectorAuthError(
      `${where}: the provider rejected the credential (${status})${detail}. ` +
        "Check the credentials and that they match the mode you are running in — " +
        "a live key in sandbox, or the reverse, fails exactly like this.",
      { ...ctx, status },
    );
  }

  if (status >= 500) {
    return new ConnectorTransient(`${where}: provider returned ${status}${detail}`, { ...ctx, status });
  }

  return new ConnectorRequestError(`${where}: request rejected with ${status}${detail}`, { ...ctx, status });
}

/**
 * Turn a thrown transport failure into the right class.
 *
 * The default is `ConnectorAmbiguous`, not `ConnectorTransient`. That single
 * default is the difference between "a flaky network costs us a retry" and "a
 * flaky network costs someone a duplicate charge".
 */
export function classifyThrown(cause: unknown, ctx: ConnectorErrorContext): ConnectorError {
  const classified = classifyError(cause);
  const message = `${ctx.service}.${ctx.operation}: ${classified.detail}`;

  return classified.kind === "unreachable"
    ? new ConnectorUnreachable(message, ctx)
    : new ConnectorAmbiguous(message, ctx);
}

/**
 * An HTTP failure carrying its classification, for connectors that decide what
 * counts as a failure themselves.
 *
 * Telegram answers `200 OK` with `{"ok": false}` for a real refusal, so its
 * connector has to raise the failure itself — and when it does, it must be
 * classified the same way every other failure is. `httpFailure(400, …)` is how
 * it says "this is a real no" without inventing a second vocabulary.
 */
export function httpFailure(status: number, body: string, retryAfter?: string | null): Error {
  const classified = classifyStatus(status, body, retryAfter);
  const error = new Error(classified.detail) as Error & { classified: Classified };
  error.classified = classified;

  return error;
}

function truncate(value: string, max: number): string {
  return value.length <= max ? value : `${value.slice(0, max)}…`;
}

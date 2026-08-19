/**
 * The connector error taxonomy.
 *
 * Durable runs retry, and a retry policy needs to know WHICH KIND of failure it
 * is looking at. "Something went wrong" is not enough information to decide
 * between retrying, pausing for a human, and stopping — so every connector
 * failure is classified at the point it is known, which is inside the connector,
 * not three frames up where the type has already been lost.
 *
 * | class                    | retry? | why |
 * |--------------------------|--------|-----|
 * | `ConnectorConfigError`   | never  | nothing about a second attempt changes an unset key |
 * | `ConnectorAuthError`     | never  | the credential is wrong; hammering it gets accounts locked |
 * | `ConnectorRateLimited`   | yes    | after `retryAfter`, which the provider told us |
 * | `ConnectorTransient`     | yes    | 5xx, timeout, connection reset |
 * | `ConnectorRequestError`  | never  | 4xx we caused; the same request fails the same way |
 */

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

  /** Whether a second attempt could plausibly succeed. */
  readonly retryable: boolean = false;

  constructor(message: string, ctx: ConnectorErrorContext) {
    super(message);
    this.name = new.target.name;
    this.service = ctx.service;
    this.operation = ctx.operation;
    this.status = ctx.status;
    this.providerCode = ctx.providerCode;
  }
}

/**
 * A required piece of configuration is missing or unusable.
 *
 * The message must name the exact key the consumer has to set. "Stripe is not
 * configured" sends someone reading source; "no `secretKey` on the `stripe`
 * connection — set it via registerConnectionHost" sends them to the line.
 */
export class ConnectorConfigError extends ConnectorError {}

/** The provider rejected the credential. Retrying cannot help. */
export class ConnectorAuthError extends ConnectorError {
  override readonly retryable = false;
}

/** The provider asked us to slow down. */
export class ConnectorRateLimited extends ConnectorError {
  override readonly retryable = true;

  /** Seconds to wait, when the provider said. */
  readonly retryAfter?: number;

  constructor(message: string, ctx: ConnectorErrorContext & { retryAfter?: number }) {
    super(message, ctx);
    this.retryAfter = ctx.retryAfter;
  }
}

/** A 5xx, a timeout, a reset — the provider's problem, and it may pass. */
export class ConnectorTransient extends ConnectorError {
  override readonly retryable = true;
}

/** A 4xx we caused. The same request will fail the same way. */
export class ConnectorRequestError extends ConnectorError {
  override readonly retryable = false;
}

/**
 * Classify an HTTP response into the taxonomy.
 *
 * 429 before the 4xx sweep, deliberately: a rate limit is a 4xx and is the one
 * 4xx that IS worth retrying, so an ordering that checked `>= 400` first would
 * mark every throttle permanent and turn a busy minute into a failed run.
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
      retryAfter,
    });
  }

  if (status === 401 || status === 403) {
    return new ConnectorAuthError(
      `${where}: the provider rejected the credential (${status})${detail}. ` +
        "Check the connection's credentials and that they match the mode you are running in — " +
        "a live key in sandbox, or the reverse, fails exactly like this.",
      { ...ctx, status },
    );
  }

  if (status >= 500) {
    return new ConnectorTransient(`${where}: provider returned ${status}${detail}`, { ...ctx, status });
  }

  return new ConnectorRequestError(`${where}: request rejected with ${status}${detail}`, { ...ctx, status });
}

function truncate(value: string, max: number): string {
  return value.length <= max ? value : `${value.slice(0, max)}…`;
}

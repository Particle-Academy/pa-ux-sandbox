// GENERATED from @particle-academy/fancy-connectors — src/delivery.ts
// Do not edit here. Fix it in the package and re-run `php artisan flow:build`;
// a test fails the build when this copy and the package disagree.

/**
 * Failure classification — the one decision every retry gets wrong.
 *
 * ## The tension
 *
 * A network hiccup should not lose a call. And a retry after a request that
 * **succeeded and whose response was lost** is a second write — the exact
 * failure an idempotency gate exists to prevent, arriving through the door
 * marked *reliability*.
 *
 * Nearly every retry helper reconciles those the same way and loses: it catches
 * an error, waits, and tries again, because from the caller's side all failures
 * look alike. They are not alike.
 *
 * | what happened | did the provider receive it? | retry? |
 * |---|---|---|
 * | DNS failure, connection refused, socket reset before send | **no** | always safe |
 * | HTTP 429 / 5xx | **yes**, and it explicitly refused | safe — it says it did nothing |
 * | timeout, aborted request, unrecognised error | **unknown** | only where the provider is idempotent |
 * | HTTP 4xx that is not 429 | **yes**, and the answer was a real no | never |
 *
 * That third row is the whole design. A timeout looks exactly like a failure and
 * may have been a success.
 *
 * ## Why this is a separate axis from the error CLASS
 *
 * The first version of this runtime carried `retryable` as a fixed boolean on
 * each error class, and `ConnectorTransient` covered both a 5xx *and* a thrown
 * transport. Those are opposite cases: a 5xx is the provider telling you it did
 * nothing, and a thrown transport may be a socket that closed after the bytes
 * went out. Marking both `retryable = true` meant an ambiguous failure on a
 * connector with no idempotency key was retried — a silent double write, on the
 * path whose entire job is not producing one.
 *
 * So the primitive is the **kind**, and retryability is a function of the kind
 * AND what the connector declared about repeating a request. `error.retryable`
 * survives and now answers the narrower question — *is this safe to retry
 * whatever the connector is?* — which makes an old caller conservative rather
 * than wrong.
 */

/** Why a call failed, in the only terms that decide whether to try again. */
export type FailureKind =
  /** Never reached the provider. A second attempt cannot duplicate anything. */
  | "unreachable"
  /** The provider answered, and its answer was "not now". It did nothing. */
  | "refused-explicitly"
  /** It may or may not have been acted on. Nobody can tell. */
  | "ambiguous"
  /** The provider answered and the answer was a real, permanent no. */
  | "rejected";

/**
 * How a connector behaves when a call goes wrong, and how fast it may be used.
 *
 * **`idempotent` is the load-bearing field**, and it is the only thing that
 * makes an ambiguous failure safe to retry. A connector that has not thought
 * about it gets `false`, and an ambiguous failure is then reported for a person
 * instead of retried into a double write.
 */
export type DeliveryDeclaration = {
  idempotent: boolean;
  /**
   * Why it is or is not — **cited, not asserted**.
   *
   * `idempotent: true` with no reason is the one claim whose failure is a public
   * double write, so the reason names the mechanism (`Idempotency-Key`,
   * `com.atproto.repo.createRecord` having none) rather than restating the flag.
   */
  why: string;
  /** Smallest gap between two calls on this connector. */
  minIntervalMs: number;
  /**
   * Whose number `minIntervalMs` is.
   *
   * A confident figure nobody can cite is worse than an honest one that is too
   * slow, because the honest one gets revised when evidence turns up and the
   * confident one gets quoted as a platform fact.
   */
  rateSource: "documented" | "self-imposed";
  /** Where the numbers came from. See `citation.ts`. */
  citation?: Citation;
};

/**
 * Where a declared fact was read, and when.
 *
 * A citation with no date is an assertion wearing a URL. The date is what lets a
 * drift check say *this was true eight months ago and nobody has looked since*,
 * which is a different and more useful statement than *this is true*.
 */
export type Citation = {
  /** The provider's own documentation for this fact. */
  url: string;
  /** ISO date the URL was actually read by a person or a check. */
  readOn: string;
  /** The sentence the fact rests on, quoted. Optional but strongly wanted. */
  quote?: string;
};

export type Classified = {
  kind: FailureKind;
  detail: string;
  /** Seconds the provider asked us to wait, when it said so. */
  retryAfter?: number;
};

/**
 * Codes that prove the request never left, or left and was refused at the door.
 *
 * Matched on codes rather than message text, because message text is not an API
 * and differs between Node, Bun, Deno and an edge runtime.
 */
const UNREACHABLE_CODES = new Set([
  "ECONNREFUSED",
  "ENOTFOUND",
  "EAI_AGAIN",
  "EHOSTUNREACH",
  "ENETUNREACH",
  "ECONNRESET",
  "EPIPE",
  "ERR_SOCKET_CONNECTION_TIMEOUT",
]);

/** Codes and names that mean *we stopped waiting*, which is not the same as *it did not happen*. */
const AMBIGUOUS_CODES = new Set([
  "ETIMEDOUT",
  "UND_ERR_HEADERS_TIMEOUT",
  "UND_ERR_BODY_TIMEOUT",
  "UND_ERR_CONNECT_TIMEOUT",
]);

const AMBIGUOUS_NAMES = new Set(["AbortError", "TimeoutError"]);

/**
 * Classify a thrown transport failure.
 *
 * **An unrecognised error falls to `ambiguous`, never to `unreachable`.** That
 * asymmetry is deliberate: an unknown failure treated as unreachable would be
 * retried, and the one thing worse than a lost call is two calls nobody asked
 * for. Guessing in the safe-looking direction is how this goes wrong.
 */
export function classifyError(error: unknown): Classified {
  const detail = error instanceof Error ? error.message : String(error);
  const code =
    (error as { code?: string })?.code ?? (error as { cause?: { code?: string } })?.cause?.code ?? "";
  const name = error instanceof Error ? error.name : "";

  if (UNREACHABLE_CODES.has(code)) return { kind: "unreachable", detail: `${code}: ${detail}` };
  if (AMBIGUOUS_NAMES.has(name) || AMBIGUOUS_CODES.has(code)) {
    return { kind: "ambiguous", detail: `${name || code}: ${detail}` };
  }

  return { kind: "ambiguous", detail };
}

/**
 * Classify an HTTP status.
 *
 * A status means the provider answered, so it knows what it did. 429 and 5xx are
 * "not now"; everything else in the 4xx range is a real no, and retrying a real
 * no just spends someone's rate limit on the same rejection.
 *
 * 429 is decided **before** the 4xx sweep, because it is a 4xx and is the one
 * 4xx worth retrying — the other ordering marks every throttle permanent and
 * turns a busy minute into a failed run.
 */
export function classifyStatus(status: number, body = "", retryAfterHeader?: string | null): Classified {
  const detail = `${status}${body ? `: ${body.slice(0, 200)}` : ""}`;
  const seconds = retryAfterHeader === undefined || retryAfterHeader === null ? NaN : Number(retryAfterHeader);

  if (status === 429 || status >= 500) {
    return {
      kind: "refused-explicitly",
      detail,
      ...(Number.isFinite(seconds) ? { retryAfter: seconds } : {}),
    };
  }

  return { kind: "rejected", detail };
}

export type RetryPolicy = {
  /** Total attempts, including the first. */
  attempts: number;
  /** First backoff in ms. Doubles each attempt. */
  baseDelayMs: number;
  /** Never wait longer than this between attempts. */
  maxDelayMs: number;
  /**
   * Whether the provider makes a repeated request harmless.
   *
   * `false` is the correct default for any connector that has not proven
   * otherwise, and "proven" means a test that publishes twice and compares the
   * result — not a comment.
   */
  idempotent: boolean;
};

export const DEFAULT_RETRY: RetryPolicy = {
  attempts: 3,
  baseDelayMs: 500,
  maxDelayMs: 8_000,
  idempotent: false,
};

/**
 * May this failure be retried?
 *
 * The whole rule, in four lines, in one place. A connector that classified its
 * own statuses would eventually decide some 4xx was worth retrying, and the
 * reason retries are safe at all is that this decision is made once.
 */
export function shouldRetry(kind: FailureKind, policy: Pick<RetryPolicy, "idempotent">): boolean {
  if (kind === "rejected") return false;
  if (kind === "unreachable" || kind === "refused-explicitly") return true;

  return policy.idempotent;
}

/**
 * True where a retry is safe **whatever the connector is** — i.e. without
 * needing to know whether repeating the request is harmless.
 *
 * This is what `ConnectorError.retryable` answers, and it is deliberately the
 * narrow question. A caller that has an idempotency declaration should ask
 * `shouldRetry` instead and get the extra case.
 */
export function isUnconditionallyRetryable(kind: FailureKind): boolean {
  return kind === "unreachable" || kind === "refused-explicitly";
}

export type Attempt = {
  attempt: number;
  kind: FailureKind;
  detail: string;
  /** How long we waited before the NEXT attempt. Absent on the last. */
  waitedMs?: number;
};

export type DeliveryOutcome<T> = {
  ok: boolean;
  value?: T;
  /** Every attempt that failed, in order. Empty when the first one worked. */
  attempts: Attempt[];
  /** Why it stopped, when it failed. Written for a person who has to act. */
  gaveUp?: string;
  /** The classification of the last failure, so a host can route on it. */
  kind?: FailureKind;
};

/**
 * The message a person reads when an ambiguous failure could not be retried.
 *
 * Exported because a host will want to recognise it, and because the wording is
 * load-bearing: it has to say *go and look*, not *it failed*. Those prompt
 * different actions and only one of them is correct.
 */
export const AMBIGUOUS_REFUSAL =
  "The request may or may not have gone through, and this connector offers no way to repeat it " +
  "harmlessly. Refusing to try again — a duplicate is worse than a call that needs doing by hand. " +
  "Check the provider before re-running.";

/**
 * Run ONE request, retrying only where retrying is provably safe.
 *
 * ## Retry wraps ONE request, never a sequence
 *
 * Wrapping a multi-post publish would re-send every earlier segment of a thread
 * when a later one failed — turning a partial send into a duplicated one. So the
 * unit is a single request and a chain composes above it, not below.
 *
 * `send` must throw on failure. An error carrying a `classified` property (see
 * `httpFailure`) is trusted; anything else is classified here. That indirection
 * lets each connector decide what counts as a failure for it — a Telegram
 * `200 OK` with `{"ok": false}` is a failure and only the connector knows that —
 * while the decision about *retrying* stays in one place for all of them.
 *
 * `sleep` is injectable so a test proves the real backoff schedule without
 * waiting for it. A test that actually slept would be slow enough that somebody
 * would eventually shorten the delays to speed it up, and then the thing under
 * test would be the shortened version.
 */
export async function deliver<T>(
  send: (attempt: number) => Promise<T>,
  policy: RetryPolicy = DEFAULT_RETRY,
  sleep: (ms: number) => Promise<void> = (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
): Promise<DeliveryOutcome<T>> {
  const attempts: Attempt[] = [];
  const budget = Math.max(1, policy.attempts);

  for (let attempt = 1; attempt <= budget; attempt++) {
    try {
      const value = await send(attempt);

      return { ok: true, value, attempts };
    } catch (error) {
      const classified = (error as { classified?: Classified }).classified ?? classifyError(error);

      if (!shouldRetry(classified.kind, policy)) {
        attempts.push({ attempt, kind: classified.kind, detail: classified.detail });

        return {
          ok: false,
          attempts,
          kind: classified.kind,
          gaveUp:
            classified.kind === "ambiguous"
              ? `${AMBIGUOUS_REFUSAL} (${classified.detail})`
              : classified.detail,
        };
      }

      if (attempt >= budget) {
        attempts.push({ attempt, kind: classified.kind, detail: classified.detail });

        return {
          ok: false,
          attempts,
          kind: classified.kind,
          gaveUp: `Gave up after ${attempt} attempts. ${classified.detail}`,
        };
      }

      // Exponential, but the provider's own number wins when it gave one. Ours
      // is a guess; theirs is an instruction, and ignoring it is how a rate
      // limit becomes a ban.
      const backoff = Math.min(policy.baseDelayMs * 2 ** (attempt - 1), policy.maxDelayMs);
      const waitedMs = classified.retryAfter ? Math.max(backoff, classified.retryAfter * 1000) : backoff;
      attempts.push({ attempt, kind: classified.kind, detail: classified.detail, waitedMs });
      await sleep(waitedMs);
    }
  }

  return { ok: false, attempts, gaveUp: "Exhausted every attempt." };
}

/* ── Rate floors ──────────────────────────────────────────────────────────── */

const lastCallAt = new Map<string, number>();

/**
 * Wait until this channel may be used again.
 *
 * In-process only, and that is the correct scope for a host running on one
 * machine. A host that fans out across processes owns the coordination, because
 * the package cannot see the other senders and pretending otherwise would be a
 * limiter that reports success while doing nothing.
 */
export async function respectRate(
  channel: string,
  minIntervalMs: number,
  now: () => number = () => Date.now(),
  sleep: (ms: number) => Promise<void> = (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
): Promise<{ waitedMs: number }> {
  if (minIntervalMs <= 0) return { waitedMs: 0 };

  const previous = lastCallAt.get(channel);
  const at = now();
  const waitedMs = previous === undefined ? 0 : Math.max(0, previous + minIntervalMs - at);

  if (waitedMs > 0) await sleep(waitedMs);
  lastCallAt.set(channel, at + waitedMs);

  return { waitedMs };
}

/** Only for tests — the map is module-global and would leak between them. */
export function resetRateState(): void {
  lastCallAt.clear();
}

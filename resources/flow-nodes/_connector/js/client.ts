// GENERATED from @particle-academy/fancy-connectors — src/client.ts
// Do not edit here. Fix it in the package and re-run `php artisan flow:build`;
// a test fails the build when this copy and the package disagree.

/**
 * The one call path every connector uses.
 *
 * A connector never chooses between "call the provider" and "call the faker" —
 * it describes the request it wants and hands it here. That is the point: the
 * code path a consumer develops against with no credentials is the same code
 * path that runs in production, so fixtures prove something about the connector
 * rather than about a mock.
 *
 * ```ts
 * const charge = await callConnector(STRIPE, {
 *   operation: "charge_create",
 *   credentials,
 *   request: { method: "POST", path: "/v1/charges", form: { amount, currency } },
 *   idempotencyKey,
 *   idempotent: true,
 * });
 * ```
 *
 * ## What changed from the first version of this runtime, and why
 *
 * The old loop caught a thrown transport, called it transient, and retried it.
 * A thrown transport includes a **timeout**, which may be a request the provider
 * received and acted on — so on a connector with no idempotency key that retry
 * is a silent double write. Retrying is now a function of the classification AND
 * the connector's declared idempotency, and `idempotent` defaults to `false`
 * because a connector that has not thought about it must not be assumed safe.
 *
 * See `delivery.ts` for the full table.
 */

import {
  DEFAULT_RETRY,
  deliver,
  type Attempt,
  type Classified,
  type DeliveryOutcome,
  type FailureKind,
} from "./delivery";
import {
  classifyHttp,
  classifyThrown,
  ConnectorConfigError,
  ConnectorError,
  type ConnectorErrorContext,
} from "./errors";
import { fakeRequest, type ConnectorFaker } from "./faker";
import type { ConnectorMode, RequestedMode, SandboxKind } from "./mode";
import {
  resolveConnection,
  type ConnectionCredentials,
  type ResolvedConnection,
} from "./connection";

/**
 * Everything true of a SERVICE rather than of one operation.
 *
 * One per provider, declared once and shared by that provider's connectors. It
 * is data — base URLs, required credential keys, how the sandbox is selected —
 * so that facts verified against provider documentation live in exactly one
 * reviewable place instead of being retyped into each connector.
 */
export type ServiceDescriptor = {
  service: string;
  title: string;
  sandbox: SandboxKind;
  /**
   * Base URL per mode. A `credential`-sandbox provider gives the same URL for
   * both, which is itself worth writing down: it is why a live key pointed at
   * "sandbox" quietly reaches production.
   */
  baseUrls: Partial<Record<ConnectorMode, string>>;
  /** Credential keys a remote call cannot proceed without. */
  requires: string[];
  /**
   * Apply the provider's auth scheme to an outgoing request.
   *
   * A FUNCTION rather than a declarative header name, because there is no common
   * shape: the key can be a header (under any of a dozen names), a Basic
   * username with a blank password, a query parameter, a body field, or a URL
   * path segment — and several providers need more than one at once. It receives
   * the resolved mode too, because for some providers auth and estate are the
   * same decision expressed in the URL.
   */
  authorize: (
    credentials: ConnectionCredentials,
    request: PreparedRequest,
    mode: ConnectorMode,
  ) => void | Promise<void>;
  /** The service's faker. Required — see `faker.ts`. */
  faker: ConnectorFaker;
  /** Header the provider uses for idempotency, when it has one. */
  idempotencyHeader?: string;
};

export type ConnectorRequest = {
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  path: string;
  query?: Record<string, string | number | boolean | undefined>;
  headers?: Record<string, string>;
  /** JSON body. Mutually exclusive with `form`. */
  json?: unknown;
  /** `application/x-www-form-urlencoded` body — what several payment APIs want. */
  form?: Record<string, string | number | boolean | undefined>;
};

export type PreparedRequest = {
  method: string;
  url: string;
  headers: Record<string, string>;
  body?: string;
};

/** The HTTP seam. A host may swap it; nothing here assumes a browser or Node. */
export type Transport = (request: PreparedRequest) => Promise<TransportResponse>;

export type TransportResponse = {
  status: number;
  headers: Record<string, string>;
  body: string;
};

export type CallOptions = {
  operation: string;
  /**
   * Credentials, passed IN.
   *
   * **Nothing in this package reads `process.env`.** A host stores values
   * wherever it stores values — a gitignored file behind a whitelist, a secret
   * manager, a Laravel config — and hands them over per call. A package that
   * reached for the environment itself would bypass that discipline entirely,
   * and a test in this repo asserts that it does not.
   *
   * Omit to resolve through a registered connection host instead; see
   * `connection.ts`.
   */
  credentials?: ConnectionCredentials;
  /** Which estate to use. Resolved from the connection host when omitted. */
  mode?: ConnectorMode;
  /** Connection id, for the registered-host path. */
  connectionId?: string | null;
  /**
   * The caller's own config for this call.
   *
   * Passed to the faker so its output is deterministic, and read for
   * `connection` and `mode` when those were not given explicitly — which is what
   * a workflow node stores them in. Explicit arguments always win; this is a
   * convenience for a host whose configuration IS a config object, not a second
   * source of truth.
   */
  config?: Record<string, unknown>;
  input?: unknown;
  request: ConnectorRequest;
  /**
   * Value for the provider's idempotency header. Derive it from the run and the
   * step, never a fresh uuid: the entire point is that a RETRY carries the same
   * key. See `idempotency.ts`.
   */
  idempotencyKey?: string;
  /**
   * Whether repeating this exact request is harmless.
   *
   * **Defaults to `false`.** The only thing that makes an ambiguous failure
   * retryable, so it is opt-in and has to be true because the provider makes it
   * true — not because a retry would be convenient.
   */
  idempotent?: boolean;
  /** Retry budget for retryable failures. Total attempts, including the first. */
  attempts?: number;
  /** Override the transport for this call. Otherwise the registered one, then `fetch`. */
  transport?: Transport;
  /**
   * Called for each FAILED attempt once the call has finished, so a host can
   * journal what actually happened. A call that worked on the third try is a
   * different operational fact from one that worked immediately.
   *
   * A callback rather than a field on the result, because the result is a
   * published shape and this is a diagnostic — see `ConnectorResult`.
   */
  onAttempt?: (attempt: Attempt) => void;
};

/**
 * What a connector call returns, alongside the provider's own payload.
 *
 * The mode is REPORTED, never inferred by the caller. A call that emitted the
 * provider's data alone would leave every downstream reader — a human, an agent,
 * a log — unable to tell a faked result from a real one, which is the single
 * most important fact about a connector run.
 *
 * **Retry history is deliberately NOT here.** It was, briefly, and the flow
 * node marketplace's cross-runtime fixtures caught it immediately: this object
 * is published on a node's output port and referenced by templates and agents,
 * and PHP's `ConnectorResult::toArray()` does not carry it. Two runtimes
 * publishing different shapes is the exact drift those fixtures exist to
 * prevent, and a diagnostic field is a poor reason to break it. Pass
 * `onAttempt` to observe retries.
 */
export type ConnectorResult<T = unknown> = {
  data: T;
  /** Which estate this actually ran against. Always reported, never inferred. */
  mode: ConnectorMode;
  connection: string;
};

let registeredTransport: Transport | null = null;

/** Install a transport. Only needed if the runtime has no global `fetch`. */
export function registerTransport(next: Transport | null): void {
  registeredTransport = next;
}

export async function callConnector<T = unknown>(
  service: ServiceDescriptor,
  options: CallOptions,
): Promise<ConnectorResult<T>> {
  const config = options.config ?? {};
  const connection = resolveConnection({
    service: service.service,
    operation: options.operation,
    connectionId: options.connectionId ?? readString(config, "connection"),
    requested: options.mode ?? (readString(config, "mode") as RequestedMode | null),
    credentials: options.credentials ?? null,
    sandbox: service.sandbox,
    baseUrls: service.baseUrls,
    requires: service.requires,
  });

  if (connection.mode === "fake") {
    return {
      data: service.faker(
        options.operation,
        fakeRequest(service.service, options.operation, config, options.input),
      ) as T,
      mode: "fake",
      connection: connection.id,
    };
  }

  const ctx: ConnectorErrorContext = { service: service.service, operation: options.operation };
  const prepared = await prepare(service, connection, options);
  const send = options.transport ?? registeredTransport ?? fetchTransport;

  const outcome = await deliver<unknown>(
    async () => {
      let response: TransportResponse;

      try {
        response = await send(prepared);
      } catch (cause) {
        // classifyThrown decides unreachable vs ambiguous. It never returns a
        // 5xx-shaped "transient", because nothing here reached the provider.
        throw classifyThrown(cause, ctx);
      }

      if (response.status < 400) {
        return response.body.trim() === "" ? null : parseJson(response.body, ctx);
      }

      throw classifyHttp(response.status, ctx, response.body, readRetryAfter(response.headers));
    },
    {
      ...DEFAULT_RETRY,
      attempts: options.attempts ?? DEFAULT_RETRY.attempts,
      idempotent: options.idempotent ?? false,
    },
  );

  if (options.onAttempt) {
    for (const attempt of outcome.attempts) options.onAttempt(attempt);
  }

  if (!outcome.ok) {
    throw failureFrom(outcome, ctx, options.idempotent ?? false);
  }

  return { data: outcome.value as T, mode: connection.mode, connection: connection.id };
}

/**
 * Turn an exhausted delivery into the error a host sees.
 *
 * An ambiguous failure on a non-idempotent connector gets a message that says
 * *go and look*, because that is the action. "Request failed" would send someone
 * to re-run it, which is the one thing that must not happen.
 */
function failureFrom(
  outcome: DeliveryOutcome<unknown>,
  ctx: ConnectorErrorContext,
  idempotent: boolean,
): ConnectorError {
  const last = outcome.attempts.at(-1);
  const kind: FailureKind = outcome.kind ?? last?.kind ?? "ambiguous";
  const error = new ConnectorError(outcome.gaveUp ?? `${ctx.service}.${ctx.operation} failed.`, ctx);

  // `kind` is readonly on the class; this is the one place that knows the
  // aggregate answer across attempts, so it is set here rather than guessed.
  Object.defineProperty(error, "kind", { value: kind, enumerable: false });
  Object.defineProperty(error, "attempts", { value: outcome.attempts, enumerable: false });
  Object.defineProperty(error, "idempotent", { value: idempotent, enumerable: false });

  return error;
}

async function prepare(
  service: ServiceDescriptor,
  connection: ResolvedConnection,
  options: CallOptions,
): Promise<PreparedRequest> {
  const base = connection.baseUrl ?? service.baseUrls[connection.mode];

  if (!base) {
    throw new ConnectorConfigError(
      `${service.service}: no base URL for "${connection.mode}" mode. ` +
        "The service descriptor must declare one per mode it supports.",
      { service: service.service, operation: options.operation },
    );
  }

  const { method, path, query, headers, json, form } = options.request;
  const url = new URL(path.replace(/^\/+/, ""), base.endsWith("/") ? base : `${base}/`);

  for (const [key, value] of Object.entries(query ?? {})) {
    if (value !== undefined) url.searchParams.set(key, String(value));
  }

  const prepared: PreparedRequest = {
    method,
    url: url.toString(),
    headers: { Accept: "application/json", ...headers },
  };

  if (form) {
    prepared.headers["Content-Type"] = "application/x-www-form-urlencoded";
    prepared.body = encodeForm(form);
  } else if (json !== undefined) {
    prepared.headers["Content-Type"] = "application/json";
    prepared.body = JSON.stringify(json);
  }

  if (options.idempotencyKey && service.idempotencyHeader) {
    prepared.headers[service.idempotencyHeader] = options.idempotencyKey;
  }

  await service.authorize(connection.credentials, prepared, connection.mode);

  return prepared;
}

/**
 * Form encoding, including the bracketed nesting several payment APIs use
 * (`metadata[order_id]=7`). Flat maps pass through unchanged.
 */
function encodeForm(form: Record<string, unknown>): string {
  const pairs: string[] = [];

  const walk = (prefix: string, value: unknown): void => {
    if (value === undefined || value === null) return;

    if (Array.isArray(value)) {
      value.forEach((item, index) => walk(`${prefix}[${index}]`, item));

      return;
    }

    if (typeof value === "object") {
      for (const [key, nested] of Object.entries(value as Record<string, unknown>)) {
        walk(prefix === "" ? key : `${prefix}[${key}]`, nested);
      }

      return;
    }

    pairs.push(`${encodeURIComponent(prefix)}=${encodeURIComponent(String(value))}`);
  };

  walk("", form);

  return pairs.join("&");
}

const fetchTransport: Transport = async (request) => {
  const globalFetch = (globalThis as { fetch?: typeof fetch }).fetch;

  if (!globalFetch) {
    throw new Error(
      "no global fetch in this runtime — call registerTransport() with one before running a connector remotely.",
    );
  }

  const response = await globalFetch(request.url, {
    method: request.method,
    headers: request.headers,
    ...(request.body === undefined ? {} : { body: request.body }),
  });

  const headers: Record<string, string> = {};
  response.headers.forEach((value, key) => {
    headers[key.toLowerCase()] = value;
  });

  return { status: response.status, headers, body: await response.text() };
};

function parseJson(body: string, ctx: ConnectorErrorContext): unknown {
  try {
    return JSON.parse(body);
  } catch {
    // A body that is not JSON on a 2xx is a REJECTION, not something to retry:
    // the same request will produce the same unparseable body.
    const error = new ConnectorError(
      `${ctx.service}.${ctx.operation}: the provider returned a body that is not JSON.`,
      ctx,
    );
    Object.defineProperty(error, "kind", { value: "rejected", enumerable: false });

    throw error;
  }
}

function readRetryAfter(headers: Record<string, string>): number | undefined {
  const raw = headers["retry-after"];
  if (!raw) return undefined;
  const seconds = Number(raw);

  return Number.isFinite(seconds) ? seconds : undefined;
}

export type { Classified };

function readString(config: Record<string, unknown>, key: string): string | null {
  const value = config[key];

  return typeof value === "string" && value.trim() !== "" ? value.trim() : null;
}

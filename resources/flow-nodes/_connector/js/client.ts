/**
 * The one call path every connector node uses.
 *
 * A node's executor never chooses between "call the provider" and "call the
 * faker" — it describes the request it wants and hands it here. That is the
 * point: the code path a consumer develops against with no credentials is the
 * same code path that runs in production, so the fixtures prove something about
 * the executor rather than about a mock.
 *
 * ```ts
 * const charge = await callConnector(STRIPE, {
 *   operation: "charge_create",
 *   config,
 *   input: ctx.inputs.in,
 *   request: { method: "POST", path: "/v1/charges", form: { amount, currency } },
 *   idempotencyKey: `${ctx.node.id}:${runKey}`,
 * });
 * ```
 */

import { resolveConnection, type ConnectionCredentials, type ResolvedConnection } from "./connection";
import { classifyHttp, ConnectorConfigError, ConnectorError, ConnectorTransient } from "./errors";
import { fakeRequest, type ConnectorFaker } from "./faker";
import type { ConnectorMode, RequestedMode, SandboxKind } from "./mode";

/**
 * Everything true of a SERVICE rather than of one operation.
 *
 * One of these per provider, declared once and shared by that provider's nodes.
 * It is data — base URLs, which credential keys are required, how the sandbox
 * is selected — so that facts we verified against provider documentation live
 * in exactly one reviewable place instead of being retyped into each node.
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
   * Receives the resolved MODE as well, because for some providers auth and
   * estate are the same decision expressed in the URL — Telegram puts the bot
   * token in the path and selects its test environment with a `/test` segment
   * after it. A signature that hid the mode would push those providers towards
   * a global, which is the thing this seam exists to avoid.
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

export type CallOptions = {
  operation: string;
  config: Record<string, unknown>;
  input?: unknown;
  request: ConnectorRequest;
  /**
   * Value for the provider's idempotency header. Pass something derived from
   * the run and the node, never a fresh uuid: the entire point is that a RETRY
   * carries the same key.
   */
  idempotencyKey?: string;
  /** Retry budget for retryable failures. Defaults to 2 extra attempts. */
  retries?: number;
};

/** The HTTP seam. A host may swap it; nothing here assumes a browser or Node. */
export type Transport = (request: PreparedRequest) => Promise<TransportResponse>;

export type TransportResponse = {
  status: number;
  headers: Record<string, string>;
  body: string;
};

let transport: Transport | null = null;

/** Install a transport. Only needed if the runtime has no global `fetch`. */
export function registerTransport(next: Transport | null): void {
  transport = next;
}

/** What a connector call returns, alongside the provider's own payload. */
export type ConnectorResult<T = unknown> = {
  data: T;
  /** Which estate this actually ran against. Always reported, never inferred. */
  mode: ConnectorMode;
  connection: string;
};

export async function callConnector<T = unknown>(
  service: ServiceDescriptor,
  options: CallOptions,
): Promise<ConnectorResult<T>> {
  const connection = resolveConnection({
    service: service.service,
    operation: options.operation,
    connectionId: readString(options.config, "connection"),
    requested: readString(options.config, "mode") as RequestedMode | null,
    sandbox: service.sandbox,
    baseUrls: service.baseUrls,
    requires: service.requires,
  });

  if (connection.mode === "fake") {
    return {
      data: service.faker(
        options.operation,
        fakeRequest(service.service, options.operation, options.config, options.input),
      ) as T,
      mode: "fake",
      connection: connection.id,
    };
  }

  return {
    data: (await remoteCall(service, connection, options)) as T,
    mode: connection.mode,
    connection: connection.id,
  };
}

async function remoteCall(
  service: ServiceDescriptor,
  connection: ResolvedConnection,
  options: CallOptions,
): Promise<unknown> {
  const prepared = await prepare(service, connection, options);
  const send = transport ?? fetchTransport;
  const ctx = { service: service.service, operation: options.operation };
  const budget = options.retries ?? 2;
  let attempt = 0;

  for (;;) {
    let response: TransportResponse;

    try {
      response = await send(prepared);
    } catch (cause) {
      // A thrown transport is a network-level failure: unreachable, reset,
      // timed out. Retryable by nature, and distinct from a 5xx, which at
      // least proves we reached something.
      const error = new ConnectorTransient(
        `${ctx.service}.${ctx.operation}: ${(cause as Error)?.message ?? "transport failed"}`,
        ctx,
      );
      if (attempt++ >= budget) throw error;
      await sleep(backoffMs(attempt));

      continue;
    }

    if (response.status < 400) {
      return response.body.trim() === "" ? null : parseJson(response.body, ctx);
    }

    const error = classifyHttp(
      response.status,
      ctx,
      response.body,
      readRetryAfter(response.headers),
    );

    if (!error.retryable || attempt++ >= budget) throw error;

    // Honour the provider's own instruction when it gave one. Guessing shorter
    // than they asked is how a throttle becomes a ban.
    const wait = "retryAfter" in error && typeof error.retryAfter === "number"
      ? error.retryAfter * 1000
      : backoffMs(attempt);
    await sleep(wait);
  }
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
 * Form encoding, including the bracketed-nesting several payment APIs use
 * (`metadata[order_id]=7`). Flat maps pass through unchanged.
 */
function encodeForm(form: Record<string, unknown>): string {
  const pairs: string[] = [];

  const walk = (prefix: string, value: unknown): void => {
    if (value === undefined || value === null) return;
    if (typeof value === "object" && !Array.isArray(value)) {
      for (const [key, nested] of Object.entries(value as Record<string, unknown>)) {
        walk(prefix === "" ? key : `${prefix}[${key}]`, nested);
      }

      return;
    }
    if (Array.isArray(value)) {
      value.forEach((item, index) => walk(`${prefix}[${index}]`, item));

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

function parseJson(body: string, ctx: { service: string; operation: string }): unknown {
  try {
    return JSON.parse(body);
  } catch {
    throw new ConnectorError(
      `${ctx.service}.${ctx.operation}: the provider returned a body that is not JSON.`,
      ctx,
    );
  }
}

function readRetryAfter(headers: Record<string, string>): number | undefined {
  const raw = headers["retry-after"];
  if (!raw) return undefined;
  const seconds = Number(raw);

  return Number.isFinite(seconds) ? seconds : undefined;
}

/** Exponential with a ceiling. Attempt 1 → 250ms, 2 → 500ms, 3 → 1s, capped at 8s. */
function backoffMs(attempt: number): number {
  return Math.min(8000, 250 * 2 ** (attempt - 1));
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function readString(config: Record<string, unknown>, key: string): string | null {
  const value = config[key];

  return typeof value === "string" && value.trim() !== "" ? value.trim() : null;
}

// GENERATED from @particle-academy/fancy-connector-core — src/webhook.ts
// Do not edit here. Fix it in the package and re-run `node scripts/vendor.mjs --target <this directory>` there;
// a test fails the build when this copy and the package disagree.

/**
 * Verifying an inbound provider webhook.
 *
 * An unverified webhook endpoint is a public, unauthenticated way to start a
 * workflow in someone's account — which is to say, a way for a stranger to make
 * your app refund an order or post to your Slack. So verification is part of the
 * connector pattern rather than an exercise for the host: a trigger node that
 * cannot verify its deliveries must say so, and a host must not be able to mount
 * one by accident.
 *
 * ## The three things every provider's scheme actually needs
 *
 * Providers differ in header names and in what exactly gets signed, and almost
 * nothing else:
 *
 * 1. **The RAW body.** Signatures are computed over bytes. Re-serialising parsed
 *    JSON changes key order and whitespace and produces a signature mismatch
 *    that looks like a wrong secret. The host must pass the body it received.
 * 2. **A constant-time comparison.** `===` on a signature leaks, through timing,
 *    which prefix was right. That is a real forgery path, not a theoretical one.
 * 3. **A timestamp tolerance.** Without it a valid signature is valid forever,
 *    so anyone who ever saw one delivery can replay it whenever they like.
 *
 * WebCrypto rather than `node:crypto`, so the same file runs on Node, Bun, Deno
 * and an edge runtime. Node 22 is the suite's floor and has it globally.
 */

export type WebhookVerification =
  | { ok: true }
  | { ok: false; reason: string };

export type HmacScheme = {
  /**
   * Optional and always `"hmac"`: every scheme written before 0.8.0 omits it
   * and still means HMAC. It exists so `verifyDelivery` dispatches on a NAMED
   * kind — `"shared-token"`, `"hmac"` or absent — and refuses any other value
   * by name, rather than treating "has no kind" as HMAC forever. (Fancy's
   * alignment review of 0.8.0: a third scheme that forgot its kind would
   * otherwise be verified as HMAC, silently.)
   */
  kind?: "hmac";
  /** Hash to use. */
  algorithm: "SHA-256" | "SHA-1" | "SHA-512";
  /**
   * Build the exact string that gets signed. Providers differ here more than
   * anywhere else — Stripe signs `${timestamp}.${body}`, Slack signs
   * `v0:${timestamp}:${body}`, GitHub signs the body alone, and Svix signs
   * `${id}.${timestamp}.${body}` where `id` is the delivery's own id header.
   */
  payload: (raw: string, timestamp?: string, id?: string) => string;
  /** Seconds a delivery stays acceptable. */
  tolerance?: number;
  /** Encoding of the signature the provider sends. */
  encoding?: "hex" | "base64";
  /**
   * How the SECRET is spelled. `utf8` (the default, and every provider before
   * Svix): the key is the text's bytes. `base64`: the key is the DECODED
   * bytes — Svix hands out `whsec_<base64>`, and half of the decoded bytes are
   * not valid UTF-8, so encoding the text would sign with the wrong key and
   * fail exactly like a wrong secret.
   */
  secretEncoding?: "utf8" | "base64";
  /** A prefix to strip before decoding (`whsec_`). Its absence is a refusal, never a guess. */
  secretPrefix?: string;
};

/** The HMAC key a scheme's secret spells, or the reason it cannot be one. */
export function secretKeyBytes(
  secret: string,
  options: { secretEncoding?: "utf8" | "base64"; secretPrefix?: string } = {},
): { bytes: Uint8Array } | { reason: string } {
  let material = secret;

  if (options.secretPrefix !== undefined) {
    if (!material.startsWith(options.secretPrefix)) {
      return { reason: `signing secret does not start with ${JSON.stringify(options.secretPrefix)}` };
    }
    material = material.slice(options.secretPrefix.length);
  }

  if ((options.secretEncoding ?? "utf8") === "base64") {
    // Strict: `atob` is lenient about whitespace and a trailing `=` or two,
    // and lenient decoding of a key is a key nobody can reason about.
    if (!/^[A-Za-z0-9+/]*={0,2}$/.test(material) || material.length % 4 !== 0) {
      return { reason: "signing secret is not valid base64" };
    }
    try {
      return { bytes: Uint8Array.from(atob(material), (c) => c.charCodeAt(0)) };
    } catch {
      return { reason: "signing secret is not valid base64" };
    }
  }

  return { bytes: new TextEncoder().encode(material) };
}

/**
 * Verify an HMAC-signed delivery.
 *
 * Returns a RESULT rather than throwing, and the failure carries a reason: a
 * host wants to log which check failed (stale? wrong secret? no header?) while
 * still answering the provider with an opaque 400.
 */
export async function verifyHmac(options: {
  raw: string;
  /**
   * The signature(s) the delivery carried. A LIST when the provider sends
   * several — Stripe signs once per active secret while a secret is rolled
   * and Svix's header "could be any number of signatures" — and the delivery
   * is accepted when ANY matches. A first-only rule fails every delivery
   * whose first signature came from the new secret, for the whole roll, and
   * it reads exactly like a wrong secret.
   */
  signature: string | string[] | undefined;
  secret: string | undefined;
  scheme: HmacScheme;
  timestamp?: string;
  /** The delivery's id, when the scheme signs one (Svix's `svix-id`). */
  id?: string;
  /** Seconds since the epoch. Injected so tests are not clock-dependent. */
  now?: number;
}): Promise<WebhookVerification> {
  const { raw, secret, scheme, timestamp, id } = options;
  const signatures = (Array.isArray(options.signature) ? options.signature : [options.signature]).filter(
    (s): s is string => typeof s === "string" && s !== "",
  );

  if (!secret) {
    // Never "accept when unconfigured". An endpoint that verifies nothing
    // because nobody set a secret is strictly worse than one that is off: it
    // looks protected.
    return { ok: false, reason: "no signing secret configured for this trigger" };
  }
  if (signatures.length === 0) return { ok: false, reason: "delivery carried no signature header" };

  if (scheme.tolerance !== undefined) {
    if (!timestamp) return { ok: false, reason: "delivery carried no timestamp header" };

    const sent = Number(timestamp);
    if (!Number.isFinite(sent)) return { ok: false, reason: "timestamp header is not a number" };

    const now = options.now ?? Math.floor(Date.now() / 1000);
    if (Math.abs(now - sent) > scheme.tolerance) {
      return { ok: false, reason: `delivery is outside the ${scheme.tolerance}s replay window` };
    }
  }

  // The key is checked BEFORE anything is signed, so a secret that cannot be
  // a key is named as such rather than producing a mismatch that reads like
  // a wrong secret.
  const key = secretKeyBytes(secret, scheme);
  if ("reason" in key) return { ok: false, reason: key.reason };

  const expected = await hmac(secret, scheme.payload(raw, timestamp, id), scheme.algorithm, scheme.encoding ?? "hex", scheme);

  // Each candidate is compared in constant time; which of them matched is not
  // a secret, so stopping at the first match leaks nothing.
  return signatures.some((candidate) => constantTimeEquals(expected, candidate))
    ? { ok: true }
    : { ok: false, reason: "signature did not match" };
}

/**
 * HMAC of `payload` under `secret`, hex or base64 encoded. `options` says how
 * the secret is spelled (see `HmacScheme.secretEncoding`); a secret that
 * cannot be a key THROWS here — signing has no result to carry a reason in —
 * while `verifyHmac` names it in its result before ever calling this.
 */
export async function hmac(
  secret: string,
  payload: string,
  algorithm: HmacScheme["algorithm"],
  encoding: "hex" | "base64" = "hex",
  options: { secretEncoding?: "utf8" | "base64"; secretPrefix?: string } = {},
): Promise<string> {
  const subtle = globalThis.crypto?.subtle;

  if (!subtle) {
    throw new Error(
      "WebCrypto is not available in this runtime, so webhook signatures cannot be verified. " +
        "Refusing to accept deliveries unverified.",
    );
  }

  const material = secretKeyBytes(secret, options);
  if ("reason" in material) throw new Error(material.reason);

  const encoder = new TextEncoder();
  const key = await subtle.importKey(
    "raw",
    material.bytes as BufferSource,
    { name: "HMAC", hash: algorithm },
    false,
    ["sign"],
  );
  const bytes = new Uint8Array(await subtle.sign("HMAC", key, encoder.encode(payload)));

  if (encoding === "base64") {
    let binary = "";
    bytes.forEach((byte) => {
      binary += String.fromCharCode(byte);
    });

    return btoa(binary);
  }

  return Array.from(bytes)
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * Compare two strings without leaking where they diverge.
 *
 * The length check first is deliberate and safe: a signature's length is fixed
 * by its algorithm and is not a secret, so revealing a mismatch there tells an
 * attacker nothing they could not compute.
 */
export function constantTimeEquals(a: string, b: string): boolean {
  if (a.length !== b.length) return false;

  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);

  return diff === 0;
}

/**
 * A delivery verified by a token the provider ECHOES rather than a signature
 * it computes.
 *
 * Google Calendar sends the channel's `token` back in `X-Goog-Channel-Token`
 * on every notification — with an EMPTY body, so there is nothing to sign.
 * Microsoft Graph sends `clientState` inside every item of the notification's
 * `value` array. Same refusal-by-default as HMAC, same result shape, and a
 * constant-time comparison: a token is a secret, and `===` leaks which prefix
 * was right.
 *
 * A body `path` is dotted; a segment ending in `[]` means EVERY element of that
 * array, all of which must match — one wrong item refuses the whole delivery.
 */
export type SharedTokenScheme =
  | { kind: "shared-token"; in: "header"; name: string }
  | { kind: "shared-token"; in: "body"; path: string };

export function isSharedTokenScheme(scheme: HmacScheme | SharedTokenScheme): scheme is SharedTokenScheme {
  return "kind" in scheme && scheme.kind === "shared-token";
}

export function verifySharedToken(options: {
  raw: string;
  headers: Record<string, string | string[] | undefined>;
  secret: string | undefined;
  scheme: SharedTokenScheme;
}): WebhookVerification {
  const { raw, headers, secret, scheme } = options;

  if (!secret) {
    // Never "accept when unconfigured" — the same rule as verifyHmac, for the
    // same reason: an endpoint that verifies nothing LOOKS protected.
    return { ok: false, reason: "no shared token configured for this trigger" };
  }

  let tokens: unknown[];
  if (scheme.in === "header") {
    tokens = [header(headers, scheme.name)];
  } else {
    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch {
      return { ok: false, reason: "delivery body is not JSON" };
    }
    tokens = readTokens(parsed, scheme.path.split("."));
  }

  const present = tokens.filter((t) => t !== undefined && t !== null && t !== "");
  if (present.length === 0) return { ok: false, reason: "delivery carried no token" };

  // Every element is compared, none is skipped: a batch is accepted as a whole
  // or refused as a whole.
  let matched = present.length === tokens.length;
  for (const token of present) {
    matched = (typeof token === "string" && constantTimeEquals(secret, token)) && matched;
  }

  return matched ? { ok: true } : { ok: false, reason: "token did not match" };
}

/** Every value at a dotted path; a `[]` segment fans out over an array. Absent is `undefined`. */
function readTokens(value: unknown, segments: string[]): unknown[] {
  if (segments.length === 0) return [value];

  const [head, ...rest] = segments as [string, ...string[]];
  const eachElement = head.endsWith("[]");
  const key = eachElement ? head.slice(0, -2) : head;

  if (value === null || typeof value !== "object") return [undefined];
  const next = (value as Record<string, unknown>)[key];

  if (!eachElement) return readTokens(next, rest);
  if (!Array.isArray(next)) return [undefined];

  return next.flatMap((element) => readTokens(element, rest));
}

/**
 * A challenge the provider makes BEFORE it will deliver anything, answered by
 * echoing a query parameter as plain text. Microsoft Graph POSTs
 * `?validationToken=…` to the notification URL when a subscription is created
 * and refuses to create it unless the token comes back, decoded, as
 * `text/plain` within ten seconds.
 *
 * Declared as data on the trigger so a host can answer it in its own routing
 * layer; `handshakeResponse` is the pure half — what to send, or `undefined`
 * when the request is not a challenge at all.
 */
export type ChallengeHandshake = {
  kind: "echo-query";
  /** The query parameter carrying the challenge. */
  param: string;
  contentType?: "text/plain";
};

export function handshakeResponse(
  handshake: ChallengeHandshake | undefined,
  query: Record<string, string | string[] | undefined>,
): { status: 200; contentType: string; body: string } | undefined {
  if (!handshake) return undefined;

  const raw = query[handshake.param];
  const token = Array.isArray(raw) ? raw[0] : raw;
  if (!token) return undefined;

  return { status: 200, contentType: handshake.contentType ?? "text/plain", body: token };
}

/**
 * Pull one header case-insensitively.
 *
 * Header case is not preserved consistently across proxies, frameworks and
 * runtimes; a connector that read `req.headers["Stripe-Signature"]` would work
 * behind one server and reject every delivery behind another.
 */
export function header(headers: Record<string, string | string[] | undefined>, name: string): string | undefined {
  const wanted = name.toLowerCase();

  for (const [key, value] of Object.entries(headers)) {
    if (key.toLowerCase() !== wanted) continue;

    return Array.isArray(value) ? value[0] : value;
  }

  return undefined;
}

// GENERATED from @particle-academy/fancy-connectors — src/webhook.ts
// Do not edit here. Fix it in the package and re-run `php artisan flow:build`;
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
  /** Hash to use. */
  algorithm: "SHA-256" | "SHA-1" | "SHA-512";
  /**
   * Build the exact string that gets signed. Providers differ here more than
   * anywhere else — Stripe signs `${timestamp}.${body}`, Slack signs
   * `v0:${timestamp}:${body}`, GitHub signs the body alone.
   */
  payload: (raw: string, timestamp?: string) => string;
  /** Seconds a delivery stays acceptable. */
  tolerance?: number;
  /** Encoding of the signature the provider sends. */
  encoding?: "hex" | "base64";
};

/**
 * Verify an HMAC-signed delivery.
 *
 * Returns a RESULT rather than throwing, and the failure carries a reason: a
 * host wants to log which check failed (stale? wrong secret? no header?) while
 * still answering the provider with an opaque 400.
 */
export async function verifyHmac(options: {
  raw: string;
  signature: string | undefined;
  secret: string | undefined;
  scheme: HmacScheme;
  timestamp?: string;
  /** Seconds since the epoch. Injected so tests are not clock-dependent. */
  now?: number;
}): Promise<WebhookVerification> {
  const { raw, signature, secret, scheme, timestamp } = options;

  if (!secret) {
    // Never "accept when unconfigured". An endpoint that verifies nothing
    // because nobody set a secret is strictly worse than one that is off: it
    // looks protected.
    return { ok: false, reason: "no signing secret configured for this trigger" };
  }
  if (!signature) return { ok: false, reason: "delivery carried no signature header" };

  if (scheme.tolerance !== undefined) {
    if (!timestamp) return { ok: false, reason: "delivery carried no timestamp header" };

    const sent = Number(timestamp);
    if (!Number.isFinite(sent)) return { ok: false, reason: "timestamp header is not a number" };

    const now = options.now ?? Math.floor(Date.now() / 1000);
    if (Math.abs(now - sent) > scheme.tolerance) {
      return { ok: false, reason: `delivery is outside the ${scheme.tolerance}s replay window` };
    }
  }

  const expected = await hmac(secret, scheme.payload(raw, timestamp), scheme.algorithm, scheme.encoding ?? "hex");

  return constantTimeEquals(expected, signature)
    ? { ok: true }
    : { ok: false, reason: "signature did not match" };
}

/** HMAC of `payload` under `secret`, hex or base64 encoded. */
export async function hmac(
  secret: string,
  payload: string,
  algorithm: HmacScheme["algorithm"],
  encoding: "hex" | "base64" = "hex",
): Promise<string> {
  const subtle = globalThis.crypto?.subtle;

  if (!subtle) {
    throw new Error(
      "WebCrypto is not available in this runtime, so webhook signatures cannot be verified. " +
        "Refusing to accept deliveries unverified.",
    );
  }

  const encoder = new TextEncoder();
  const key = await subtle.importKey(
    "raw",
    encoder.encode(secret),
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

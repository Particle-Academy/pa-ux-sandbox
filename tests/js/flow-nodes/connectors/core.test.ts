import { afterEach, describe, expect, it } from "vitest";

import {
  ConnectorModeError,
  resolveConnectorMode,
  type SandboxKind,
} from "../../../../resources/flow-nodes/_connector/js/mode";
import {
  registerConnectionHost,
  resolveConnection,
} from "../../../../resources/flow-nodes/_connector/js/connection";
import { ConnectorConfigError } from "../../../../resources/flow-nodes/_connector/js/errors";
import { classifyHttp } from "../../../../resources/flow-nodes/_connector/js/errors";
import { fakeRequest, seedFrom } from "../../../../resources/flow-nodes/_connector/js/faker";
import { constantTimeEquals, hmac, verifyHmac } from "../../../../resources/flow-nodes/_connector/js/webhook";
import {
  parseStripeSignature,
  STRIPE_SIGNATURE_SCHEME,
} from "../../../../resources/flow-nodes/_stripe/js/service";
import { verifyStripeDelivery } from "../../../../resources/flow-nodes/_stripe/js/trigger";
import {
  ConnectorIdempotencyExpiredError,
  idempotencyKeyFor,
  MAX_IDEMPOTENCY_KEY_LENGTH,
} from "../../../../resources/flow-nodes/_connector/js/idempotency";
import { RunIdentity } from "@particle-academy/fancy-flow/engine";

afterEach(() => registerConnectionHost(null));

/**
 * The sandbox/live rule, as a table.
 *
 * This is the single most consequential decision in the connector pattern —
 * getting it wrong means a workflow talks to a real ledger while its author
 * believes otherwise — so it is asserted case by case rather than sampled.
 */
describe("resolveConnectorMode", () => {
  const base = {
    sandbox: "credential" as SandboxKind,
    hasSandboxCredentials: true,
    environment: { production: false },
  };

  it("defaults a local project to the provider's sandbox", () => {
    expect(resolveConnectorMode({ ...base, requested: "auto" })).toBe("sandbox");
  });

  it("defaults production to live", () => {
    expect(resolveConnectorMode({ ...base, environment: { production: true } })).toBe("live");
  });

  it("honours an explicit live on a LOCAL project — the environment is a default, not a cage", () => {
    expect(resolveConnectorMode({ ...base, requested: "live" })).toBe("live");
  });

  it("honours an explicit sandbox in PRODUCTION, so a connector can be staged before cutover", () => {
    expect(
      resolveConnectorMode({ ...base, requested: "sandbox", environment: { production: true } }),
    ).toBe("sandbox");
  });

  it("honours an explicit fake anywhere", () => {
    expect(resolveConnectorMode({ ...base, requested: "fake", environment: { production: true } })).toBe(
      "fake",
    );
  });

  it("lets a connection pin a mode, but an explicit ask still beats it", () => {
    expect(resolveConnectorMode({ ...base, connectionMode: "live" })).toBe("live");
    expect(resolveConnectorMode({ ...base, connectionMode: "live", requested: "fake" })).toBe("fake");
  });

  it("falls through to fake locally when the sandbox is not wired", () => {
    // The property that makes a freshly vendored node runnable with no setup.
    expect(resolveConnectorMode({ ...base, hasSandboxCredentials: false })).toBe("fake");
  });

  it("falls through to fake locally when the provider HAS no sandbox", () => {
    expect(resolveConnectorMode({ ...base, sandbox: "none" })).toBe("fake");
  });

  it("still goes live in production when the provider has no sandbox", () => {
    expect(
      resolveConnectorMode({ ...base, sandbox: "none", environment: { production: true } }),
    ).toBe("live");
  });

  it("refuses a sandbox the provider does not have, rather than quietly substituting one", () => {
    expect(() => resolveConnectorMode({ ...base, sandbox: "none", requested: "sandbox" })).toThrow(
      ConnectorModeError,
    );
  });
});

describe("resolveConnection", () => {
  const options = {
    service: "stripe",
    operation: "payment_intent_create",
    sandbox: "credential" as SandboxKind,
    requires: ["secretKey"],
  };

  it("resolves to fake with no host at all, so a vendored node runs before anything is configured", () => {
    expect(resolveConnection(options).mode).toBe("fake");
  });

  it("refuses a remote mode with no host instead of silently faking it", () => {
    // The failure this whole design exists to prevent: a run that "succeeded"
    // because it quietly stopped talking to the provider.
    expect(() => resolveConnection({ ...options, requested: "live" })).toThrow(ConnectorConfigError);
  });

  it("NEVER falls back to the faker when a remote mode is missing its credentials", () => {
    registerConnectionHost({
      environment: { production: true },
      connections: { stripe: { service: "stripe", live: {} } },
    });

    expect(() => resolveConnection(options)).toThrow(/has no secretKey for live mode/);
  });

  it("refuses a connection configured for a different service", () => {
    registerConnectionHost({
      environment: { production: false },
      connections: { stripe: { service: "slack", live: { secretKey: "x" } } },
    });

    expect(() => resolveConnection(options)).toThrow(/configured for the "slack" service/);
  });

  it("picks the sandbox credentials for sandbox mode and the live ones for live", () => {
    registerConnectionHost({
      environment: { production: false },
      connections: {
        stripe: {
          service: "stripe",
          live: { secretKey: "live-value" },
          sandbox: { secretKey: "sandbox-value" },
        },
      },
    });

    expect(resolveConnection(options).credentials.secretKey).toBe("sandbox-value");
    expect(resolveConnection({ ...options, requested: "live" }).credentials.secretKey).toBe("live-value");
  });

  it("hands back NO credentials in fake mode", () => {
    registerConnectionHost({
      environment: { production: false },
      connections: { stripe: { service: "stripe", live: { secretKey: "live-value" } } },
    });

    expect(resolveConnection({ ...options, requested: "fake" }).credentials).toEqual({});
  });
});

describe("the faker is deterministic", () => {
  it("gives the same values for the same inputs", () => {
    const a = fakeRequest("stripe", "payment_intent_create", { amount: 2500 });
    const b = fakeRequest("stripe", "payment_intent_create", { amount: 2500 });

    expect(a.fake.id("pi")).toBe(b.fake.id("pi"));
  });

  it("gives DIFFERENT values for different inputs, or a fixture proves nothing", () => {
    const a = fakeRequest("stripe", "payment_intent_create", { amount: 2500 });
    const b = fakeRequest("stripe", "payment_intent_create", { amount: 9900 });

    expect(a.fake.id("pi")).not.toBe(b.fake.id("pi"));
  });

  it("does not depend on key ORDER", () => {
    // Otherwise "same inputs, same output" would hold only for objects that
    // happened to be built in the same order — the kind of almost-true that
    // survives review and fails in a fixture months later.
    expect(seedFrom("stripe", "op", { a: 1, b: 2 })).toBe(seedFrom("stripe", "op", { b: 2, a: 1 }));
  });

  it("never reads the clock", () => {
    const { fake } = fakeRequest("stripe", "op", {});
    expect(fake.timestamp()).toBe("2026-01-01T00:00:00.000Z");
    expect(fake.timestamp(3600)).toBe("2026-01-01T01:00:00.000Z");
  });
});

describe("webhook verification", () => {
  const secret = "whsec-for-this-test-only";
  const body = '{"id":"evt_1","type":"charge.refunded"}';

  it("accepts a correctly signed Stripe delivery", async () => {
    const timestamp = "1767225600";
    const signature = await hmac(secret, `${timestamp}.${body}`, "SHA-256");

    const result = await verifyStripeDelivery(
      { raw: body, headers: { "stripe-signature": `t=${timestamp},v1=${signature}` } },
      secret,
      Number(timestamp),
    );

    expect(result).toEqual({ ok: true });
  });

  it("rejects a delivery outside the replay window even when the signature is valid", async () => {
    // Without a tolerance a valid signature is valid forever, so anyone who ever
    // saw one delivery could replay it whenever they liked.
    const timestamp = "1767225600";
    const signature = await hmac(secret, `${timestamp}.${body}`, "SHA-256");

    const result = await verifyStripeDelivery(
      { raw: body, headers: { "stripe-signature": `t=${timestamp},v1=${signature}` } },
      secret,
      Number(timestamp) + 400,
    );

    expect(result).toEqual({ ok: false, reason: "delivery is outside the 300s replay window" });
  });

  it("rejects a tampered body", async () => {
    const timestamp = "1767225600";
    const signature = await hmac(secret, `${timestamp}.${body}`, "SHA-256");

    const result = await verifyStripeDelivery(
      {
        raw: '{"id":"evt_1","type":"charge.refunded","amount":999999}',
        headers: { "stripe-signature": `t=${timestamp},v1=${signature}` },
      },
      secret,
      Number(timestamp),
    );

    expect(result).toEqual({ ok: false, reason: "signature did not match" });
  });

  it("REFUSES when no secret is configured, rather than accepting", async () => {
    // An endpoint that verifies nothing because nobody set a secret is strictly
    // worse than one that is off: it looks protected.
    const result = await verifyStripeDelivery(
      { raw: body, headers: { "stripe-signature": "t=1,v1=deadbeef" } },
      undefined,
    );

    expect(result.ok).toBe(false);
    expect(result).toMatchObject({ reason: expect.stringContaining("no signing secret") });
  });

  it("finds the signature header whatever case the proxy used", async () => {
    const timestamp = "1767225600";
    const signature = await hmac(secret, `${timestamp}.${body}`, "SHA-256");

    const result = await verifyStripeDelivery(
      { raw: body, headers: { "Stripe-Signature": `t=${timestamp},v1=${signature}` } },
      secret,
      Number(timestamp),
    );

    expect(result).toEqual({ ok: true });
  });

  it("parses Stripe's packed signature header", () => {
    expect(parseStripeSignature("t=123,v1=abc,v0=ignored")).toEqual({
      timestamp: "123",
      signature: "abc",
    });
  });

  it("declares a 300 second window and signs {timestamp}.{body}", () => {
    expect(STRIPE_SIGNATURE_SCHEME.tolerance).toBe(300);
    expect(STRIPE_SIGNATURE_SCHEME.payload("BODY", "42")).toBe("42.BODY");
  });

  it("compares in constant time and still compares correctly", () => {
    expect(constantTimeEquals("abc", "abc")).toBe(true);
    expect(constantTimeEquals("abc", "abd")).toBe(false);
    expect(constantTimeEquals("abc", "abcd")).toBe(false);
  });
});

describe("error classification decides whether a durable run may retry", () => {
  const ctx = { service: "stripe", operation: "payment_intent_create" };

  it("marks a 429 retryable — checked BEFORE the 4xx sweep", () => {
    // A rate limit is a 4xx and is the one 4xx worth retrying. Ordering the
    // checks the other way would mark every throttle permanent and turn a busy
    // minute into a failed run.
    const error = classifyHttp(429, ctx, "slow down", 12);
    expect(error.retryable).toBe(true);
    expect((error as { retryAfter?: number }).retryAfter).toBe(12);
  });

  it("marks 5xx retryable and 4xx not", () => {
    expect(classifyHttp(503, ctx, "").retryable).toBe(true);
    expect(classifyHttp(400, ctx, "").retryable).toBe(false);
    expect(classifyHttp(404, ctx, "").retryable).toBe(false);
  });

  it("never retries an auth failure — hammering a bad credential locks accounts", () => {
    expect(classifyHttp(401, ctx, "").retryable).toBe(false);
    expect(classifyHttp(403, ctx, "").retryable).toBe(false);
  });

  it("names the mode mismatch on an auth failure, because that is the usual cause", () => {
    expect(classifyHttp(401, ctx, "").message).toMatch(/live key in sandbox, or the reverse/);
  });
});

/**
 * The idempotency key, and the one case where a connector must refuse to write.
 *
 * Asserted line for line against `ConnectorsTest.php`, because a divergence here
 * means one backend deduplicates a retried payment and the other charges twice.
 */
describe("idempotency keys", () => {
  const ctxFor = (identity: RunIdentity | undefined, nodeId = "pay") => ({
    node: { id: nodeId, type: "stripe_payment_intent", position: { x: 0, y: 0 }, data: {} },
    inputs: {},
    run: identity,
  });

  it("derives a key from the run identity the engine supplies", () => {
    expect(idempotencyKeyFor(ctxFor(new RunIdentity("run_a")), "pay")).toBe("run_a:pay");
  });

  it("sends the SAME key on a retry of the same step", () => {
    // The money case. A key that moves with the attempt creates a second charge
    // on the first timeout, which is the failure the key exists to prevent.
    const first = idempotencyKeyFor(ctxFor(new RunIdentity("run_a", [], 1)), "pay");
    const retry = idempotencyKeyFor(ctxFor(new RunIdentity("run_a", [], 4)), "pay");

    expect(retry).toBe(first);
  });

  it("sends a DIFFERENT key for a different execution of the same node", () => {
    const a = idempotencyKeyFor(ctxFor(new RunIdentity("run_a")), "pay");
    const b = idempotencyKeyFor(ctxFor(new RunIdentity("run_b")), "pay");
    const nested = idempotencyKeyFor(ctxFor(new RunIdentity("run_a").descend("billing")), "pay");
    const looped = idempotencyKeyFor(ctxFor(new RunIdentity("run_a")), "pay", { occurrence: 2 });

    expect(new Set([a, b, nested, looped]).size).toBe(4);
  });

  it("REFUSES a retry once the provider's window has elapsed", () => {
    // Past the window Stripe has forgotten the key, so resending it and minting
    // a fresh one BOTH charge twice. Refusing is the only safe answer.
    const stale = new RunIdentity("run_a", [], 2, "2026-08-18T00:00:00Z");

    expect(() =>
      idempotencyKeyFor(ctxFor(stale), "pay", { now: new Date("2026-08-19T01:00:00Z") }),
    ).toThrow(ConnectorIdempotencyExpiredError);
  });

  it("never refuses a FIRST attempt, however long the run was parked", () => {
    // The human-gate case: an approval sits for eighteen days, then the writing
    // node runs for the first time. Nothing was sent for Stripe to forget.
    const parked = new RunIdentity("run_a", [], 1, "2026-08-01T00:00:00Z");

    expect(
      idempotencyKeyFor(ctxFor(parked), "pay", { now: new Date("2026-08-19T00:00:00Z") }),
    ).toBe("run_a:pay");
  });

  it("returns null when the host published no identity at all", () => {
    // A real answer: send no header rather than invent a key.
    expect(idempotencyKeyFor(ctxFor(undefined), "pay")).toBeNull();
  });

  it("still honours a host-seeded __runKey, for a consumer on an older engine", () => {
    const ctx = { node: { id: "pay" }, inputs: { __runKey: "run_seeded" } };

    expect(idempotencyKeyFor(ctx, "pay")).toBe("run_seeded:pay");
  });

  it("shortens an over-long key deterministically rather than letting Stripe 400", () => {
    const deep = new RunIdentity("run_a", Array.from({ length: 40 }, (_, i) => `segment-${i}`));
    const key = idempotencyKeyFor(ctxFor(deep), "pay")!;

    expect(key.length).toBeLessThanOrEqual(MAX_IDEMPOTENCY_KEY_LENGTH);
    expect(key).toBe(idempotencyKeyFor(ctxFor(deep), "pay"));
  });
});

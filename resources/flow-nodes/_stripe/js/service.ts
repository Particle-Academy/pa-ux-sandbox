/**
 * Stripe, as one service descriptor shared by every Stripe node.
 *
 * ## Why a per-service shared directory
 *
 * `_connector` carries what is true of ALL connectors. This carries what is
 * true of Stripe: its base URL, its auth scheme, its idempotency header, its
 * webhook signature format, and its faker. Six Stripe nodes would otherwise
 * retype all of that six times, and the day Stripe changes something, five of
 * the six would keep the old answer.
 *
 * Vendoring any Stripe node copies `_connector` and `_stripe` alongside it. Both
 * are source in the consumer's project, editable in place, and neither is a
 * package.
 *
 * ## The sandbox trap, written down where it is used
 *
 * Stripe's test estate is selected by the KEY, not by the URL —
 * `api.stripe.com` serves both. So a live key sent to a node whose mode says
 * "sandbox" reaches the real ledger and succeeds. Nothing in the request
 * distinguishes them; the only guard is which credential the connection holds,
 * which is exactly why credentials sit on the connection rather than on twelve
 * separate nodes.
 */

import type { ConnectorFaker, FakeRequest } from "../../_connector/js/faker";
import type { ServiceDescriptor } from "../../_connector/js/client";
import type { HmacScheme } from "../../_connector/js/webhook";

const API = "https://api.stripe.com";

/**
 * Stripe's webhook signature scheme.
 *
 * `Stripe-Signature: t=1700000000,v1=<hex>`, where the signed payload is
 * `${t}.${rawBody}` under HMAC-SHA256, and the default replay window is five
 * minutes. The timestamp travels INSIDE the signature header rather than in one
 * of its own, which is why `verification.parse` exists.
 */
export const STRIPE_SIGNATURE_SCHEME: HmacScheme = {
  algorithm: "SHA-256",
  payload: (raw, timestamp) => `${timestamp}.${raw}`,
  tolerance: 300,
  encoding: "hex",
};

/** Split `t=…,v1=…` into its parts. Unknown schemes (`v0=…`) are ignored. */
export function parseStripeSignature(raw: string): { signature?: string; timestamp?: string } {
  const parts = raw.split(",").map((part) => part.trim());
  const result: { signature?: string; timestamp?: string } = {};

  for (const part of parts) {
    const [key, value] = part.split("=", 2);
    if (key === "t") result.timestamp = value;
    // Stripe may send several `v1` signatures during a secret rotation. Taking
    // the first is what the verification loop expects; a rotation window is
    // rare enough that failing over to a second is not worth the ambiguity of
    // "which one matched".
    if (key === "v1" && !result.signature) result.signature = value;
  }

  return result;
}

/**
 * The faker.
 *
 * Shapes, not behaviour: the goal is that a downstream node sees the field
 * NAMES Stripe actually publishes, so an author can wire `{{ $json.data.id }}`
 * against a fake and have it keep working against the real thing. Amounts and
 * ids are deterministic, and every value is visibly synthetic.
 */
export const stripeFaker: ConnectorFaker = (operation, request) => {
  const { fake, config } = request;

  switch (operation) {
    case "payment_intent_create":
      return paymentIntent(config, fake);

    case "refund_create":
      return {
        id: fake.id("re"),
        object: "refund",
        amount: Number(config.amount ?? 0) || fake.int(500, 25000),
        currency: String(config.currency ?? "usd"),
        payment_intent: String(config.paymentIntent ?? fake.id("pi")),
        reason: config.reason ? String(config.reason) : null,
        status: "succeeded",
        created: 1767225600,
      };

    case "customer_create":
      return {
        id: fake.id("cus"),
        object: "customer",
        email: String(config.email ?? "ada@example.test"),
        name: config.name ? String(config.name) : null,
        created: 1767225600,
        livemode: false,
      };

    default:
      // A faker asked for an operation it has no shape for must SAY so. Making
      // something up would produce a green run whose output silently has none
      // of the fields the author is about to reference.
      throw new Error(
        `stripe: no fake response is defined for "${operation}". ` +
          "Add one to stripeFaker before shipping a node that calls it — a connector without a faker " +
          "cannot be developed against, tested, or demonstrated.",
      );
  }
};

function paymentIntent(config: Record<string, unknown>, fake: FakeRequest["fake"]) {
  const amount = Number(config.amount ?? 0) || fake.int(500, 25000);

  return {
    id: fake.id("pi"),
    object: "payment_intent",
    amount,
    amount_received: amount,
    currency: String(config.currency ?? "usd"),
    customer: config.customer ? String(config.customer) : null,
    description: config.description ? String(config.description) : null,
    status: "succeeded",
    // `livemode: false` is not decoration. It is the field a downstream branch
    // reads to refuse to act on test data, and a faker that reported `true`
    // would make that branch untestable.
    livemode: false,
    created: 1767225600,
    latest_charge: fake.id("ch"),
    receipt_email: config.receiptEmail ? String(config.receiptEmail) : null,
  };
}

/** The Stripe service, for the TypeScript runtime. */
export const STRIPE: ServiceDescriptor = {
  service: "stripe",
  title: "Stripe",
  // Same host for both estates — the key decides. See the note at the top.
  sandbox: "credential",
  baseUrls: { live: API, sandbox: API },
  requires: ["secretKey"],
  // Bearer, not Basic. Stripe accepts the key as a Basic username too, and both
  // are documented, but one spelling in one place is one fewer thing to get
  // subtly wrong.
  authorize: (credentials, request) => {
    request.headers.Authorization = `Bearer ${credentials.secretKey}`;
  },
  // Retried durable runs MUST not create a second charge. This is the header
  // that makes `unsafe-to-replay` recoverable rather than merely forbidden.
  idempotencyHeader: "Idempotency-Key",
  faker: stripeFaker,
};

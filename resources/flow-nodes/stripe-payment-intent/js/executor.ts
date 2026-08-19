import type { NodeExecutor } from "@particle-academy/fancy-flow/engine";

import { callConnector } from "../../_connector/js/client";
import { idempotencyKeyFor, NO_IDEMPOTENCY_KEY_WARNING } from "../../_connector/js/idempotency";
import { STRIPE } from "../../_stripe/js/service";

/**
 * Create a Stripe PaymentIntent.
 *
 * Notice what is NOT here: no key, no base URL, no mode check, no retry loop,
 * no fake/real branch. The executor describes the request; `callConnector`
 * resolves the connection, picks the estate, and either calls Stripe or calls
 * the faker. Every connector in the catalogue is this shape, which is the point
 * of having a pattern rather than two hundred bespoke nodes.
 */
export const stripePaymentIntentExecutor: NodeExecutor = async (ctx) => {
  const config = ((ctx.node.data as any)?.config ?? {}) as Record<string, unknown>;

  const amount = Number(config.amount);
  if (!Number.isInteger(amount) || amount <= 0) {
    // Fail loudly and specifically. "Invalid request" from Stripe three frames
    // later costs an author ten minutes; naming the unit costs them none, and
    // the smallest-unit rule is the single most common mistake against this API.
    throw new Error(
      `stripe_payment_intent: "amount" must be a positive whole number in the currency's smallest unit ` +
        `(1000 = $10.00), got ${JSON.stringify(config.amount)}.`,
    );
  }

  const idempotencyKey = idempotencyKeyFor(ctx, ctx.node.id);
  if (idempotencyKey === null) {
    ctx.emit({
      type: "log",
      level: "warn",
      nodeId: ctx.node.id,
      message: `stripe_payment_intent: ${NO_IDEMPOTENCY_KEY_WARNING}`,
    });
  }

  const result = await callConnector(STRIPE, {
    operation: "payment_intent_create",
    config,
    input: ctx.inputs?.in,
    request: {
      method: "POST",
      path: "/v1/payment_intents",
      // Stripe's API is form-encoded, including its bracketed nesting for
      // metadata. The shared client handles the encoding; the node just says
      // what it wants sent.
      form: {
        amount,
        currency: String(config.currency ?? "usd").toLowerCase(),
        ...(config.customer ? { customer: String(config.customer) } : {}),
        ...(config.description ? { description: String(config.description) } : {}),
        ...(config.receiptEmail ? { receipt_email: String(config.receiptEmail) } : {}),
        ...metadataForm(config.metadata),
      },
    },
    // Derived from the RUN and the NODE, never fresh. A retried durable run
    // must send the same key or Stripe creates a second payment — which is the
    // exact failure `unsafe-to-replay` exists to prevent, and the key is what
    // turns "never retry" into "retry safely".
    ...(idempotencyKey === null ? {} : { idempotencyKey }),
  });

  ctx.emit({
    type: "log",
    level: "info",
    nodeId: ctx.node.id,
    message: `stripe payment_intent ${(result.data as any)?.id} (${result.mode})`,
  });

  return { __port: "out", value: result };
};

/** `{ order_id: "7" }` → `{ "metadata[order_id]": "7" }`. */
function metadataForm(value: unknown): Record<string, string> {
  if (!value || typeof value !== "object") return {};

  const form: Record<string, string> = {};
  for (const [key, item] of Object.entries(value as Record<string, unknown>)) {
    if (item !== undefined && item !== null && item !== "") form[`metadata[${key}]`] = String(item);
  }

  return form;
}


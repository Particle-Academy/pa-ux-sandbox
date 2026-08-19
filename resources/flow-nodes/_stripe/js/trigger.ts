/**
 * Stripe's webhook trigger — the delivery contract, shared by its trigger nodes.
 *
 * Kept beside the service descriptor rather than inside a node, because a
 * signature scheme is a fact about STRIPE. Two Stripe triggers must not be able
 * to disagree about how a delivery is verified.
 */

import type { ConnectorFaker } from "../../_connector/js/faker";
import type { InboundDelivery, TriggerDescriptor } from "../../_connector/js/trigger";
import { verifyDelivery } from "../../_connector/js/trigger";
import type { WebhookVerification } from "../../_connector/js/webhook";
import { parseStripeSignature, STRIPE_SIGNATURE_SCHEME } from "./service";

/**
 * A sample event per type.
 *
 * The point is the SHAPE — an author wiring `{{ $json.data.object.amount }}`
 * against a fake must find the same path when a real delivery arrives. So these
 * mirror Stripe's envelope exactly: `id`, `type`, `created`, `livemode`, and the
 * object under `data.object`.
 */
export const stripeEventFaker: ConnectorFaker = (operation, request) => {
  const { fake, config } = request;
  const type = String(config.sample ?? "payment_intent.succeeded");

  const object = (() => {
    switch (type) {
      case "charge.refunded":
        return {
          id: fake.id("ch"),
          object: "charge",
          amount: 2500,
          amount_refunded: 2500,
          currency: "usd",
          status: "succeeded",
          refunded: true,
        };
      case "checkout.session.completed":
        return {
          id: fake.id("cs"),
          object: "checkout.session",
          amount_total: 2500,
          currency: "usd",
          status: "complete",
          payment_status: "paid",
          customer_email: "ada@example.test",
        };
      case "customer.subscription.deleted":
        return {
          id: fake.id("sub"),
          object: "subscription",
          status: "canceled",
          customer: fake.id("cus"),
          canceled_at: 1767225600,
        };
      default:
        return {
          id: fake.id("pi"),
          object: "payment_intent",
          amount: 2500,
          amount_received: 2500,
          currency: "usd",
          status: "succeeded",
        };
    }
  })();

  return {
    id: fake.id("evt"),
    object: "event",
    type,
    api_version: "2026-01-01",
    created: 1767225600,
    // Never `true`. A faked event that claimed to be live money would make the
    // downstream guard — "only act when livemode" — untestable, which is the
    // one branch you most want covered.
    livemode: false,
    data: { object },
  };
};

export const STRIPE_WEBHOOK_TRIGGER: TriggerDescriptor = {
  service: "stripe",
  operation: "webhook",
  delivery: "webhook",
  setup:
    "Add an endpoint in the Stripe dashboard (or via POST /v1/webhook_endpoints) pointing at the route your " +
    "host mounts for this trigger, then put the endpoint's signing secret on the connection as `webhookSecret`.",
  verification: {
    signatureHeader: "Stripe-Signature",
    scheme: STRIPE_SIGNATURE_SCHEME,
    // Stripe packs the timestamp INTO the signature header (`t=…,v1=…`) rather
    // than sending one of its own, so it has to be parsed out before the HMAC
    // can be computed over `{t}.{body}`.
    parse: parseStripeSignature,
  },
  faker: stripeEventFaker,
};

/**
 * Verify one inbound Stripe delivery.
 *
 * The host calls this BEFORE starting a run, with the body exactly as received.
 * Re-serialised JSON changes key order and whitespace, and produces a mismatch
 * that looks precisely like a wrong secret — hours of debugging the wrong thing.
 */
export function verifyStripeDelivery(
  delivery: InboundDelivery,
  webhookSecret: string | undefined,
  now?: number,
): Promise<WebhookVerification> {
  return verifyDelivery(STRIPE_WEBHOOK_TRIGGER, delivery, webhookSecret, now);
}

import type { NodeKindDefinition, OutputField } from "@particle-academy/fancy-flow/engine";

import { defineConnectorKind, summarize } from "../../_connector/ui/connector";
import { stripeMeta } from "../../_stripe/ui/service";

export const STRIPE_PAYMENT_INTENT_KIND = "@particle-academy/stripe_payment_intent";

export const STRIPE_PAYMENT_INTENT_META = stripeMeta(
  "action",
  "create a payment intent",
  "https://docs.stripe.com/api/payment_intents/create",
);

/**
 * What this node emits — the "ingredients" a downstream node can reference.
 *
 * fancy-flow already reads `outputShape` off the kind and offers it in the
 * variable picker (`availableVariables`), so declaring it here is the whole of
 * the work: an author configuring the next node picks `{{ $json.data.id }}` off
 * a list instead of typing a path and hoping.
 *
 * Only DIRECT predecessors are offered, which is where IFTTT's model and a
 * branching graph genuinely differ — see the note in `_connector/ui/connector.ts`.
 */
export const STRIPE_PAYMENT_INTENT_OUTPUT: OutputField[] = [
  { path: "mode", type: "string", description: "Which estate this ran against: fake, sandbox or live." },
  { path: "connection", type: "string", description: "The connection id that was used." },
  { path: "data.id", type: "string", description: "Payment intent id (pi_…)." },
  { path: "data.status", type: "string", description: "succeeded, requires_action, requires_payment_method, …" },
  { path: "data.amount", type: "number", description: "Amount in the currency's smallest unit." },
  { path: "data.currency", type: "string", description: "Three-letter ISO currency code." },
  { path: "data.customer", type: "string", description: "Customer id, when one was given." },
  { path: "data.latest_charge", type: "string", description: "The charge this intent produced." },
  {
    path: "data.livemode",
    type: "boolean",
    description: "FALSE for test-mode money. Branch on this before acting on a payment.",
  },
];

/**
 * stripe_payment_intent — take a payment.
 *
 * `unsafe-to-replay`, and the idempotency key is why that is survivable rather
 * than merely declared: a durable run that retries this node sends the same
 * `Idempotency-Key`, so Stripe returns the original intent instead of creating
 * a second one.
 */
export const stripePaymentIntentKind: NodeKindDefinition = defineConnectorKind(STRIPE_PAYMENT_INTENT_META, {
  name: STRIPE_PAYMENT_INTENT_KIND,
  aliases: ["stripe_payment_intent"],
  label: "Stripe payment",
  description: "Create a Stripe PaymentIntent — take a payment.",
  icon: "◈",
  inputs: [{ id: "in" }],
  outputs: [{ id: "out" }],
  sideEffects: "unsafe-to-replay",
  outputShape: STRIPE_PAYMENT_INTENT_OUTPUT,
  configSchema: [
    {
      type: "expression",
      key: "amount",
      label: "Amount",
      example: "{{ $json.total_cents }}",
      description: "In the currency's smallest unit — 1000 is $10.00. Stripe has no decimal amounts.",
      required: true,
    },
    { type: "text", key: "currency", label: "Currency", default: "usd", placeholder: "usd" },
    { type: "expression", key: "customer", label: "Customer", example: "{{ $json.customer_id }}" },
    { type: "expression", key: "description", label: "Description", example: "Order {{ $json.order_id }}" },
    { type: "expression", key: "receiptEmail", label: "Receipt email", example: "{{ $json.email }}" },
    {
      type: "keyvalue",
      key: "metadata",
      label: "Metadata",
      keyPlaceholder: "order_id",
      valuePlaceholder: "{{ $json.order_id }}",
      description: "Sent to Stripe as metadata[key]=value. The usual way to find this payment again later.",
    },
  ],
  defaultConfig: { mode: "auto", currency: "usd" },
  renderBody: ({ config }) =>
    summarize(STRIPE_PAYMENT_INTENT_META, config as Record<string, unknown>, "take a payment"),
});

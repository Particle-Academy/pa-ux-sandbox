import type { NodeKindDefinition, OutputField } from "@particle-academy/fancy-flow/engine";

import { defineConnectorKind, summarize } from "../../_connector/ui/connector";
import { stripeMeta } from "../../_stripe/ui/service";

export const STRIPE_WEBHOOK_TRIGGER_KIND = "@particle-academy/stripe_webhook_trigger";

export const STRIPE_WEBHOOK_TRIGGER_META = stripeMeta(
  "trigger",
  "a webhook event",
  "https://docs.stripe.com/webhooks",
);

/**
 * The INGREDIENTS — the whole reason a trigger declares an output shape.
 *
 * In IFTTT a trigger's fields become named tokens you drop into the action's
 * fields, so configuring the action means picking from what actually arrived
 * rather than typing a path and hoping. fancy-flow's `availableVariables()`
 * already builds that picker out of `outputShape`, so declaring the event's
 * fields here IS the feature — for a human reading a dropdown and for an agent
 * enumerating what it may reference.
 *
 * These are Stripe's own names, not ours. A field renamed for tidiness is a
 * field nobody can look up in the provider's documentation.
 */
export const STRIPE_WEBHOOK_OUTPUT: OutputField[] = [
  { path: "id", type: "string", description: "Event id (evt_…). Use it to deduplicate redeliveries." },
  { path: "type", type: "string", description: "Event type — payment_intent.succeeded, charge.refunded, …" },
  { path: "created", type: "number", description: "Unix timestamp the event was created." },
  {
    path: "livemode",
    type: "boolean",
    description: "FALSE for events from Stripe's test estate. Branch on it before acting on money.",
  },
  { path: "data.object.id", type: "string", description: "The id of the object the event is about." },
  { path: "data.object.object", type: "string", description: "Its type — payment_intent, charge, …" },
  { path: "data.object.amount", type: "number", description: "Amount, on the objects that carry one." },
  { path: "data.object.currency", type: "string", description: "Currency, on the objects that carry one." },
  { path: "data.object.status", type: "string", description: "Status, on the objects that carry one." },
];

/**
 * stripe_webhook_trigger — start a run when Stripe reports something.
 *
 * ## The signing secret is NOT on this node
 *
 * It is a credential, so it lives on the connection (`webhookSecret`) with the
 * API key. Putting it in node config would write a secret into the workflow
 * document — which is exported, committed, and handed to agents.
 *
 * ## Verification is not optional
 *
 * The host mounts a route and hands deliveries to `verifyStripeDelivery` BEFORE
 * starting a run. An endpoint that skips it is a public, unauthenticated way for
 * a stranger to make your app act on a payment that never happened.
 */
export const stripeWebhookTriggerKind: NodeKindDefinition = defineConnectorKind(
  STRIPE_WEBHOOK_TRIGGER_META,
  {
    name: STRIPE_WEBHOOK_TRIGGER_KIND,
    aliases: ["stripe_webhook_trigger"],
    category: "trigger",
    label: "Stripe event",
    description: "Start a run when Stripe reports an event (verified webhook delivery).",
    icon: "⚡",
    inputs: [],
    outputs: [
      { id: "out", label: "event" },
      { id: "ignored", label: "filtered out" },
    ],
    sideEffects: "none",
    outputShape: STRIPE_WEBHOOK_OUTPUT,
    configSchema: [
      {
        type: "text",
        key: "eventTypes",
        label: "Event types",
        placeholder: "payment_intent.succeeded, charge.refunded",
        description:
          "Comma separated. Leave blank to accept every event Stripe sends to this endpoint. " +
          "A delivery whose type is not listed settles the trigger without starting the graph.",
      },
      {
        type: "select",
        key: "sample",
        label: "Sample event (fake mode)",
        options: [
          { value: "payment_intent.succeeded", label: "payment_intent.succeeded" },
          { value: "charge.refunded", label: "charge.refunded" },
          { value: "checkout.session.completed", label: "checkout.session.completed" },
          { value: "customer.subscription.deleted", label: "customer.subscription.deleted" },
        ],
        default: "payment_intent.succeeded",
        description:
          "Which event the faker emits, so you can wire the downstream nodes against real field names " +
          "before Stripe has ever been contacted.",
      },
    ],
    defaultConfig: { mode: "auto", sample: "payment_intent.succeeded" },
    renderBody: ({ config }) =>
      summarize(
        STRIPE_WEBHOOK_TRIGGER_META,
        config as Record<string, unknown>,
        typeof (config as any)?.eventTypes === "string" && (config as any).eventTypes.trim() !== ""
          ? (config as any).eventTypes.trim()
          : "any event",
      ),
  },
);

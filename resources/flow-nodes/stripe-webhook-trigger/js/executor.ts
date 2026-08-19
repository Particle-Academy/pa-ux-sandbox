import type { NodeExecutor } from "@particle-academy/fancy-flow/engine";

import { resolveConnection } from "../../_connector/js/connection";
import { triggerEvent } from "../../_connector/js/trigger";
import { STRIPE_WEBHOOK_TRIGGER } from "../../_stripe/js/trigger";

/**
 * Publish the Stripe event that started this run.
 *
 * ## A trigger executor does not receive the webhook
 *
 * The HOST does. It owns the route, verifies the signature (see
 * `verifyStripeDelivery`), and injects the verified event on this node's `in`
 * port before starting the run. By the time this runs, the delivery is already
 * trusted — which is why there is no verification here and must not be: a
 * check that runs after the graph has started is a check that has already
 * failed.
 *
 * In `fake` mode there is no host and no delivery, so the trigger emits its own
 * sample event. That is what makes the node runnable on a canvas the moment it
 * is vendored, with the same field names a real delivery carries.
 */
export const stripeWebhookTriggerExecutor: NodeExecutor = async (ctx) => {
  const config = ((ctx.node.data as any)?.config ?? {}) as Record<string, unknown>;

  const connection = resolveConnection({
    service: "stripe",
    operation: "webhook",
    connectionId: typeof config.connection === "string" ? config.connection : null,
    requested: (config.mode as never) ?? null,
    sandbox: "credential",
    // A trigger authenticates DELIVERIES, not outbound calls, so the secret it
    // needs is the endpoint's signing secret rather than the API key.
    requires: ["webhookSecret"],
  });

  const event = triggerEvent(STRIPE_WEBHOOK_TRIGGER, connection, ctx.inputs?.in, config) as {
    type?: string;
  };

  const wanted = String(config.eventTypes ?? "")
    .split(",")
    .map((type) => type.trim())
    .filter(Boolean);

  if (wanted.length > 0 && event.type && !wanted.includes(event.type)) {
    // Settle WITHOUT activating the port: the delivery was legitimate, it just
    // is not one this workflow acts on. Throwing would turn Stripe's normal
    // fan-out of event types into a wall of failed runs, and every one of them
    // would look like an incident.
    ctx.emit({
      type: "log",
      level: "info",
      nodeId: ctx.node.id,
      message: `stripe_webhook_trigger: ignoring ${event.type} — not in the configured event types`,
    });

    return { __port: "ignored", value: event };
  }

  return { __port: "out", value: event };
};

# @particle-academy/stripe_webhook_trigger

Start a run when Stripe reports an event.

```bash
npx fancy-cli@latest add node @particle-academy/stripe_webhook_trigger
```

## Verification is not optional

An unverified webhook endpoint is a public, unauthenticated way for a stranger to
make your app act on a payment that never happened. The host mounts a route and
hands each delivery to `verifyStripeDelivery` / `StripeTrigger::verifyDelivery`
**before** starting a run.

```ts
const check = await verifyStripeDelivery({ raw: rawBody, headers }, secret);
if (!check.ok) return response(400);
```

Three things that scheme needs, and all three are handled for you:

1. **The RAW body.** Re-serialised JSON changes key order and whitespace and
   fails in a way that looks exactly like a wrong secret.
2. **A constant-time comparison.** `===` on a signature leaks which prefix was
   right.
3. **A 300-second replay window.** Without it a captured delivery is replayable
   forever.

The signing secret lives on the **connection** as `webhookSecret`, not on the
node — a secret in node config is a secret in the exported workflow document.

## The ingredients

The trigger declares Stripe's own field names as its `outputShape`, so the
editor's variable picker and the MCP both offer them: `type`, `livemode`,
`data.object.id`, `data.object.amount`, and the rest. `livemode` is the one to
branch on before acting on money.

## Filtering

`eventTypes` is a comma-separated allowlist. A delivery whose type is not listed
settles on the **`ignored`** port rather than failing — Stripe's normal fan-out
of event types would otherwise be a wall of failed runs, every one of which looks
like an incident.

In `fake` mode the trigger emits a sample event of whichever type `sample` names,
so a canvas is runnable before Stripe has been contacted.

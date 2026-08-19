# @particle-academy/stripe_payment_intent

Create a Stripe PaymentIntent — take a payment.

```bash
npx fancy-cli@latest add node @particle-academy/stripe_payment_intent
```

This copies three directories: the node, [`_connector`](../_connector/README.md)
(the shared connector runtime) and `_stripe` (everything true of Stripe rather
than of one operation). No packages, no dependencies.

## Run it before you configure anything

With no connection registered on a local project the node resolves to **`fake`**
and returns a shaped PaymentIntent without a network call. Drop it on a canvas,
press Run, wire the downstream nodes against the real field names.

## Environments

`mode` is `auto` (default), `fake`, `sandbox` or `live`.

**Stripe's test estate is selected by the KEY, not the URL** — `api.stripe.com`
serves both. A live key sent to a node whose mode says "sandbox" reaches the real
ledger and succeeds. Nothing in the request distinguishes them, which is exactly
why the credential lives on the connection rather than on the node.

## Host wiring

```ts
import { registerConnectionHost } from "@/components/fancy/flow-nodes/_connector/js/connection";

registerConnectionHost({
  environment: { production: process.env.NODE_ENV === "production" },
  connections: {
    stripe: {
      service: "stripe",
      live:    { secretKey: process.env.STRIPE_SECRET_KEY },
      sandbox: { secretKey: process.env.STRIPE_TEST_SECRET_KEY },
    },
  },
});
```

On PHP, bind `FancyFlow\Nodes\Connector\ConnectorClient` with a `ConnectionHost`
carrying the same two credential sets, then `php artisan flow:discover`.

## Replay

`unsafe-to-replay`. A durable run that retried this node would take a second
payment — so the per-node queue driver gives it one attempt whatever `tries`
says.

It sends Stripe's `Idempotency-Key` when the host provides a run identity, which
turns "never retry" into "retry safely". **Neither engine carries a run key
today**, so unless you seed `__runKey` into the run's initial inputs the node
emits a warning and sends no key. See `_connector/js/idempotency.ts` for why the
two obvious fallbacks are both worse than none.

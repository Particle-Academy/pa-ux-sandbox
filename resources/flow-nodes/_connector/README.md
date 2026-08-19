# `_connector` — the shared connector runtime

Every connector node in this marketplace is built on this directory. It is
**vendored, not installed**: adding any connector copies `_connector/` into the
consumer's project beside the node, and every connector after that reuses the
same copy. There is no package to require, which is the entire point of the node
marketplace.

```
_connector/
  ui/   connector.ts        the shared authoring surface (lands on EVERY host)
  js/   mode connection client faker webhook trigger errors idempotency
  php/  the same, class per file, namespace FancyFlow\Nodes\Connector
```

A manifest opts in by naming it:

```json
"shared": ["_connector", "_stripe"]
```

## Why a shared directory at all

The git nodes duplicate their `provider.ts` into every node, deliberately, so a
node you copy in never depends on a node you did not. At a dozen nodes that is a
fine trade.

A connector catalogue is hundreds of nodes over one runtime — mode resolution,
connections, retry, fakers, signature verification. Duplicating that per node
would mean a fix to the retry ladder has to be applied hundreds of times inside
every consumer's project, and nothing would report the copies that were missed.

The invariant the duplication protected still holds, because **a shared part is
not a node**: adding one connector installs everything that connector needs,
with no second thing to remember and no dependency.

## The three environments

| mode | talks to | needs credentials | needs network |
|---|---|---|---|
| `live` | the provider, for real | yes | yes |
| `sandbox` | the provider's test estate | yes (test ones) | yes |
| `fake` | the node's own faker | no | no |

**The environment is the DEFAULT, never the constraint.** Explicit beats the
connection; the connection beats the environment. An author who asks for `live`
on their laptop gets `live`, because an environment that silently overrode a
stated intention produces the worst outcome available here — a workflow that
reports success having charged nobody. Equally, `sandbox` set explicitly stays
sandbox in production, which is how you stage a connector before cutting over.

With nothing configured, a local project resolves to `fake`. That is what makes a
freshly vendored node runnable before the consumer has signed up for anything.

**A missing credential in a remote mode is a loud failure, never a quiet
downgrade to the faker.** A run that "succeeded" because it stopped talking to
the provider is green, wrong, and unreported — the failure this whole design
exists to prevent.

## Four sandbox shapes, not a boolean

Verified per provider in
[`.ai/plans/fancy-flow-connector-nodes.md`](../../../../.ai/plans/fancy-flow-connector-nodes.md):

| `SandboxKind` | means | example |
|---|---|---|
| `credential` | same base URL, a test key selects the estate | Stripe |
| `base-url` | a different host entirely | PayPal |
| `separate-account` | a distinct tenant you must create | Salesforce, Telegram |
| `none` | there is no test estate | Resend, Linear, Front |

`none` is not an edge case — roughly a third of providers worth connecting have
no sandbox, and for those `fake` is the primary development mode rather than a
fallback.

## Credentials are configuration, never code

A node's config stores a **connection id** — an opaque, non-secret name — and the
host resolves it to credentials at run time. Nothing secret ever enters a
`WorkflowSchema`, which is plain JSON that gets exported, committed, handed to
agents and pasted into issues.

```ts
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

```php
$this->app->singleton(ConnectionHost::class, fn () => new ConnectionHost(
    production: app()->isProduction(),
    connections: [
        'stripe' => new ConnectionSpec(
            service: 'stripe',
            live:    ['secretKey' => config('services.stripe.secret')],
            sandbox: ['secretKey' => config('services.stripe.test_secret')],
        ),
    ],
));
```

## Fakers

**Every connector ships one, always** — not only the ones whose provider lacks a
sandbox. A sandbox still needs an account, a key, a network and a provider that
is up: four ways to get nothing working before you have learned anything.

Fakers are **deterministic and byte-identical across runtimes**. The same FNV-1a
seed and the same xorshift32 sequence run in `js/faker.ts` and `php/FakeValues.php`,
so a golden fixture can assert an exact payload and hold BOTH backends to it.
That turns the faker into the parity test rather than a convenience.

Values are obviously synthetic on purpose — `fake_`-prefixed ids, `example.test`
hosts, `livemode: false`. Nobody should look at a faked result and wonder whether
it moved real money.

## Errors and retries

| class | retry? | why |
|---|---|---|
| `ConnectorConfigError` | never | nothing about a second attempt changes an unset key |
| `ConnectorAuthError` | never | the credential is wrong; hammering it locks accounts |
| `ConnectorRateLimited` | yes | after `retryAfter`, which the provider told us |
| `ConnectorTransient` | yes | 5xx, timeout, connection reset |
| `ConnectorRequestError` | never | a 4xx we caused; the same request fails the same way |

429 is classified **before** the 4xx sweep. It is the one 4xx worth retrying, and
the other ordering turns a busy minute into a failed run.

## Triggers are not all webhooks

`DeliveryMechanism` is `webhook | subscription | poll | pubsub | stream`, and a
trigger declares which. Assuming webhooks is the most common way a connector
catalogue ends up lying: Microsoft Graph wants a subscription that expires in
three days, Salesforce wants gRPC + Avro, S3 wants infrastructure the consumer
provisions, Telegram wants you to poll. A node that declared "webhook" for those
would install cleanly and never fire.

Webhook verification is part of the pattern, not an exercise for the host, and it
**refuses rather than accepts** when no secret is configured. An endpoint that
verifies nothing because nobody set a secret is worse than one that is off: it
looks protected.

## A third backend

The manifest's `runtimes` map already accommodates one — a Python backend is
`{ "py": { "files": ["py"], "engine": ">=…" } }` and `NodeSource` unions runtime
parts generically, so `_connector/py/` and `<node>/py/` would compile with no
registry change. What is **not** yet in place is a `dirs.py` root in `fancy-cli`:
`resolveNodeTargetPath` special-cases only `php`, so a `py` target would land
under the TypeScript root. See the plan for the one-function change that needs.

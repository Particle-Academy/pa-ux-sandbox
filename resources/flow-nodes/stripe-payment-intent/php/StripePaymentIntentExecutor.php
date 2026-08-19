<?php

declare(strict_types=1);

namespace FancyFlow\Nodes\StripePaymentIntent;

use FancyFlow\Attributes\FlowNode;
use FancyFlow\Contracts\NodeExecutor;
use FancyFlow\Nodes\Connector\ConnectorClient;
use FancyFlow\Nodes\Connector\Idempotency;
use FancyFlow\Nodes\Stripe\Stripe;
use FancyFlow\Runtime\ExecutionContext;
use FancyFlow\Runtime\Port;
use FancyFlow\Runtime\RunEvent;
use InvalidArgumentException;

/**
 * Create a Stripe PaymentIntent.
 *
 * The PHP twin of `../js/executor.ts`, and deliberately the same shape: no key,
 * no base URL, no mode check, no retry loop, no fake/real branch. The executor
 * describes the request; `ConnectorClient` resolves the connection, picks the
 * estate, and either calls Stripe or calls the faker.
 *
 * The client is CONSTRUCTOR-INJECTED, matching how the git nodes take their
 * `GitHost`: one app may serve several installations with different credentials,
 * so a global would be wrong here for the same reason it is wrong there.
 */
#[FlowNode(
    name: '@particle-academy/stripe_payment_intent',
    category: 'io',
    label: 'Stripe payment',
    description: 'Create a Stripe PaymentIntent — take a payment.',
    icon: '◈',
    inputs: [['id' => 'in']],
    outputs: [['id' => 'out']],
    aliases: ['stripe_payment_intent'],
    sideEffects: 'unsafe-to-replay',
)]
final class StripePaymentIntentExecutor implements NodeExecutor
{
    public function __construct(private readonly ?ConnectorClient $client = null) {}

    public function execute(ExecutionContext $ctx): mixed
    {
        $config = $ctx->config();
        $client = $this->client ?? throw new \RuntimeException(
            'stripe: no '.ConnectorClient::class.' bound. Bind one with a ConnectionHost carrying your '
            .'Stripe connection — the node has no credentials of its own and must not invent any.'
        );

        $amount = $config['amount'] ?? null;
        if (! is_numeric($amount) || (int) $amount != $amount || (int) $amount <= 0) {
            // Fail loudly and specifically. "Invalid request" from Stripe three
            // frames later costs an author ten minutes; naming the unit costs
            // them none, and the smallest-unit rule is the most common mistake
            // made against this API.
            throw new InvalidArgumentException(
                'stripe_payment_intent: "amount" must be a positive whole number in the currency\'s smallest '
                .'unit (1000 = $10.00), got '.json_encode($config['amount'] ?? null).'.'
            );
        }

        $form = array_filter([
            'amount' => (int) $amount,
            'currency' => strtolower((string) ($config['currency'] ?? 'usd')),
            'customer' => (string) ($config['customer'] ?? ''),
            'description' => (string) ($config['description'] ?? ''),
            'receipt_email' => (string) ($config['receiptEmail'] ?? ''),
        ], static fn (mixed $v): bool => $v !== '' && $v !== null);

        foreach ((array) ($config['metadata'] ?? []) as $key => $value) {
            if ($value !== null && $value !== '') {
                $form["metadata[{$key}]"] = (string) $value;
            }
        }

        // Derived from the RUN and the NODE, never fresh. A retried durable run
        // must send the same key or Stripe creates a second payment — the exact
        // failure `unsafe-to-replay` exists to prevent, and the key is what turns
        // "never retry" into "retry safely".
        $idempotencyKey = Idempotency::keyFor($ctx);

        if ($idempotencyKey === null) {
            $ctx->emit(RunEvent::log('warn', 'stripe_payment_intent: '.Idempotency::NO_KEY_WARNING, $ctx->node->id));
        }

        $result = $client->call(
            Stripe::descriptor(),
            'payment_intent_create',
            $config,
            ['method' => 'POST', 'path' => '/v1/payment_intents', 'form' => $form],
            $ctx->input('in'),
            $idempotencyKey,
        );

        $ctx->emit(RunEvent::log(
            'info',
            'stripe payment_intent '.($result->data['id'] ?? '?').' ('.$result->mode->value.')',
            $ctx->node->id,
        ));

        return Port::only('out', $result->toArray());
    }
}

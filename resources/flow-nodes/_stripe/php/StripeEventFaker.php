<?php

declare(strict_types=1);

namespace FancyFlow\Nodes\Stripe;

use FancyFlow\Nodes\Connector\FakeValues;

/**
 * Sample Stripe events, one per type.
 *
 * The point is the SHAPE — an author wiring `{{ $json.data.object.amount }}`
 * against a fake must find the same path when a real delivery arrives. So these
 * mirror Stripe's envelope exactly: `id`, `type`, `created`, `livemode`, and the
 * object under `data.object`.
 *
 * Byte-identical to `../js/trigger.ts`'s `stripeEventFaker`, which is what lets a
 * golden fixture assert an exact event and hold both runtimes to it.
 */
final class StripeEventFaker
{
    /**
     * @param  array<string,mixed>  $config
     * @return array<string,mixed>
     */
    public static function respond(string $operation, array $config, FakeValues $fake, mixed $input = null): array
    {
        $type = (string) ($config['sample'] ?? 'payment_intent.succeeded');

        $object = match ($type) {
            'charge.refunded' => [
                'id' => $fake->id('ch'),
                'object' => 'charge',
                'amount' => 2500,
                'amount_refunded' => 2500,
                'currency' => 'usd',
                'status' => 'succeeded',
                'refunded' => true,
            ],
            'checkout.session.completed' => [
                'id' => $fake->id('cs'),
                'object' => 'checkout.session',
                'amount_total' => 2500,
                'currency' => 'usd',
                'status' => 'complete',
                'payment_status' => 'paid',
                'customer_email' => 'ada@example.test',
            ],
            'customer.subscription.deleted' => [
                'id' => $fake->id('sub'),
                'object' => 'subscription',
                'status' => 'canceled',
                'customer' => $fake->id('cus'),
                'canceled_at' => 1767225600,
            ],
            default => [
                'id' => $fake->id('pi'),
                'object' => 'payment_intent',
                'amount' => 2500,
                'amount_received' => 2500,
                'currency' => 'usd',
                'status' => 'succeeded',
            ],
        };

        return [
            'id' => $fake->id('evt'),
            'object' => 'event',
            'type' => $type,
            'api_version' => '2026-01-01',
            'created' => 1767225600,
            // Never `true`. A faked event claiming to be live money would make
            // the downstream guard — "only act when livemode" — untestable,
            // which is the one branch you most want covered.
            'livemode' => false,
            'data' => ['object' => $object],
        ];
    }
}

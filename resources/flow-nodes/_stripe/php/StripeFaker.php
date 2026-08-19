<?php

declare(strict_types=1);

namespace FancyFlow\Nodes\Stripe;

use FancyFlow\Nodes\Connector\FakeValues;
use RuntimeException;

/**
 * Stripe's faker.
 *
 * Shapes, not behaviour: the goal is that a downstream node sees the field NAMES
 * Stripe actually publishes, so an author can wire `{{ $json.data.id }}` against
 * a fake and have it keep working against the real thing.
 *
 * Deterministic, and identical to `../js/service.ts`'s `stripeFaker` — the same
 * seed produces the same payload on both runtimes, which is what lets a golden
 * fixture assert an exact value and hold BOTH backends to it.
 */
final class StripeFaker
{
    /**
     * @param  array<string,mixed>  $config
     */
    public static function respond(string $operation, array $config, FakeValues $fake, mixed $input = null): array
    {
        return match ($operation) {
            'payment_intent_create' => self::paymentIntent($config, $fake),
            'refund_create' => [
                'id' => $fake->id('re'),
                'object' => 'refund',
                'amount' => (int) ($config['amount'] ?? 0) ?: $fake->int(500, 25000),
                'currency' => (string) ($config['currency'] ?? 'usd'),
                'payment_intent' => (string) ($config['paymentIntent'] ?? $fake->id('pi')),
                'reason' => ($config['reason'] ?? '') !== '' ? (string) $config['reason'] : null,
                'status' => 'succeeded',
                'created' => 1767225600,
            ],
            'customer_create' => [
                'id' => $fake->id('cus'),
                'object' => 'customer',
                'email' => (string) ($config['email'] ?? 'ada@example.test'),
                'name' => ($config['name'] ?? '') !== '' ? (string) $config['name'] : null,
                'created' => 1767225600,
                'livemode' => false,
            ],
            // A faker asked for an operation it has no shape for must SAY so.
            // Making something up would produce a green run whose output
            // silently has none of the fields the author is about to reference.
            default => throw new RuntimeException(
                "stripe: no fake response is defined for \"{$operation}\". Add one to StripeFaker before "
                .'shipping a node that calls it — a connector without a faker cannot be developed against, '
                .'tested, or demonstrated.'
            ),
        };
    }

    /**
     * @param  array<string,mixed>  $config
     * @return array<string,mixed>
     */
    private static function paymentIntent(array $config, FakeValues $fake): array
    {
        $amount = (int) ($config['amount'] ?? 0) ?: $fake->int(500, 25000);

        return [
            'id' => $fake->id('pi'),
            'object' => 'payment_intent',
            'amount' => $amount,
            'amount_received' => $amount,
            'currency' => (string) ($config['currency'] ?? 'usd'),
            'customer' => ($config['customer'] ?? '') !== '' ? (string) $config['customer'] : null,
            'description' => ($config['description'] ?? '') !== '' ? (string) $config['description'] : null,
            'status' => 'succeeded',
            // `livemode: false` is not decoration. It is the field a downstream
            // branch reads to refuse to act on test data, and a faker reporting
            // `true` would make that branch untestable.
            'livemode' => false,
            'created' => 1767225600,
            'latest_charge' => $fake->id('ch'),
            'receipt_email' => ($config['receiptEmail'] ?? '') !== '' ? (string) $config['receiptEmail'] : null,
        ];
    }
}

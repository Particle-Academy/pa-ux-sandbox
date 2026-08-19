<?php


// GENERATED from particle-academy/fancy-connectors — php/src/TriggerEvent.php
// Do not edit here. Fix it in the package and re-run `php artisan flow:build`;
// a test fails the build when this copy and the package disagree.
declare(strict_types=1);

namespace FancyFlow\Nodes\Connector;

use RuntimeException;

/**
 * The event a trigger publishes when it runs.
 *
 * Three sources, in order, and the third is why a connector trigger is usable on
 * day one:
 *
 * 1. A verified delivery the host injected.
 * 2. Nothing injected but the connection is remote — a host wiring error, which
 *    fails loudly rather than emitting a plausible blank.
 * 3. `fake` mode — the trigger emits its own sample event, so an author can
 *    press Run, see the real field names, and wire the downstream work against
 *    them before the provider has ever been contacted.
 */
final class TriggerEvent
{
    /**
     * @param  callable(string, array<string,mixed>, FakeValues, mixed): mixed  $faker
     * @param  array<string,mixed>  $config
     */
    public static function resolve(
        string $service,
        string $operation,
        DeliveryMechanism $delivery,
        string $setup,
        callable $faker,
        ResolvedConnection $connection,
        mixed $injected,
        array $config = [],
    ): mixed {
        if (self::hasDelivery($injected)) {
            return $injected;
        }

        if ($connection->mode === Mode::Fake) {
            return $faker(
                $operation,
                $config,
                new FakeValues(FakeValues::seedForCall($service, $operation, $config)),
                null,
            );
        }

        throw new RuntimeException(
            "{$service}.{$operation}: no event was delivered to this trigger. Its delivery mechanism is "
            ."\"{$delivery->value}\" — {$setup} Set the mode to \"fake\" to design against a sample event instead."
        );
    }

    /**
     * Verify an inbound delivery against a declared scheme.
     *
     * A trigger with NO scheme REFUSES rather than accepts. That asymmetry is
     * the whole safety property: an unverifiable endpoint is a stranger's button
     * for starting workflows in your account, and defaulting to "allow" would
     * make every misconfiguration into an open door that looks shut.
     *
     * @param  array<string,string|list<string>>  $headers
     * @param  callable(string, ?string): string|null  $payload  builds the signed string;
     *                                                           null means this trigger declares no scheme
     * @return array{ok: bool, reason: ?string}
     */
    public static function verifyDelivery(
        string $service,
        string $operation,
        string $raw,
        array $headers,
        ?string $secret,
        ?callable $payload,
        ?string $signatureHeader = null,
        ?string $timestampHeader = null,
        string $algorithm = 'sha256',
        ?int $tolerance = null,
        string $encoding = 'hex',
        ?int $now = null,
    ): array {
        if ($payload === null || $signatureHeader === null) {
            return [
                'ok' => false,
                'reason' => "{$service}.{$operation} declares no signature scheme, so a delivery cannot be trusted.",
            ];
        }

        return WebhookVerifier::verify(
            raw: $raw,
            signature: WebhookVerifier::header($headers, $signatureHeader),
            secret: $secret,
            payload: $payload,
            algorithm: $algorithm,
            tolerance: $tolerance,
            timestamp: $timestampHeader === null ? null : WebhookVerifier::header($headers, $timestampHeader),
            now: $now,
            encoding: $encoding,
        );
    }

    /**
     * Whether an injected value is an actual delivery.
     *
     * An EMPTY array counts as nothing delivered, and that is not fussiness: a
     * manually started run seeds an empty value on the trigger's input, so a
     * bare null check would hand the executor an empty envelope and call it an
     * event. Downstream every field would be null, the run would be green, and
     * nothing would say the trigger never fired.
     */
    private static function hasDelivery(mixed $value): bool
    {
        if ($value === null) {
            return false;
        }

        return is_array($value) ? $value !== [] : true;
    }
}

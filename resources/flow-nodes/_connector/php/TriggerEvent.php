<?php

declare(strict_types=1);

namespace FancyFlow\Nodes\Connector;

use RuntimeException;

/**
 * The event a trigger node publishes when it runs.
 *
 * Three sources, in order, and the third is why a connector trigger is usable on
 * day one:
 *
 * 1. A verified delivery the host injected on the `in` port.
 * 2. Nothing injected but the connection is remote — a host wiring error, which
 *    fails loudly rather than emitting a plausible blank.
 * 3. `fake` mode — the trigger emits its own sample event, so an author can press
 *    Run, see the real field names, and wire the downstream nodes against them
 *    before the provider has ever been contacted.
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
        array $config,
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
            ."\"{$delivery->value}\" — {$setup} Set the node's mode to \"fake\" to design against a sample "
            .'event instead.'
        );
    }

    /**
     * Whether a value on the `in` port is an actual delivery.
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

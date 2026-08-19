<?php

declare(strict_types=1);

namespace FancyFlow\Nodes\Resend;

use FancyFlow\Nodes\Connector\FakeValues;
use RuntimeException;

/**
 * Resend's faker. Byte-identical to `../js/service.ts`'s `resendFaker`.
 *
 * The helper calls happen in the SAME ORDER on both runtimes, which is not a
 * style point: the generator advances per call, so reordering two `hex()` calls
 * silently changes every value after them and the two runtimes stop agreeing.
 */
final class ResendFaker
{
    /**
     * @param  array<string,mixed>  $config
     * @return array<string,mixed>
     */
    public static function respond(string $operation, array $config, FakeValues $fake, mixed $input = null): array
    {
        if ($operation !== 'email_send') {
            throw new RuntimeException(
                "resend: no fake response is defined for \"{$operation}\". Add one to ResendFaker before "
                .'shipping a node that calls it.'
            );
        }

        $id = $fake->hex(8).'-'.$fake->hex(4).'-'.$fake->hex(4).'-'.$fake->hex(4).'-'.$fake->hex(12);

        return [
            'id' => $id,
            'from' => (string) ($config['from'] ?? 'noreply@example.test'),
            'to' => self::toList($config['to'] ?? null),
            'subject' => (string) ($config['subject'] ?? ''),
            'created_at' => $fake->timestamp(),
            'last_event' => 'delivered',
        ];
    }

    /** @return list<string> */
    private static function toList(mixed $value): array
    {
        if (is_array($value)) {
            return array_values(array_map(strval(...), $value));
        }

        if (! is_string($value) || trim($value) === '') {
            return [];
        }

        return array_values(array_filter(array_map(trim(...), explode(',', $value))));
    }
}

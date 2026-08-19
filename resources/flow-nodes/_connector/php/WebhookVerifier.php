<?php

declare(strict_types=1);

namespace FancyFlow\Nodes\Connector;

/**
 * Verifying an inbound provider webhook.
 *
 * An unverified webhook endpoint is a public, unauthenticated way to start a
 * workflow in someone's account — which is to say, a way for a stranger to make
 * your app refund an order. So verification is part of the connector pattern
 * rather than an exercise left to the host.
 *
 * The three things every provider's scheme actually needs, and almost nothing
 * else differs but header names:
 *
 * 1. **The RAW body.** Signatures are computed over bytes. Re-serialising parsed
 *    JSON changes key order and whitespace and produces a mismatch that looks
 *    exactly like a wrong secret.
 * 2. **A constant-time comparison.** `===` on a signature leaks, through timing,
 *    which prefix was right. `hash_equals` exists for this.
 * 3. **A timestamp tolerance.** Without one a valid signature is valid forever,
 *    so anyone who ever saw a delivery can replay it whenever they like.
 *
 * The twin of `../js/webhook.ts`.
 */
final class WebhookVerifier
{
    /**
     * @param  string  $raw  the body EXACTLY as received
     * @param  callable(string, ?string): string  $payload  builds the signed string
     * @return array{ok: bool, reason: ?string}
     */
    public static function verify(
        string $raw,
        ?string $signature,
        ?string $secret,
        callable $payload,
        string $algorithm = 'sha256',
        ?int $tolerance = null,
        ?string $timestamp = null,
        ?int $now = null,
        string $encoding = 'hex',
    ): array {
        if ($secret === null || $secret === '') {
            // Never "accept when unconfigured". An endpoint that verifies
            // nothing because nobody set a secret is strictly worse than one
            // that is off: it looks protected.
            return self::fail('no signing secret configured for this trigger');
        }

        if ($signature === null || $signature === '') {
            return self::fail('delivery carried no signature header');
        }

        if ($tolerance !== null) {
            if ($timestamp === null) {
                return self::fail('delivery carried no timestamp header');
            }
            if (! is_numeric($timestamp)) {
                return self::fail('timestamp header is not a number');
            }
            if (abs(($now ?? time()) - (int) $timestamp) > $tolerance) {
                return self::fail("delivery is outside the {$tolerance}s replay window");
            }
        }

        $raw_hmac = hash_hmac($algorithm, $payload($raw, $timestamp), $secret, $encoding === 'base64');
        $expected = $encoding === 'base64' ? base64_encode($raw_hmac) : $raw_hmac;

        return hash_equals($expected, $signature)
            ? ['ok' => true, 'reason' => null]
            : self::fail('signature did not match');
    }

    /**
     * Pull one header case-insensitively.
     *
     * Header case is not preserved consistently across proxies, frameworks and
     * runtimes; a connector reading `$headers['Stripe-Signature']` would work
     * behind one server and reject every delivery behind another.
     *
     * @param  array<string,string|list<string>>  $headers
     */
    public static function header(array $headers, string $name): ?string
    {
        foreach ($headers as $key => $value) {
            if (strcasecmp((string) $key, $name) !== 0) {
                continue;
            }

            return is_array($value) ? ($value[0] ?? null) : (string) $value;
        }

        return null;
    }

    /** @return array{ok: bool, reason: ?string} */
    private static function fail(string $reason): array
    {
        return ['ok' => false, 'reason' => $reason];
    }
}

<?php


// GENERATED from particle-academy/fancy-connectors — php/src/WebhookVerifier.php
// Do not edit here. Fix it in the package and re-run `php artisan flow:build`;
// a test fails the build when this copy and the package disagree.
declare(strict_types=1);

namespace FancyFlow\Nodes\Connector;

/**
 * Verifying an inbound provider webhook.
 *
 * An unverified webhook endpoint is a public, unauthenticated way to start a
 * workflow in someone's account — which is to say, a way for a stranger to make
 * your app refund an order or post to your Slack. So verification is part of the
 * connector pattern rather than an exercise for the host: a trigger that cannot
 * verify its deliveries must say so, and a host must not be able to mount one by
 * accident.
 *
 * ## The three things every provider's scheme actually needs
 *
 * Providers differ in header names and in what exactly gets signed, and almost
 * nothing else:
 *
 * 1. **The RAW body.** Signatures are computed over bytes. Re-serialising parsed
 *    JSON changes key order and whitespace and produces a signature mismatch
 *    that looks exactly like a wrong secret. The host must pass the body it
 *    received.
 * 2. **A constant-time comparison.** `===` on a signature leaks, through timing,
 *    which prefix was right. That is a real forgery path, not a theoretical one,
 *    and `hash_equals` exists for exactly this.
 * 3. **A timestamp tolerance.** Without it a valid signature is valid forever,
 *    so anyone who ever saw one delivery can replay it whenever they like.
 */
final class WebhookVerifier
{
    /**
     * Verify an HMAC-signed delivery.
     *
     * Returns a RESULT rather than throwing, and the failure carries a reason: a
     * host wants to log which check failed — stale? wrong secret? no header? —
     * while still answering the provider with an opaque 400.
     *
     * @param  string  $raw  the body EXACTLY as received
     * @param  callable(string, ?string): string  $payload  builds the string that gets
     *                                                      signed. Providers differ here more than anywhere else — Stripe signs
     *                                                      `{timestamp}.{body}`, Slack signs `v0:{timestamp}:{body}`, GitHub signs the
     *                                                      body alone.
     * @param  int|null  $now  seconds since the epoch. Injected so tests are not
     *                         clock-dependent.
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
            // that is off: it LOOKS protected.
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

        $computed = hash_hmac($algorithm, $payload($raw, $timestamp), $secret, $encoding === 'base64');
        $expected = $encoding === 'base64' ? base64_encode($computed) : $computed;

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

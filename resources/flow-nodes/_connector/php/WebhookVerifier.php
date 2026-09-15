<?php


// GENERATED from particle-academy/fancy-connector-core — php/src/WebhookVerifier.php
// Do not edit here. Fix it in the package and re-run `node scripts/vendor.mjs --target <this directory>` there;
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
     * @param  callable(string, ?string, ?string): string  $payload  builds the string that gets
     *                                                               signed. Providers differ here more than anywhere else — Stripe signs
     *                                                               `{timestamp}.{body}`, Slack signs `v0:{timestamp}:{body}`, GitHub signs the
     *                                                               body alone, Svix signs `{id}.{timestamp}.{body}` (the third argument).
     * @param  int|null  $now  seconds since the epoch. Injected so tests are not
     *                         clock-dependent.
     * @param  string  $secretEncoding  how the SECRET is spelled: `utf8` (the default, every
     *                                  provider before Svix — the key is the text's bytes) or
     *                                  `base64` (the key is the DECODED bytes; Svix's
     *                                  `whsec_<base64>`, half of whose bytes are not UTF-8)
     * @param  string|null  $secretPrefix  a prefix to strip before decoding (`whsec_`); its
     *                                     absence is a refusal, never a guess
     * @return array{ok: bool, reason: ?string}
     */
    public static function verify(
        string $raw,
        string|array|null $signature,
        ?string $secret,
        callable $payload,
        string $algorithm = 'sha256',
        ?int $tolerance = null,
        ?string $timestamp = null,
        ?int $now = null,
        string $encoding = 'hex',
        string $secretEncoding = 'utf8',
        ?string $secretPrefix = null,
        ?string $id = null,
    ): array {
        if ($secret === null || $secret === '') {
            // Never "accept when unconfigured". An endpoint that verifies
            // nothing because nobody set a secret is strictly worse than one
            // that is off: it LOOKS protected.
            return self::fail('no signing secret configured for this trigger');
        }

        // A LIST when the provider sends several — Stripe signs once per
        // active secret while a secret is rolled, Svix's header "could be any
        // number of signatures" — and the delivery is accepted when ANY
        // matches. A first-only rule fails every delivery whose first
        // signature came from the new secret, for the whole roll.
        $signatures = array_values(array_filter(
            \is_array($signature) ? $signature : [$signature],
            fn (mixed $s): bool => \is_string($s) && $s !== '',
        ));

        if ($signatures === []) {
            return self::fail('delivery carried no signature header');
        }

        // The key is checked BEFORE anything is signed, so a secret that cannot
        // be a key is named as such rather than producing a mismatch that reads
        // like a wrong secret.
        $key = self::secretKeyBytes($secret, $secretEncoding, $secretPrefix);
        if (\is_array($key)) {
            return $key;
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

        // A payload that signs the delivery's ID (Svix) takes it as a third
        // argument; the two-argument payloads every earlier scheme wrote
        // ignore an extra argument, as PHP lets a user function do.
        $computed = hash_hmac($algorithm, $payload($raw, $timestamp, $id), $key, $encoding === 'base64');
        $expected = $encoding === 'base64' ? base64_encode($computed) : $computed;

        // Each candidate is compared in constant time; which of them matched
        // is not a secret, so stopping at the first match leaks nothing.
        foreach ($signatures as $candidate) {
            if (hash_equals($expected, $candidate)) {
                return ['ok' => true, 'reason' => null];
            }
        }

        return self::fail('signature did not match');
    }

    /**
     * The HMAC key a scheme's secret spells, or the refusal it earns.
     *
     * @return string|array{ok: bool, reason: ?string}
     */
    public static function secretKeyBytes(string $secret, string $secretEncoding = 'utf8', ?string $secretPrefix = null): string|array
    {
        $material = $secret;

        if ($secretPrefix !== null) {
            if (! str_starts_with($material, $secretPrefix)) {
                return self::fail('signing secret does not start with '.json_encode($secretPrefix));
            }
            $material = substr($material, \strlen($secretPrefix));
        }

        if ($secretEncoding === 'base64') {
            // Strict: a lenient decode of a KEY is a key nobody can reason about.
            $decoded = base64_decode($material, true);
            if ($decoded === false || $material === '' || preg_match('/^[A-Za-z0-9+\/]*={0,2}$/', $material) !== 1 || \strlen($material) % 4 !== 0) {
                return self::fail('signing secret is not valid base64');
            }

            return $decoded;
        }

        return $material;
    }

    /**
     * Verify a delivery by a token the provider ECHOES rather than a signature
     * it computes.
     *
     * Google Calendar sends the channel's `token` back in `X-Goog-Channel-Token`
     * on every notification — with an EMPTY body, so there is nothing to sign.
     * Microsoft Graph sends `clientState` inside every item of the
     * notification's `value` array. Same refusal-by-default as HMAC, same
     * result shape, and `hash_equals`: a token is a secret.
     *
     * `$in` is `header` (then `$name` is the header) or `body` (then `$name` is
     * a dotted path into the JSON body; a segment ending in `[]` means EVERY
     * element of that array, all of which must match — one wrong item refuses
     * the whole delivery).
     *
     * @param  array<string,string|list<string>>  $headers
     * @return array{ok: bool, reason: ?string}
     */
    public static function verifySharedToken(string $raw, array $headers, ?string $secret, string $in, string $name): array
    {
        if ($secret === null || $secret === '') {
            // Never "accept when unconfigured" — the same rule as verify(), for
            // the same reason: an endpoint that verifies nothing LOOKS protected.
            return self::fail('no shared token configured for this trigger');
        }

        if ($in === 'header') {
            $tokens = [self::header($headers, $name)];
        } else {
            try {
                $parsed = json_decode($raw, true, 512, JSON_THROW_ON_ERROR);
            } catch (\JsonException) {
                return self::fail('delivery body is not JSON');
            }
            $tokens = self::readTokens($parsed, explode('.', $name));
        }

        $present = array_values(array_filter($tokens, fn (mixed $t): bool => $t !== null && $t !== ''));
        if ($present === []) {
            return self::fail('delivery carried no token');
        }

        // Every element is compared, none is skipped: a batch is accepted as a
        // whole or refused as a whole.
        $matched = \count($present) === \count($tokens);
        foreach ($present as $token) {
            $matched = (\is_string($token) && hash_equals($secret, $token)) && $matched;
        }

        return $matched ? ['ok' => true, 'reason' => null] : self::fail('token did not match');
    }

    /**
     * Answer a provider's challenge — Graph POSTs `?validationToken=…` when a
     * subscription is created and refuses to create it unless the token comes
     * back, decoded, as `text/plain`. The pure half: what to send, or null when
     * the request is not a challenge at all (no parameter, an empty one, or a
     * trigger that declares no handshake).
     *
     * @param  array<string,string|list<string>>  $query  the request's query, already URL-decoded by the framework
     * @return array{status: int, contentType: string, body: string}|null
     */
    public static function handshakeResponse(?string $param, array $query, string $contentType = 'text/plain'): ?array
    {
        if ($param === null) {
            return null;
        }

        $raw = $query[$param] ?? null;
        $token = \is_array($raw) ? ($raw[0] ?? null) : $raw;
        if ($token === null || $token === '') {
            return null;
        }

        return ['status' => 200, 'contentType' => $contentType, 'body' => (string) $token];
    }

    /**
     * Every value at a dotted path; a `[]` segment fans out over a list. Absent is null.
     *
     * @param  list<string>  $segments
     * @return list<mixed>
     */
    private static function readTokens(mixed $value, array $segments): array
    {
        if ($segments === []) {
            return [$value];
        }

        $head = array_shift($segments);
        $eachElement = str_ends_with($head, '[]');
        $key = $eachElement ? substr($head, 0, -2) : $head;

        if (! \is_array($value) || ! array_key_exists($key, $value)) {
            return [null];
        }
        $next = $value[$key];

        if (! $eachElement) {
            return self::readTokens($next, $segments);
        }
        if (! \is_array($value[$key]) || ! array_is_list($next)) {
            return [null];
        }

        $found = [];
        foreach ($next as $element) {
            foreach (self::readTokens($element, $segments) as $token) {
                $found[] = $token;
            }
        }

        return $found;
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

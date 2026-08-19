<?php


// GENERATED from particle-academy/fancy-connectors — php/src/FakeValues.php
// Do not edit here. Fix it in the package and re-run `php artisan flow:build`;
// a test fails the build when this copy and the package disagree.
declare(strict_types=1);

namespace FancyFlow\Nodes\Connector;

/**
 * Deterministic value helpers handed to a faker.
 *
 * ## Why every connector ships one, not just the ones without a sandbox
 *
 * A sandbox still needs an account, a key, a network, and a provider that is up.
 * That is four ways for someone evaluating the kit to get nothing working before
 * they have learned anything about it. A faker removes all four: vendor a
 * connector, press run, see a shaped result.
 *
 * It is also what makes the fixtures honest. Fixtures run on both runtimes and
 * are the publish gate; if they needed a network they would either be skipped in
 * CI or be flaky, and a flaky gate is one people learn to re-run rather than
 * read.
 *
 * ## Bit-for-bit identical to the TypeScript faker
 *
 * Not "similar": the same FNV-1a seed and the same xorshift32 sequence, so a
 * golden fixture can assert the exact faked payload and BOTH runtimes have to
 * produce it. That turns the faker into a parity test rather than a convenience
 * — which matters, because cross-runtime drift does not fail loudly. It
 * completes, down one path, with no error.
 *
 * PHP integers are 64-bit, so every 32-bit operation is masked back into range.
 * Dropping one of those masks does not break anything visibly; it just makes the
 * two runtimes diverge after a few hundred calls, which is the worst possible
 * way for this to fail.
 *
 * ## Deterministic, and obviously fake
 *
 * Same inputs, same output — always. A faker returning a fresh uuid every call
 * cannot be asserted on, so its fixtures degrade to "it did not throw", which is
 * the assertion that catches nothing. And the values are obviously synthetic ON
 * PURPOSE — `fake_`-prefixed ids, `example.test` hosts, round numbers. Nobody
 * should ever look at a faked result and wonder whether it moved real money.
 */
final class FakeValues
{
    /**
     * The instant every faker counts from.
     *
     * A constant rather than the clock, because a fixture asserting on
     * `createdAt` must not start failing tomorrow.
     */
    public const EPOCH = '2026-01-01T00:00:00.000Z';

    private const MASK = 0xFFFFFFFF;

    private int $state;

    public function __construct(int $seed)
    {
        $this->state = ($seed & self::MASK) !== 0 ? $seed & self::MASK : 0x9E3779B9;
    }

    /**
     * The seed for one faked call: service, operation, and the caller's config.
     *
     * A dedicated entry point rather than a variadic one, because the config has
     * to be rendered as an OBJECT even when it is empty. PHP cannot tell an empty
     * map from an empty list, so `[]` would otherwise render as `[]` here and
     * `{}` in JavaScript — and the two runtimes would seed differently for every
     * call whose config happens to be blank, which is exactly the case a first
     * fixture uses.
     *
     * @param  array<string,mixed>  $config
     */
    public static function seedForCall(string $service, string $operation, array $config): int
    {
        return self::seed($service, $operation, self::stableObject($config));
    }

    /** FNV-1a over the stable rendering of the parts. Twin of `seedFrom`. */
    public static function seed(mixed ...$parts): int
    {
        $text = implode('|', array_map(
            static fn (mixed $part): string => is_string($part) ? $part : self::stableJson($part),
            $parts,
        ));

        $hash = 0x811C9DC5;

        for ($i = 0, $length = strlen($text); $i < $length; $i++) {
            $hash ^= ord($text[$i]);
            $hash = ($hash * 0x01000193) & self::MASK;
        }

        return $hash;
    }

    /** A stable id with the provider's usual prefix: `id('ch')` gives `ch_fake_1a2b3c…`. */
    public function id(string $prefix): string
    {
        return $prefix.'_fake_'.$this->hex(12);
    }

    /** A stable lowercase hex string of `$length` characters. */
    public function hex(int $length): string
    {
        $out = '';

        while (strlen($out) < $length) {
            $out .= str_pad(dechex($this->next()), 8, '0', STR_PAD_LEFT);
        }

        return substr($out, 0, $length);
    }

    /** A stable integer in `[$min, $max]`. */
    public function int(int $min, int $max): int
    {
        return $min + ($this->next() % max(1, $max - $min + 1));
    }

    /**
     * Pick a stable element of a list.
     *
     * @template T
     *
     * @param  list<T>  $options
     * @return T
     */
    public function pick(array $options): mixed
    {
        return $options[$this->next() % count($options)];
    }

    /** A fixed ISO-8601 instant, offset by whole seconds. Never `now()`. */
    public function timestamp(int $offsetSeconds = 0): string
    {
        return gmdate('Y-m-d\TH:i:s', (int) strtotime(self::EPOCH) + $offsetSeconds).'.000Z';
    }

    /** xorshift32, matching the JS generator step for step. */
    private function next(): int
    {
        $state = $this->state;
        $state ^= ($state << 13) & self::MASK;
        $state &= self::MASK;
        $state ^= $state >> 17;
        $state ^= ($state << 5) & self::MASK;
        $state &= self::MASK;

        return $this->state = $state;
    }

    /**
     * Key order must not change a seed.
     *
     * `json_encode` preserves insertion order, so `{a,b}` and `{b,a}` would hash
     * differently and "same inputs, same output" would hold only for arrays that
     * happened to be built in the same order — the kind of almost-true that
     * survives review and fails in a fixture months later.
     */
    private static function stableJson(mixed $value): string
    {
        if (! is_array($value)) {
            return json_encode($value, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE) ?: 'null';
        }

        // An empty PHP array renders as `[]`, matching an empty JavaScript
        // array. The one shape PHP genuinely cannot distinguish — an empty MAP —
        // is handled by `stableObject`, which callers use where they know it is
        // one.
        if (array_is_list($value)) {
            return '['.implode(',', array_map(self::stableJson(...), $value)).']';
        }

        return self::stableObject($value);
    }

    /**
     * Render an associative array as a JSON object with sorted keys.
     *
     * Nulls are KEPT, because `JSON.stringify` keeps them; only JavaScript's
     * `undefined` disappears, and PHP has no such value to drop.
     *
     * @param  array<string,mixed>  $value
     */
    private static function stableObject(array $value): string
    {
        ksort($value);

        $parts = [];

        foreach ($value as $key => $item) {
            $parts[] = json_encode((string) $key, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE)
                .':'.self::stableJson($item);
        }

        return '{'.implode(',', $parts).'}';
    }
}

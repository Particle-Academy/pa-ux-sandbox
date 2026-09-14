<?php

namespace Database\Factories\Support;

use BadMethodCallException;
use OverflowException;
use ReflectionMethod;

/**
 * The generator behind `FakeData::unique()`.
 *
 * Every formatter on FakeData is available here, and each one draws again
 * until it finds a value it has not returned before.
 *
 * @mixin FakeData
 */
final class UniqueFakeData
{
    /**
     * Values already returned, keyed by formatter and then by value.
     *
     * @var array<string, array<string, true>>
     */
    private array $returned = [];

    public function __construct(
        private readonly FakeData $fake,
        private readonly int $maxRetries = 10_000,
    ) {}

    /**
     * @param  array<int|string, mixed>  $arguments
     */
    public function __call(string $formatter, array $arguments): mixed
    {
        if (! self::isFormatter($formatter)) {
            throw new BadMethodCallException(sprintf('%s::%s() is not a formatter unique() can wrap.', FakeData::class, $formatter));
        }

        $formatter = strtolower($formatter);

        for ($attempt = 0; $attempt <= $this->maxRetries; $attempt++) {
            $value = $this->fake->{$formatter}(...$arguments);
            $key = serialize($value);

            if (! isset($this->returned[$formatter][$key])) {
                $this->returned[$formatter][$key] = true;

                return $value;
            }
        }

        throw new OverflowException(sprintf('No unique value for %s() after %d retries.', $formatter, $this->maxRetries));
    }

    /**
     * A formatter is a public instance method that produces a value, which
     * rules out the constructor, `shared()`, `seed()` and `unique()` itself.
     */
    private static function isFormatter(string $method): bool
    {
        if (in_array(strtolower($method), ['seed', 'unique'], true) || ! method_exists(FakeData::class, $method)) {
            return false;
        }

        $reflection = new ReflectionMethod(FakeData::class, $method);

        return $reflection->isPublic() && ! $reflection->isStatic() && ! $reflection->isConstructor();
    }
}

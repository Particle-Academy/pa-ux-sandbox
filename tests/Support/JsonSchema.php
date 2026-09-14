<?php

namespace Tests\Support;

use LogicException;
use stdClass;

/**
 * A deliberately small JSON Schema (draft 2020-12) validator for the schemas
 * this app publishes at `/schema/*.json`.
 *
 * ## Why ours, and why this small
 *
 * No validator is installed, and adding one is third-party code that needs
 * approval. The schemas it checks are ours and use a handful of keywords, so
 * the subset is written here instead.
 *
 * ## The rule that keeps a subset honest
 *
 * A validator that silently IGNORES a keyword it does not implement is a check
 * that does not check: a schema could say `"format": "uri"` or `"oneOf"` and
 * every document would pass it. So {@see assertSupported()} walks the WHOLE
 * schema up front — every branch, every `$defs` entry, referenced or not — and
 * throws on any keyword outside {@see KEYWORDS}. Using a new keyword means
 * implementing it here first, with a test that it rejects something.
 *
 * Instances must be decoded with `json_decode($json, false)`: an object is a
 * `stdClass` and a list is an array, which is the only way PHP can tell `{}`
 * from `[]`.
 */
final class JsonSchema
{
    /** Keywords that validate. */
    private const ASSERTIONS = [
        'type', 'properties', 'required', 'additionalProperties', 'items', 'minItems',
        'enum', 'const', 'pattern', 'minLength', 'minimum', '$ref',
    ];

    /** Keywords that only describe, and are safe to carry without enforcing. */
    private const ANNOTATIONS = ['$schema', '$id', '$defs', 'title', 'description', '$comment', 'examples', 'default'];

    public const KEYWORDS = [...self::ASSERTIONS, ...self::ANNOTATIONS];

    /** @param array<string,mixed> $schema the root schema, decoded as an associative array */
    public function __construct(private readonly array $schema)
    {
        self::assertSupported($schema, '#');
    }

    public static function fromFile(string $path): self
    {
        return new self(json_decode((string) file_get_contents($path), true, flags: JSON_THROW_ON_ERROR));
    }

    /**
     * Validate a decoded instance. Returns every violation, each prefixed with
     * the JSON pointer it was found at; an empty list means valid.
     *
     * @return list<string>
     */
    public function validate(mixed $instance): array
    {
        $errors = [];
        $this->check($this->schema, $instance, '', $errors);

        return $errors;
    }

    /**
     * Throw on any keyword this class does not implement, anywhere in the tree.
     *
     * @param  array<string,mixed>  $schema
     */
    public static function assertSupported(array $schema, string $at): void
    {
        foreach (array_keys($schema) as $keyword) {
            if (! in_array($keyword, self::KEYWORDS, true)) {
                throw new LogicException("Unsupported JSON Schema keyword `{$keyword}` at {$at}: implement it in ".self::class.' before using it.');
            }
        }

        foreach (['properties', '$defs'] as $container) {
            foreach ((array) ($schema[$container] ?? []) as $name => $sub) {
                self::assertSupported((array) $sub, "{$at}/{$container}/{$name}");
            }
        }

        foreach (['items', 'additionalProperties'] as $single) {
            if (is_array($schema[$single] ?? null)) {
                self::assertSupported($schema[$single], "{$at}/{$single}");
            }
        }

        if (isset($schema['$ref']) && ! str_starts_with((string) $schema['$ref'], '#/$defs/')) {
            throw new LogicException("Only local `#/\$defs/…` references are supported, got `{$schema['$ref']}` at {$at}.");
        }
    }

    /**
     * @param  array<string,mixed>  $schema
     * @param  list<string>  $errors
     */
    private function check(array $schema, mixed $value, string $path, array &$errors): void
    {
        $at = $path === '' ? '/' : $path;

        if (isset($schema['$ref'])) {
            $name = substr((string) $schema['$ref'], strlen('#/$defs/'));
            $target = $this->schema['$defs'][$name] ?? null;

            if (! is_array($target)) {
                throw new LogicException("Unresolvable \$ref `{$schema['$ref']}` at {$at}.");
            }

            $this->check($target, $value, $path, $errors);
        }

        if (isset($schema['type'])) {
            $types = (array) $schema['type'];

            if (! array_filter($types, fn (string $type): bool => self::isType($value, $type))) {
                $errors[] = "{$at}: expected ".implode('|', $types).', got '.self::describe($value);

                // Every other keyword assumes the type; checking them now only
                // buries the one error that matters under consequences of it.
                return;
            }
        }

        if (array_key_exists('const', $schema) && $value !== $schema['const']) {
            $errors[] = "{$at}: must be ".json_encode($schema['const']);
        }

        if (isset($schema['enum']) && ! in_array($value, $schema['enum'], true)) {
            $errors[] = "{$at}: ".json_encode($value).' is not one of '.json_encode($schema['enum']);
        }

        if (is_string($value)) {
            if (isset($schema['minLength']) && mb_strlen($value) < $schema['minLength']) {
                $errors[] = "{$at}: shorter than {$schema['minLength']}";
            }

            if (isset($schema['pattern']) && preg_match('~'.str_replace('~', '\~', $schema['pattern']).'~u', $value) !== 1) {
                $errors[] = "{$at}: ".json_encode($value)." does not match {$schema['pattern']}";
            }
        }

        if ((is_int($value) || is_float($value)) && isset($schema['minimum']) && $value < $schema['minimum']) {
            $errors[] = "{$at}: below minimum {$schema['minimum']}";
        }

        if (is_array($value)) {
            if (isset($schema['minItems']) && count($value) < $schema['minItems']) {
                $errors[] = "{$at}: fewer than {$schema['minItems']} items";
            }

            if (is_array($schema['items'] ?? null)) {
                foreach ($value as $index => $item) {
                    $this->check($schema['items'], $item, "{$path}/{$index}", $errors);
                }
            }
        }

        if ($value instanceof stdClass) {
            $object = get_object_vars($value);

            foreach ((array) ($schema['required'] ?? []) as $key) {
                if (! array_key_exists($key, $object)) {
                    $errors[] = "{$at}: missing required property `{$key}`";
                }
            }

            $properties = (array) ($schema['properties'] ?? []);

            foreach ($object as $key => $item) {
                $child = $path.'/'.$key;

                if (array_key_exists($key, $properties)) {
                    $this->check((array) $properties[$key], $item, $child, $errors);
                } elseif (($schema['additionalProperties'] ?? true) === false) {
                    $errors[] = "{$at}: property `{$key}` is not allowed";
                } elseif (is_array($schema['additionalProperties'] ?? null)) {
                    $this->check($schema['additionalProperties'], $item, $child, $errors);
                }
            }
        }
    }

    private static function isType(mixed $value, string $type): bool
    {
        return match ($type) {
            'object' => $value instanceof stdClass,
            'array' => is_array($value),
            'string' => is_string($value),
            'integer' => is_int($value) || (is_float($value) && floor($value) === $value),
            'number' => is_int($value) || is_float($value),
            'boolean' => is_bool($value),
            'null' => $value === null,
            default => throw new LogicException("Unknown JSON Schema type `{$type}`."),
        };
    }

    private static function describe(mixed $value): string
    {
        return match (true) {
            $value instanceof stdClass => 'object',
            is_array($value) => 'array',
            default => get_debug_type($value),
        };
    }
}

<?php

declare(strict_types=1);

namespace FancyFlow\Nodes\LlmInput;

/**
 * Checking and normalising a generated form.
 *
 * The PHP twin of `../js/fields.ts`, and identical on purpose: the shared
 * golden fixtures assert that a malformed form is rejected with the same
 * message whichever runtime executed it. Two runtimes that disagree about what
 * counts as usable is exactly the drift the fixture format exists to catch.
 */
final class GeneratedForm
{
    /** @var list<string> */
    public const TYPES = ['text', 'textarea', 'number', 'select', 'switch'];

    /**
     * Everything wrong with a generated form, all at once.
     *
     * A model returns plausible JSON, not correct JSON, and every defect here
     * has the same shape: the run parks on a form that looks fine and produces
     * values nothing downstream can read — surfacing long after a person has
     * already filled the thing in.
     *
     * @param  list<string>  $requiredKeys
     * @return list<string>
     */
    public static function problems(mixed $fields, array $requiredKeys = [], ?int $maxFields = null): array
    {
        if (! is_array($fields) || ! array_is_list($fields)) {
            return ['the model returned no field list'];
        }
        if ($fields === []) {
            return ['the model returned an empty form'];
        }

        $problems = [];

        if ($maxFields !== null && count($fields) > $maxFields) {
            $problems[] = 'the model returned '.count($fields)." fields, over the {$maxFields} allowed";
        }

        $seen = [];

        foreach ($fields as $index => $field) {
            $at = 'field '.($index + 1);
            $field = is_array($field) ? $field : [];
            $key = is_string($field['key'] ?? null) ? trim($field['key']) : '';

            if ($key === '') {
                $problems[] = "{$at}: no key — its value would be unreachable";
            } elseif (in_array($key, $seen, true)) {
                // Two fields sharing a key means one silently overwrites the
                // other on submit, and the form gives no sign of it.
                $problems[] = "{$at}: duplicate key \"{$key}\"";
            } else {
                $seen[] = $key;
            }

            if (! is_string($field['label'] ?? null) || trim($field['label']) === '') {
                $problems[] = "{$at}: no label — the person filling it in cannot tell what it wants";
            }

            $type = $field['type'] ?? null;
            if ($type !== null && ! in_array($type, self::TYPES, true)) {
                $problems[] = "{$at}: unknown type \"".(is_string($type) ? $type : gettype($type)).'"';
            }

            if ($type === 'select' && ! is_array($field['options'] ?? null)) {
                $problems[] = "{$at}: a select with no options renders as an empty dropdown";
            } elseif ($type === 'select' && $field['options'] === []) {
                $problems[] = "{$at}: a select with no options renders as an empty dropdown";
            }
        }

        // The contract with downstream nodes. Without it, a node reading
        // `values.email` breaks silently because the model chose `emailAddress`.
        $missing = array_values(array_diff($requiredKeys, $seen));
        if ($missing !== []) {
            $problems[] = 'missing required key'.(count($missing) === 1 ? '' : 's').': '.implode(', ', $missing);
        }

        return $problems;
    }

    /**
     * Fill in what a model reasonably leaves out, without inventing meaning.
     *
     * @param  list<array<string,mixed>>  $fields
     * @return list<array<string,mixed>>
     */
    public static function normalize(array $fields): array
    {
        return array_map(fn (array $field) => [
            ...$field,
            // `text` is the only default that cannot lose information: a
            // textarea rendered as text still accepts the answer, a switch does
            // not.
            'type' => $field['type'] ?? 'text',
            'required' => $field['required'] ?? false,
        ], $fields);
    }
}

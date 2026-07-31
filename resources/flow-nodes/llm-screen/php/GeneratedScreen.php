<?php

declare(strict_types=1);

namespace FancyFlow\Nodes\LlmScreen;

/**
 * Checking a generated screen before anything renders it.
 *
 * The PHP twin of `../js/schema.ts`, identical on purpose: the shared golden
 * fixtures assert that a schema naming a component the host never registered is
 * rejected with the same message whichever runtime executed it.
 *
 * fancy-screens renders an unknown name as a visible orange placeholder — right
 * for a developer typing a schema by hand, wrong for a workflow, where it means
 * the run completes, reports success, and delivers an error message to a person.
 */
final class GeneratedScreen
{
    public const MAX_DEPTH = 12;

    /**
     * Everything wrong with a generated schema, all at once.
     *
     * @param  list<string>  $components
     * @return list<string>
     */
    public static function problems(mixed $schema, array $components, int $maxDepth = self::MAX_DEPTH): array
    {
        $problems = [];
        $unknown = [];

        self::walk($schema, 'screen', 0, $components, $maxDepth, $problems, $unknown);

        if ($unknown !== []) {
            // The actionable half of an unknown-component error: the model was
            // told what exists, so the fix is usually the registry, not the
            // prompt.
            $problems[] = 'registered components are: '
                .($components === [] ? '(none — the host registered nothing)' : implode(', ', $components));
        }

        return $problems;
    }

    /**
     * @param  list<string>  $components
     * @param  list<string>  $problems
     * @param  list<string>  $unknown
     */
    private static function walk(
        mixed $node,
        string $path,
        int $depth,
        array $components,
        int $maxDepth,
        array &$problems,
        array &$unknown,
    ): void {
        if (is_string($node)) {
            return;
        }

        if (! is_array($node) || array_is_list($node)) {
            $problems[] = "{$path}: expected a component object or a string, got ".self::describe($node);

            return;
        }

        if ($depth > $maxDepth) {
            // A model that loses its place emits a tree that nests until
            // something downstream blows its stack. Naming the depth beats a
            // recursion error.
            $problems[] = "{$path}: nested deeper than {$maxDepth} levels";

            return;
        }

        $type = $node['type'] ?? null;

        if (! is_string($type) || trim($type) === '') {
            $problems[] = "{$path}: no component type";
        } elseif (! in_array($type, $components, true) && ! in_array($type, $unknown, true)) {
            // Reported once per name, not once per occurrence: a model that
            // gets a name wrong usually uses it a dozen times, and a dozen
            // identical lines buries the other problems.
            $unknown[] = $type;
            $problems[] = "{$path}: unknown component \"{$type}\"";
        }

        if (isset($node['props']) && (! is_array($node['props']) || array_is_list($node['props']))) {
            $problems[] = "{$path}: props must be an object";
        }

        if (! isset($node['children'])) {
            return;
        }

        if (! is_array($node['children']) || ! array_is_list($node['children'])) {
            $problems[] = "{$path}: children must be an array";

            return;
        }

        foreach ($node['children'] as $index => $child) {
            self::walk($child, "{$path}.children[{$index}]", $depth + 1, $components, $maxDepth, $problems, $unknown);
        }
    }

    private static function describe(mixed $value): string
    {
        if ($value === null) {
            return 'null';
        }
        if (is_array($value)) {
            return 'an array';
        }

        return get_debug_type($value);
    }
}

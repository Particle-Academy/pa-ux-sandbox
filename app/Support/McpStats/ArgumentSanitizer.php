<?php

namespace App\Support\McpStats;

/**
 * Turns an MCP request's arguments into what may be stored: every key that
 * looks like a secret dropped at every depth, and the JSON held to the
 * configured byte budget while staying valid JSON.
 *
 * Over budget, it degrades in steps: clip long strings and lists, then drop
 * trailing top-level keys, then fall back to a bare marker. Each step keeps a
 * parseable document, so the rollup can still read the leading arguments,
 * which for every tool on this server are the ones that matter (`query`,
 * `name`, `kind`).
 */
class ArgumentSanitizer
{
    private const TRUNCATED_KEY = '_truncated';

    /**
     * @return array{json: string|null, truncated: bool}
     */
    public function sanitize(mixed $arguments): array
    {
        if ($arguments === null || $arguments === [] || $arguments === '') {
            return ['json' => null, 'truncated' => false];
        }

        $maxBytes = max(32, (int) config('mcp-stats.arguments.max_bytes', 2048));
        $clean = $this->dropSecrets($arguments, 0);
        $json = $this->encode($clean);

        if (strlen($json) <= $maxBytes) {
            return ['json' => $json, 'truncated' => false];
        }

        $clipped = $this->clip($clean, 0);
        $json = $this->encode($clipped);
        if (strlen($json) <= $maxBytes) {
            return ['json' => $json, 'truncated' => true];
        }

        if (is_array($clipped) && ! array_is_list($clipped)) {
            $kept = [];
            foreach ($clipped as $key => $value) {
                $candidate = $kept + [$key => $value];
                if (strlen($this->encode($candidate + [self::TRUNCATED_KEY => true])) > $maxBytes) {
                    break;
                }
                $kept = $candidate;
            }

            return ['json' => $this->encode($kept + [self::TRUNCATED_KEY => true]), 'truncated' => true];
        }

        return ['json' => $this->encode([self::TRUNCATED_KEY => true]), 'truncated' => true];
    }

    /** Whether a key names something that must never be stored. */
    public function isSecretKey(string $key): bool
    {
        foreach ((array) config('mcp-stats.arguments.secret_key_patterns', []) as $pattern) {
            if (preg_match('~'.$pattern.'~i', $key) === 1) {
                return true;
            }
        }

        return false;
    }

    private function dropSecrets(mixed $value, int $depth): mixed
    {
        if (! is_array($value)) {
            return $value;
        }

        if ($depth >= (int) config('mcp-stats.arguments.max_depth', 6)) {
            return '[nested]';
        }

        $out = [];
        foreach ($value as $key => $item) {
            if (is_string($key) && $this->isSecretKey($key)) {
                continue;
            }
            $out[$key] = $this->dropSecrets($item, $depth + 1);
        }

        return array_is_list($value) ? array_values($out) : $out;
    }

    private function clip(mixed $value, int $depth): mixed
    {
        $maxString = max(8, (int) config('mcp-stats.arguments.max_string', 200));
        $maxItems = max(1, (int) config('mcp-stats.arguments.max_items', 20));

        if (is_string($value)) {
            return mb_strlen($value) > $maxString ? mb_substr($value, 0, $maxString).'…' : $value;
        }

        if (! is_array($value)) {
            return $value;
        }

        if (array_is_list($value) && count($value) > $maxItems) {
            $value = array_slice($value, 0, $maxItems);
        }

        return array_map(fn (mixed $item): mixed => $this->clip($item, $depth + 1), $value);
    }

    private function encode(mixed $value): string
    {
        $json = json_encode(
            is_array($value) && $value === [] ? new \stdClass : $value,
            JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE | JSON_INVALID_UTF8_SUBSTITUTE | JSON_PARTIAL_OUTPUT_ON_ERROR,
        );

        return $json === false ? '{}' : $json;
    }
}

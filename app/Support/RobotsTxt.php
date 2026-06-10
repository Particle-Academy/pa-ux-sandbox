<?php

namespace App\Support;

/**
 * Minimal robots.txt evaluator — enough to keep our own screenshot scraper
 * honest. Parses User-agent groups and their Disallow/Allow prefixes; a path is
 * blocked when the longest matching rule is a Disallow. Errs toward "allowed"
 * (no robots, unparseable, or empty rules → allowed) so a quirky robots file
 * never silently kills legitimate captures.
 */
class RobotsTxt
{
    /** Is $path crawlable for $userAgent under the given robots.txt body? */
    public static function allows(string $body, string $path, string $userAgent = '*'): bool
    {
        $path = '/'.ltrim($path, '/');

        /** @var array<string, list<array{allow: bool, prefix: string}>> $groups */
        $groups = [];
        $current = [];
        $expectRules = false;

        foreach (preg_split('/\r\n|\r|\n/', $body) ?: [] as $raw) {
            $line = trim(preg_replace('/#.*$/', '', $raw));
            if ($line === '' || ! str_contains($line, ':')) {
                continue;
            }
            [$field, $value] = array_map('trim', explode(':', $line, 2));
            $field = strtolower($field);

            if ($field === 'user-agent') {
                if ($expectRules) {
                    $current = [];
                    $expectRules = false;
                }
                $ua = strtolower($value);
                $current[] = $ua;
                $groups[$ua] ??= [];
            } elseif (($field === 'disallow' || $field === 'allow') && $current !== []) {
                $expectRules = true;
                if ($value === '') {
                    continue; // empty Disallow = allow all; empty Allow = no-op
                }
                foreach ($current as $ua) {
                    $groups[$ua][] = ['allow' => $field === 'allow', 'prefix' => $value];
                }
            }
        }

        $rules = $groups[strtolower($userAgent)] ?? $groups['*'] ?? [];

        // Longest-prefix wins (standard robots precedence); Allow beats Disallow on ties.
        $verdict = true;
        $bestLen = -1;
        foreach ($rules as $rule) {
            if (str_starts_with($path, $rule['prefix'])) {
                $len = strlen($rule['prefix']);
                if ($len > $bestLen || ($len === $bestLen && $rule['allow'])) {
                    $bestLen = $len;
                    $verdict = $rule['allow'];
                }
            }
        }

        return $verdict;
    }
}

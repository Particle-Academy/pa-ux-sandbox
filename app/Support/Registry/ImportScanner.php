<?php

namespace App\Support\Registry;

use RuntimeException;

/**
 * The module specifiers a JS/TS source file really imports.
 *
 * `npx fancy-cli add` installs whatever an item's `dependencies` says, so this
 * answers "what does this file import", not "where does the word `from` appear
 * before a quote". The regex this replaced answered the second question, and
 * read source fragments out of template literals, JSX attributes and string
 * arrays into the registry.
 *
 * It works in two steps. {@see mask()} blanks everything that is not code, byte
 * for byte, so offsets line up with the original: comments, template text, regex
 * bodies and the CONTENTS of strings. The statement patterns then run over that,
 * so nothing inside a string can look like a statement, and each specifier is
 * read back from the original at the offset of its blanked string.
 *
 * ## Why a scanner can be this small
 *
 * This is not a parser, and TSX cannot be tokenised without one: `Don't` in JSX
 * text is an apostrophe, not a string. It stays in step because a quoted string
 * cannot span a line. A quote with no partner on its line is just a character,
 * so any confusion from JSX text ends at the newline.
 *
 * Only a template literal or a block comment can span lines, so only they can
 * derail the rest of a file. Reaching the end of a file inside one means the
 * scan went wrong or the source is broken, and either way the imports after that
 * point cannot be trusted. That throws, because carrying on would silently lose
 * real dependencies, which is the same bug as listing false ones.
 */
final class ImportScanner
{
    /**
     * Each captures the quote and the blanked string contents as groups 1 and 2.
     *
     * Static forms must start a statement, which is what separates them from a
     * sentence in JSX text. Their clause may hold only what an import clause can
     * hold, so `export const x = ...` and `export interface X { from: "y" }` stop
     * at the first character that cannot be part of one.
     */
    private const PATTERNS = [
        // import x from 'y', import {a} from 'y', import type T from 'y'
        '/(?:^|;)[ \t]*import\b[\w$\s,*{}]*?\bfrom\s*(["\'])( *)\1/m',
        // import 'y'
        '/(?:^|;)[ \t]*import\s*(["\'])( *)\1/m',
        // export {a} from 'y', export * from 'y', export type {T} from 'y'
        '/(?:^|;)[ \t]*export\b[\w$\s,*{}]*?\bfrom\s*(["\'])( *)\1/m',
        // import('y'), and the type-level `import('y').T`, but not `loader.import('y')`
        '/(?<![\w$.])import\s*\(\s*(["\'])( *)\1/',
    ];

    /** A `/` after one of these opens a regex; after anything else it divides or closes a tag. */
    private const BEFORE_REGEX = '(,=:[!&|?{;+-*%~^';

    /**
     * Every specifier in a file, in source order, duplicates included.
     *
     * @param  string  $label  what to call this source if it has to refuse it
     * @return list<string>
     */
    public static function specifiers(string $source, string $label): array
    {
        $masked = self::mask($source, $label);
        $found = [];

        foreach (self::PATTERNS as $pattern) {
            if (preg_match_all($pattern, $masked, $matches, PREG_OFFSET_CAPTURE) === false) {
                throw new RuntimeException("Could not scan {$label} for imports: ".preg_last_error_msg());
            }

            foreach ($matches[2] as [$blank, $offset]) {
                $found[$offset] = substr($source, $offset, strlen($blank));
            }
        }

        ksort($found);

        return array_values($found);
    }

    /**
     * The source with every non-code byte blanked. Newlines survive, so the line
     * anchors in {@see PATTERNS} still mean what they say.
     */
    private static function mask(string $source, string $label): string
    {
        $out = $source;
        $length = strlen($source);
        $i = 0;

        // Open `${` expressions, innermost last: the brace depth of the code
        // around each one, so the `}` that closes it can be told from any other.
        $templates = [];
        $depth = 0;

        $blank = static function (int $from, int $to) use (&$out): void {
            for ($k = $from; $k < $to; $k++) {
                if ($out[$k] !== "\n") {
                    $out[$k] = ' ';
                }
            }
        };

        while ($i < $length) {
            $i += strcspn($source, "'\"`/{}", $i);
            if ($i >= $length) {
                break;
            }

            $char = $source[$i];

            if ($char === "'" || $char === '"') {
                $end = self::closingQuote($source, $i, $length);
                if ($end !== null) {
                    $blank($i + 1, $end);
                    $i = $end;
                }
                $i++;

                continue;
            }

            if ($char === '/') {
                $next = $source[$i + 1] ?? '';
                if ($next === '/') {
                    $end = strpos($source, "\n", $i);
                    $end = $end === false ? $length : $end;
                    $blank($i, $end);
                    $i = $end;
                } elseif ($next === '*') {
                    $end = strpos($source, '*/', $i + 2);
                    if ($end === false) {
                        throw new RuntimeException("Could not scan {$label} for imports: it ends inside a block comment.");
                    }
                    $blank($i, $end + 2);
                    $i = $end + 2;
                } else {
                    $end = self::opensRegex($out, $i) ? self::closingSlash($source, $i, $length) : null;
                    if ($end !== null) {
                        $blank($i + 1, $end);
                        $i = $end;
                    }
                    $i++;
                }

                continue;
            }

            if ($char === '{') {
                $depth++;
                $i++;

                continue;
            }

            if ($char === '}' && ($depth > 0 || $templates === [])) {
                $depth = max(0, $depth - 1);
                $i++;

                continue;
            }

            // A backtick opening template text, or the `}` that resumes it.
            if ($char === '}') {
                $depth = array_pop($templates);
            }

            $text = self::endOfTemplateText($source, $i + 1, $length, $label);
            $blank($text['from'], $text['to']);
            if ($text['opensExpression']) {
                $templates[] = $depth;
                $depth = 0;
            }
            $i = $text['next'];
        }

        if ($templates !== []) {
            throw new RuntimeException("Could not scan {$label} for imports: it ends inside a template literal.");
        }

        return $out;
    }

    /** The offset of the quote closing the string at `$open`, or null if its line ends first. */
    private static function closingQuote(string $source, int $open, int $length): ?int
    {
        $quote = $source[$open];

        for ($i = $open + 1; $i < $length; $i++) {
            $char = $source[$i];
            if ($char === '\\') {
                $i++;
            } elseif ($char === $quote) {
                return $i;
            } elseif ($char === "\n") {
                return null;
            }
        }

        return null;
    }

    /** Whether the `/` at `$at` sits where an expression can start. */
    private static function opensRegex(string $masked, int $at): bool
    {
        $before = rtrim(substr($masked, max(0, $at - 64), min($at, 64)));
        if ($before === '') {
            return true;
        }

        return str_contains(self::BEFORE_REGEX, $before[-1])
            || preg_match('/(?<![\w$.])(?:return|typeof|case)$/', $before) === 1;
    }

    /** The offset of the `/` closing the regex at `$open`, or null if its line ends first. */
    private static function closingSlash(string $source, int $open, int $length): ?int
    {
        $inClass = false;

        for ($i = $open + 1; $i < $length; $i++) {
            $char = $source[$i];
            if ($char === '\\') {
                $i++;
            } elseif ($char === "\n") {
                return null;
            } elseif ($char === '[') {
                $inClass = true;
            } elseif ($char === ']') {
                $inClass = false;
            } elseif ($char === '/' && ! $inClass) {
                return $i;
            }
        }

        return null;
    }

    /**
     * Walk template text from `$from` to whatever ends it.
     *
     * @return array{from: int, to: int, next: int, opensExpression: bool}
     */
    private static function endOfTemplateText(string $source, int $from, int $length, string $label): array
    {
        for ($i = $from; $i < $length; $i++) {
            $char = $source[$i];
            if ($char === '\\') {
                $i++;
            } elseif ($char === '`') {
                return ['from' => $from, 'to' => $i, 'next' => $i + 1, 'opensExpression' => false];
            } elseif ($char === '$' && ($source[$i + 1] ?? '') === '{') {
                return ['from' => $from, 'to' => $i, 'next' => $i + 2, 'opensExpression' => true];
            }
        }

        throw new RuntimeException("Could not scan {$label} for imports: it ends inside a template literal.");
    }
}

<?php

declare(strict_types=1);

namespace DarkSlide\Helpers;

/**
 * Minimal, zero-dependency syntax highlighter for code blocks. Recognises
 * a small set of languages and emits a list of `(text, kind)` tokens that
 * the writer maps onto colored `<a:r>` runs in PPTX.
 *
 * Kinds emitted: `plain`, `keyword`, `string`, `comment`, `number`,
 * `builtin`, `punctuation`. Unknown languages fall back to a single
 * `plain` token so the writer just renders the raw code.
 *
 * This is deliberately tiny. It's not a full lexer — it handles the
 * common 95% (line + block comments, single/double-quoted strings,
 * keywords, numbers) and gracefully degrades on weirder constructs.
 *
 * @phpstan-type Token array{text: string, kind: string}
 */
final class SyntaxHighlighter
{
    /**
     * @return list<array{text: string, kind: string}>
     */
    public static function tokenize(string $code, ?string $language): array
    {
        $lang = self::normalizeLanguage($language);
        $config = self::config($lang);
        if ($config === null) {
            return [['text' => $code, 'kind' => 'plain']];
        }

        $tokens = [];
        $offset = 0;
        $len = strlen($code);

        while ($offset < $len) {
            $bestKind = null;
            $bestLen = 0;
            $remainder = substr($code, $offset);

            foreach ($config['patterns'] as $kind => $pattern) {
                // Wrap the pattern in (?:...) so the leading ^ anchor binds
                // the whole alternation. Without this, `^a|b|c` only anchors
                // `a` and `b` / `c` can match anywhere in $remainder.
                if (preg_match('/^(?:' . $pattern . ')/s', $remainder, $m) === 1) {
                    $matchLen = strlen($m[0]);
                    if ($matchLen > $bestLen) {
                        $bestLen = $matchLen;
                        $bestKind = $kind;
                    }
                }
            }

            if ($bestKind === null || $bestLen === 0) {
                $tokens[] = ['text' => $code[$offset], 'kind' => 'plain'];
                $offset++;
                continue;
            }

            $text = substr($code, $offset, $bestLen);

            // Promote `word` to `keyword` or `builtin` based on the lang's lists.
            if ($bestKind === 'word') {
                if (in_array($text, $config['keywords'], true)) {
                    $bestKind = 'keyword';
                } elseif (in_array($text, $config['builtins'], true)) {
                    $bestKind = 'builtin';
                } else {
                    $bestKind = 'plain';
                }
            }

            $tokens[] = ['text' => $text, 'kind' => $bestKind];
            $offset += $bestLen;
        }

        return self::coalesce($tokens);
    }

    /**
     * Map a token kind to a hex color string, suitable for `<a:srgbClr val="..."/>`.
     * The palette is tuned for a dark background (the `code` element fills
     * itself with `#0F172A`).
     */
    public static function colorFor(string $kind): string
    {
        return match ($kind) {
            'keyword' => 'C084FC',     // violet-400
            'string' => '86EFAC',      // green-300
            'comment' => '64748B',     // slate-500
            'number' => 'FBBF24',      // amber-400
            'builtin' => '67E8F9',     // cyan-300
            'punctuation' => 'CBD5E1', // slate-300
            default => 'F8FAFC',       // slate-50
        };
    }

    /**
     * @return list<string>
     */
    public static function supportedLanguages(): array
    {
        return ['javascript', 'typescript', 'jsx', 'tsx', 'php', 'json', 'bash', 'shell', 'css', 'python', 'html', 'xml'];
    }

    private static function normalizeLanguage(?string $language): ?string
    {
        if ($language === null) {
            return null;
        }
        $lang = strtolower(trim($language));

        return match ($lang) {
            'js' => 'javascript',
            'ts' => 'typescript',
            'jsx', 'tsx' => 'typescript',
            'sh', 'shell', 'bash', 'zsh' => 'bash',
            'py' => 'python',
            'xml' => 'html',
            default => $lang,
        };
    }

    /**
     * @return array{patterns: array<string, string>, keywords: list<string>, builtins: list<string>}|null
     */
    private static function config(?string $lang): ?array
    {
        if ($lang === null) {
            return null;
        }

        $cLike = [
            'comment' => '\\/\\/[^\\n]*|\\/\\*.*?\\*\\/',
            'string' => '"(?:[^"\\\\]|\\\\.)*"|\'(?:[^\'\\\\]|\\\\.)*\'|`(?:[^`\\\\]|\\\\.)*`',
            'number' => '\\b\\d+(?:\\.\\d+)?\\b',
            'word' => '[A-Za-z_$][A-Za-z0-9_$]*',
            'punctuation' => '[{}\\[\\]();,]',
        ];

        return match ($lang) {
            'javascript', 'typescript' => [
                'patterns' => $cLike,
                'keywords' => ['const', 'let', 'var', 'function', 'return', 'if', 'else', 'for', 'while', 'do', 'switch', 'case', 'break', 'continue', 'new', 'class', 'extends', 'implements', 'interface', 'type', 'enum', 'import', 'export', 'from', 'as', 'default', 'async', 'await', 'try', 'catch', 'finally', 'throw', 'typeof', 'instanceof', 'in', 'of', 'this', 'super', 'null', 'undefined', 'true', 'false', 'void', 'never', 'any', 'unknown', 'string', 'number', 'boolean', 'object'],
                'builtins' => ['console', 'Math', 'JSON', 'Object', 'Array', 'String', 'Number', 'Boolean', 'Promise', 'Map', 'Set', 'Date', 'Error', 'document', 'window', 'globalThis', 'require', 'module', 'process'],
            ],
            'php' => [
                'patterns' => [
                    'comment' => '\\/\\/[^\\n]*|#[^\\n]*|\\/\\*.*?\\*\\/',
                    'string' => '"(?:[^"\\\\]|\\\\.)*"|\'(?:[^\'\\\\]|\\\\.)*\'',
                    'number' => '\\b\\d+(?:\\.\\d+)?\\b',
                    'word' => '\\$?[A-Za-z_][A-Za-z0-9_]*',
                    'punctuation' => '[{}\\[\\]();,]',
                ],
                'keywords' => ['abstract', 'and', 'array', 'as', 'break', 'callable', 'case', 'catch', 'class', 'clone', 'const', 'continue', 'declare', 'default', 'do', 'echo', 'else', 'elseif', 'empty', 'enddeclare', 'endfor', 'endforeach', 'endif', 'endswitch', 'endwhile', 'enum', 'extends', 'final', 'finally', 'fn', 'for', 'foreach', 'function', 'global', 'goto', 'if', 'implements', 'include', 'include_once', 'instanceof', 'insteadof', 'interface', 'isset', 'list', 'match', 'namespace', 'new', 'null', 'or', 'private', 'protected', 'public', 'readonly', 'require', 'require_once', 'return', 'static', 'switch', 'throw', 'trait', 'try', 'unset', 'use', 'var', 'while', 'xor', 'yield', 'true', 'false', 'self', 'parent', 'this'],
                'builtins' => ['__construct', '__toString', '__invoke', 'array_map', 'array_filter', 'array_reduce', 'array_keys', 'array_values', 'array_merge', 'count', 'strlen', 'str_replace', 'str_starts_with', 'str_ends_with', 'str_contains', 'substr', 'sprintf', 'printf', 'json_encode', 'json_decode'],
            ],
            'json' => [
                'patterns' => [
                    'string' => '"(?:[^"\\\\]|\\\\.)*"',
                    'number' => '-?\\d+(?:\\.\\d+)?(?:[eE][+-]?\\d+)?',
                    'word' => '[A-Za-z_][A-Za-z0-9_]*',
                    'punctuation' => '[{}\\[\\]:,]',
                ],
                'keywords' => ['true', 'false', 'null'],
                'builtins' => [],
            ],
            'bash' => [
                'patterns' => [
                    'comment' => '#[^\\n]*',
                    'string' => '"(?:[^"\\\\]|\\\\.)*"|\'(?:[^\'\\\\]|\\\\.)*\'',
                    'number' => '\\b\\d+\\b',
                    'word' => '[A-Za-z_][A-Za-z0-9_]*',
                    'punctuation' => '[{}\\[\\]();|&]',
                ],
                'keywords' => ['if', 'then', 'else', 'elif', 'fi', 'for', 'while', 'do', 'done', 'case', 'esac', 'in', 'function', 'return', 'break', 'continue', 'export', 'local', 'readonly', 'unset'],
                'builtins' => ['echo', 'printf', 'cd', 'pwd', 'ls', 'cp', 'mv', 'rm', 'mkdir', 'touch', 'cat', 'grep', 'sed', 'awk', 'curl', 'wget', 'git', 'npm', 'composer', 'php', 'node'],
            ],
            'css' => [
                'patterns' => [
                    'comment' => '\\/\\*.*?\\*\\/',
                    'string' => '"(?:[^"\\\\]|\\\\.)*"|\'(?:[^\'\\\\]|\\\\.)*\'',
                    'number' => '-?\\d+(?:\\.\\d+)?(?:px|em|rem|%|vw|vh|deg)?',
                    'word' => '[\\-A-Za-z_][\\-A-Za-z0-9_]*',
                    'punctuation' => '[{};:,]',
                ],
                'keywords' => ['important', 'inherit', 'initial', 'unset', 'auto', 'none'],
                'builtins' => [],
            ],
            'python' => [
                'patterns' => [
                    'comment' => '#[^\\n]*',
                    'string' => '"""[\\s\\S]*?"""|\'\'\'[\\s\\S]*?\'\'\'|"(?:[^"\\\\]|\\\\.)*"|\'(?:[^\'\\\\]|\\\\.)*\'',
                    'number' => '\\b\\d+(?:\\.\\d+)?\\b',
                    'word' => '[A-Za-z_][A-Za-z0-9_]*',
                    'punctuation' => '[{}\\[\\]():,]',
                ],
                'keywords' => ['and', 'as', 'assert', 'async', 'await', 'break', 'class', 'continue', 'def', 'del', 'elif', 'else', 'except', 'finally', 'for', 'from', 'global', 'if', 'import', 'in', 'is', 'lambda', 'nonlocal', 'not', 'or', 'pass', 'raise', 'return', 'try', 'while', 'with', 'yield', 'True', 'False', 'None'],
                'builtins' => ['print', 'len', 'range', 'list', 'dict', 'set', 'tuple', 'str', 'int', 'float', 'bool', 'open', 'input', 'enumerate', 'zip', 'map', 'filter', 'sorted', 'reversed', 'sum', 'min', 'max', 'abs', 'round'],
            ],
            'html' => [
                'patterns' => [
                    'comment' => '<!--.*?-->',
                    'string' => '"(?:[^"\\\\]|\\\\.)*"|\'(?:[^\'\\\\]|\\\\.)*\'',
                    'keyword' => '<\\/?[A-Za-z][A-Za-z0-9-]*',
                    'punctuation' => '>|\\/>|=',
                ],
                'keywords' => [],
                'builtins' => [],
            ],
            default => null,
        };
    }

    /**
     * Collapse adjacent same-kind tokens. The single-char fallback emits
     * one plain token per unmatched byte; without coalescing the writer
     * would create dozens of single-char `<a:r>` runs.
     *
     * @param  list<array{text: string, kind: string}>  $tokens
     * @return list<array{text: string, kind: string}>
     */
    private static function coalesce(array $tokens): array
    {
        $out = [];
        foreach ($tokens as $t) {
            if (!empty($out) && end($out)['kind'] === $t['kind']) {
                $last = array_key_last($out);
                $out[$last]['text'] .= $t['text'];
                continue;
            }
            $out[] = $t;
        }

        return $out;
    }
}

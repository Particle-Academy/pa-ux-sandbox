<?php

declare(strict_types=1);

namespace DarkSlide\Helpers;

/**
 * Color parsing helpers. PPTX wants colors as 6-digit uppercase hex
 * (no `#` prefix); inputs may arrive as `#rgb`, `#rrggbb`, `rgb(r, g, b)`,
 * `rgba(r, g, b, a)`, or named colors.
 *
 * Returns `[hex, alpha]` where hex is `RRGGBB` and alpha is 0..100000
 * (PPTX percentage units, 100% = 100000). Default fallback color is
 * black with full opacity.
 */
final class Color
{
    /**
     * @return array{0: string, 1: int} [hex, alphaPctEmu]
     */
    public static function parse(?string $color, string $fallbackHex = '000000'): array
    {
        if ($color === null || $color === '') {
            return [$fallbackHex, 100000];
        }
        $color = trim($color);

        if ($color === 'transparent' || $color === 'none') {
            return [$fallbackHex, 0];
        }

        if (preg_match('/^#([0-9a-fA-F]{3})$/', $color, $m)) {
            $h = $m[1];
            $hex = strtoupper(str_repeat($h[0], 2) . str_repeat($h[1], 2) . str_repeat($h[2], 2));

            return [$hex, 100000];
        }
        if (preg_match('/^#([0-9a-fA-F]{6})$/', $color, $m)) {
            return [strtoupper($m[1]), 100000];
        }
        if (preg_match('/^#([0-9a-fA-F]{8})$/', $color, $m)) {
            $hex = strtoupper(substr($m[1], 0, 6));
            $a = hexdec(substr($m[1], 6, 2));

            return [$hex, (int) round($a / 255 * 100000)];
        }

        if (preg_match('/^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*([0-9.]+)\s*)?\)$/i', $color, $m)) {
            $r = (int) $m[1];
            $g = (int) $m[2];
            $b = (int) $m[3];
            $a = isset($m[4]) ? (float) $m[4] : 1.0;
            $hex = strtoupper(sprintf('%02X%02X%02X', $r, $g, $b));

            return [$hex, (int) round($a * 100000)];
        }

        $named = self::namedColors();
        $lower = strtolower($color);
        if (isset($named[$lower])) {
            return [$named[$lower], 100000];
        }

        return [$fallbackHex, 100000];
    }

    /**
     * Subset of CSS named colors we recognise. The common ones are enough
     * — the rest fall back to the supplied default in {@see parse()}.
     *
     * @return array<string, string>
     */
    private static function namedColors(): array
    {
        return [
            'black' => '000000',
            'white' => 'FFFFFF',
            'red' => 'FF0000',
            'green' => '008000',
            'blue' => '0000FF',
            'yellow' => 'FFFF00',
            'cyan' => '00FFFF',
            'magenta' => 'FF00FF',
            'gray' => '808080',
            'grey' => '808080',
            'silver' => 'C0C0C0',
            'maroon' => '800000',
            'olive' => '808000',
            'lime' => '00FF00',
            'aqua' => '00FFFF',
            'teal' => '008080',
            'navy' => '000080',
            'fuchsia' => 'FF00FF',
            'purple' => '800080',
            'orange' => 'FFA500',
        ];
    }
}

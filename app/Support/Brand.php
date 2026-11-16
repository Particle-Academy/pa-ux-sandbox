<?php

namespace App\Support;

/**
 * The kit's display name and tagline: the ONE place they are typed.
 *
 * The kit was renamed from "Fancy UI" to "Fancy Dev Kit" on 2026-11-15 (owner:
 * "Fancy Dev Kit for SaaSy Agents"). The old name had been typed into hundreds
 * of strings across titles, OG cards, llms.txt and the MCP instructions.
 *
 * - PHP reads {@see self::NAME}. It is a constant rather than config so it can
 *   sit in constant expressions too (attributes, class constants).
 * - The client reads `__BRAND_NAME__` / `__BRAND_TAGLINE__`, which
 *   `vite.config.js` and `vitest.config.ts` extract from THIS file at build
 *   time and refuse to build without.
 * - `tests/Feature/BrandTest.php` fails if the old name reappears on a page.
 *
 * Display text only. Package names, the `fancy-ui` MCP server id, `fancy-cli`,
 * the npm scope, CSS/data-attribute prefixes and every URL keep their names,
 * and so does the "Powered by Fancy UI" badge wordmark, which customer sites
 * already embed and the pixel detector matches.
 */
final class Brand
{
    public const NAME = 'Fancy Dev Kit';

    public const TAGLINE = 'for SaaSy Agents';

    /** "Fancy Dev Kit for SaaSy Agents". */
    public static function full(): string
    {
        return self::NAME.' '.self::TAGLINE;
    }

    /**
     * Replace the `{brand}` placeholder, for text that must be a nowdoc
     * constant (the MCP instructions, generated READMEs) and so cannot
     * concatenate.
     */
    public static function fill(string $text): string
    {
        return strtr($text, ['{brand}' => self::NAME, '{brandTagline}' => self::TAGLINE]);
    }
}

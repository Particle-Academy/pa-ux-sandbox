<?php

declare(strict_types=1);

namespace App\Support;

use App\Models\Setting;

/**
 * Resolves the showcase's OWN heuristics identity — the `site_key` and collect
 * `endpoint` it dogfoods itself with — by reading the admin-pasted Fancy Pixel
 * tracker snippet (Admin → Settings). The snippet is the canonical source:
 *
 *   <script src=".../fancy-pixel.global.min.js"
 *           data-site="KEY" data-endpoint="https://host/heuristics" ...></script>
 *
 * Used to attribute agent activity (relay tool calls server-side, and the
 * in-browser agent sink) to the same site humans are tracked under, so the
 * dashboard's agent dimension actually fills.
 */
class SelfSite
{
    public static function key(): ?string
    {
        return self::fromTracker('site');
    }

    public static function endpoint(): string
    {
        return self::fromTracker('endpoint') ?? '/heuristics';
    }

    /** Pull a `data-{attr}="..."` value out of the pasted tracker snippet. */
    private static function fromTracker(string $attr): ?string
    {
        $code = (string) Setting::get('tracker_code', '');
        if ($code === '') {
            return null;
        }
        if (preg_match('/data-'.preg_quote($attr, '/').'="([^"]+)"/', $code, $m)) {
            return $m[1];
        }

        return null;
    }
}

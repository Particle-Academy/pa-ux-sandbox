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

    /**
     * The pasted tracker as Fancy Pixel mount options, or null when it is not
     * a Fancy Pixel snippet (or nothing is pasted).
     *
     * When it is one, the client mounts the pixel itself through the npm
     * package's `mountPixel`, and only once `analytics` consent is given, so a
     * withdrawal can call the handle's `destroy()` and genuinely stop the
     * collector. The raw tag is then NOT printed: a tag in the HTML runs before
     * anyone has been asked, and nothing can stop it afterwards.
     *
     * @return array{siteKey: string, endpoint: string, style: ?string, mode: ?string, collect: bool, href: ?string}|null
     */
    public static function pixel(): ?array
    {
        $code = (string) Setting::get('tracker_code', '');
        if (preg_match('/<script\b[^>]*\bsrc\s*=\s*["\'][^"\']*fancy-pixel[^"\']*["\']/i', $code) !== 1) {
            return null;
        }

        $key = self::key();
        if ($key === null) {
            return null;
        }

        return [
            'siteKey' => $key,
            'endpoint' => self::endpoint(),
            'style' => self::fromTracker('style'),
            'mode' => self::fromTracker('mode'),
            'collect' => self::fromTracker('collect') !== 'false',
            'href' => self::fromTracker('href'),
        ];
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

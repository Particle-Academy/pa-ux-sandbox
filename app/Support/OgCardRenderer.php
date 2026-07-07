<?php

namespace App\Support;

use GdImage;
use RuntimeException;

/**
 * Draws the branded 1200×630 Open Graph card as a PNG with GD — no headless
 * Chrome. Browsershot rendering silently fell back to the square brand JPEG on
 * hosts without Chrome (production!), which is exactly why LinkedIn rendered
 * the small square card: the declared og:image:width/height said 1200×630 but
 * the bytes were a square logo. GD ships with PHP everywhere, so this renderer
 * produces the real card on every host, CI included.
 *
 * Visual layout mirrors the old resources/views/og/card.blade.php: dark canvas,
 * purple + cyan radial glows, optional eyebrow, big title, muted subtitle, and
 * a brand footer (logo mark · Fancy UI · Human+ UX · site host).
 */
class OgCardRenderer
{
    public const WIDTH = 1200;

    public const HEIGHT = 630;

    /** Bump to invalidate cached cards when the design changes. */
    public const VERSION = 1;

    private const PAD_X = 80;

    private const PAD_Y = 72;

    /**
     * @param array{
     *     eyebrow?: ?string,
     *     title: string,
     *     subtitle?: ?string,
     *     avatar?: ?string,
     * } $spec `avatar` is raw image bytes (jpeg/png/gif/webp), drawn as a circle.
     * @return string PNG bytes
     */
    public function render(array $spec): string
    {
        if (! function_exists('imagecreatetruecolor') || ! function_exists('imagettftext')) {
            throw new RuntimeException('GD with FreeType support is required to render OG cards.');
        }

        $img = imagecreatetruecolor(self::WIDTH, self::HEIGHT);
        imagefill($img, 0, 0, imagecolorallocate($img, 10, 10, 11)); // #0a0a0b

        // Radial glows (top-right purple, bottom-left cyan), as in the CSS card.
        $this->glow($img, 936, -63, 560, 350, [139, 92, 246], 0.30);
        $this->glow($img, -60, 693, 440, 320, [56, 189, 248], 0.18);

        $title = imagecolorallocate($img, 250, 250, 250);   // #fafafa
        $muted = imagecolorallocate($img, 161, 161, 170);   // #a1a1aa
        $faint = imagecolorallocate($img, 113, 113, 122);   // #71717a
        $violet = imagecolorallocate($img, 139, 92, 246);   // #8b5cf6
        $lilac = imagecolorallocate($img, 196, 181, 253);   // #c4b5fd

        $y = self::PAD_Y;

        // ── Eyebrow ─────────────────────────────────────────────────────────
        $eyebrow = trim((string) ($spec['eyebrow'] ?? ''));
        if ($eyebrow !== '') {
            $dotY = $y + 14;
            imagefilledellipse($img, self::PAD_X + 7, $dotY, 22, 22, imagecolorallocatealpha($img, 139, 92, 246, 99));
            imagefilledellipse($img, self::PAD_X + 7, $dotY, 13, 13, $violet);
            $this->tracked($img, 22, self::PAD_X + 28, $y + 22, $lilac, $this->font('semibold'), strtoupper($eyebrow), 2.0);
            $y += 56;
        }

        // ── Avatar (referral-invite cards) ──────────────────────────────────
        // The avatar variant carries more rows, so the title + subtitle scale
        // down and clamp harder to keep clear of the footer.
        $hasAvatar = ! empty($spec['avatar']);
        if ($hasAvatar) {
            $this->stamp($img, (string) $spec['avatar'], self::PAD_X, $y, 88, null);
            imageellipse($img, self::PAD_X + 44, $y + 44, 90, 90, imagecolorallocatealpha($img, 139, 92, 246, 40));
            $y += 88 + 24;
        } else {
            $y += 16;
        }

        // ── Title (shrink-to-fit, max 2 lines) ──────────────────────────────
        $maxWidth = self::WIDTH - self::PAD_X * 2;
        [$titleLines, $titleSize] = $this->fit((string) $spec['title'], $this->font('bold'), $hasAvatar ? 60 : 78, 44, $maxWidth, 2);
        foreach ($titleLines as $line) {
            $y += (int) round($titleSize * 1.22);
            imagettftext($img, $this->pt($titleSize), 0, self::PAD_X, $y, $title, $this->font('bold'), $line);
        }

        // ── Subtitle ────────────────────────────────────────────────────────
        $subtitle = trim((string) ($spec['subtitle'] ?? ''));
        if ($subtitle !== '') {
            $y += $hasAvatar ? 22 : 26;
            [$subLines] = $this->fit($subtitle, $this->font('regular'), 31, 31, $maxWidth - 100, $hasAvatar ? 2 : 3);
            foreach ($subLines as $line) {
                $y += 44;
                imagettftext($img, $this->pt(31), 0, self::PAD_X, $y, $muted, $this->font('regular'), $line);
            }
        }

        // ── Footer ──────────────────────────────────────────────────────────
        $footerMid = self::HEIGHT - self::PAD_Y - 26 + 12;
        $x = self::PAD_X;
        $logo = $this->logoBytes();
        if ($logo !== null) {
            $this->stamp($img, $logo, $x, $footerMid - 26, 52, 13);
            $x += 52 + 18;
        }
        $baseline = $footerMid + 11;
        imagettftext($img, $this->pt(30), 0, $x, $baseline, $title, $this->font('bold'), 'Fancy UI');
        $x += $this->width('Fancy UI', $this->font('bold'), 30) + 16;
        imagettftext($img, $this->pt(24), 0, $x, $baseline - 2, $faint, $this->font('regular'), '· Human+ UX');

        $host = $this->host();
        $hostW = $this->width($host, $this->font('mono'), 24);
        imagettftext($img, $this->pt(24), 0, self::WIDTH - self::PAD_X - $hostW, $baseline - 2, $violet, $this->font('mono'), $host);

        ob_start();
        imagepng($img);

        return (string) ob_get_clean();
    }

    /** The display host in the footer, from the canonical site URL. */
    private function host(): string
    {
        $url = (string) (config('fancy-seo.url') ?: config('app.url'));

        return (string) (parse_url($url, PHP_URL_HOST) ?: 'ui.particle.academy');
    }

    private function logoBytes(): ?string
    {
        $file = public_path('showcase-assets/fancy-ui-logo.jpg');

        return is_file($file) ? (string) file_get_contents($file) : null;
    }

    private function font(string $weight): string
    {
        return resource_path(match ($weight) {
            'bold' => 'fonts/Geist-Bold.ttf',
            'semibold' => 'fonts/Geist-SemiBold.ttf',
            'mono' => 'fonts/GeistMono-Regular.ttf',
            default => 'fonts/Geist-Regular.ttf',
        });
    }

    /** GD's size parameter is in points; the layout thinks in CSS px. */
    private function pt(float $px): float
    {
        return $px * 0.75;
    }

    private function width(string $text, string $font, float $px): int
    {
        $box = imagettfbbox($this->pt($px), 0, $font, $text);

        return (int) (max($box[2], $box[4]) - min($box[0], $box[6]));
    }

    /**
     * Wrap + shrink text until it fits `$maxLines` at ≥ `$minPx`; the last line
     * gets an ellipsis when it still overflows.
     *
     * @return array{0: list<string>, 1: int} [lines, chosen size px]
     */
    private function fit(string $text, string $font, int $maxPx, int $minPx, int $maxWidth, int $maxLines): array
    {
        $text = trim(preg_replace('/\s+/u', ' ', $text) ?? '');
        for ($size = $maxPx; $size >= $minPx; $size -= 4) {
            $lines = $this->wrap($text, $font, $size, $maxWidth);
            if (count($lines) <= $maxLines) {
                return [$lines, $size];
            }
        }

        $lines = array_slice($this->wrap($text, $font, $minPx, $maxWidth), 0, $maxLines);
        $last = rtrim((string) array_pop($lines), " \t.,;:");
        while ($last !== '' && $this->width($last.'…', $font, $minPx) > $maxWidth) {
            $last = rtrim(mb_substr($last, 0, -1));
        }
        $lines[] = $last.'…';

        return [$lines, $minPx];
    }

    /** @return list<string> */
    private function wrap(string $text, string $font, int $px, int $maxWidth): array
    {
        $lines = [];
        $line = '';
        foreach (explode(' ', $text) as $word) {
            $probe = $line === '' ? $word : "{$line} {$word}";
            if ($line !== '' && $this->width($probe, $font, $px) > $maxWidth) {
                $lines[] = $line;
                $line = $word;

                continue;
            }
            $line = $probe;
        }
        if ($line !== '') {
            $lines[] = $line;
        }

        return $lines;
    }

    /** Letter-spaced text (GD has no tracking) — used by the uppercase eyebrow. */
    private function tracked(GdImage $img, float $px, int $x, int $y, int $color, string $font, string $text, float $tracking): void
    {
        foreach (mb_str_split($text) as $char) {
            imagettftext($img, $this->pt($px), 0, (int) round($x), $y, $color, $font, $char);
            $x += $this->width($char, $font, $px) + $tracking + 1;
        }
    }

    /**
     * Fake a CSS radial-gradient: stacked concentric ellipses of a barely-opaque
     * color. With per-layer opacity 1/127 (GD's finest step), `n` layers reach
     * `1-(1-1/127)^n` at the center — solve n for the target opacity.
     */
    private function glow(GdImage $img, int $cx, int $cy, int $rx, int $ry, array $rgb, float $opacity): void
    {
        $layers = max(1, (int) round(log(1 - $opacity) / log(1 - 1 / 127)));
        $color = imagecolorallocatealpha($img, $rgb[0], $rgb[1], $rgb[2], 126);
        for ($i = $layers; $i >= 1; $i--) {
            $t = $i / $layers;
            imagefilledellipse($img, $cx, $cy, (int) ($rx * 2 * $t), (int) ($ry * 2 * $t), $color);
        }
    }

    /**
     * Composite an image (logo / avatar) with rounded corners. Crops at 4×
     * resolution on an alpha canvas, then downsamples so the curved edge lands
     * anti-aliased; `$radius` null means a full circle.
     */
    private function stamp(GdImage $card, string $bytes, int $x, int $y, int $size, ?int $radius): void
    {
        $src = @imagecreatefromstring($bytes);
        if ($src === false) {
            return;
        }

        $big = $size * 4;
        $r = ($radius ?? intdiv($size, 2)) * 4;
        $mask = imagecreatetruecolor($big, $big);
        imagealphablending($mask, false);
        imagesavealpha($mask, true);
        imagecopyresampled($mask, $src, 0, 0, 0, 0, $big, $big, imagesx($src), imagesy($src));

        $clear = imagecolorallocatealpha($mask, 0, 0, 0, 127);
        for ($py = 0; $py < $big; $py++) {
            for ($px = 0; $px < $big; $px++) {
                $nx = min(max($px + 0.5, $r), $big - $r);
                $ny = min(max($py + 0.5, $r), $big - $r);
                if ((($px + 0.5 - $nx) ** 2 + ($py + 0.5 - $ny) ** 2) > $r * $r) {
                    imagesetpixel($mask, $px, $py, $clear);
                }
            }
        }

        $out = imagecreatetruecolor($size, $size);
        imagealphablending($out, false);
        imagesavealpha($out, true);
        imagecopyresampled($out, $mask, 0, 0, 0, 0, $size, $size, $big, $big);

        imagecopy($card, $out, $x, $y, 0, 0, $size, $size);

        imagedestroy($src);
        imagedestroy($mask);
        imagedestroy($out);
    }
}

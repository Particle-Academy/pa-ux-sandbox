<?php

namespace App\Services\Heuristics;

use App\Models\SitePageShot;
use App\Services\Showcase\SafeUrlFetcher;
use Illuminate\Support\Facades\Storage;
use Spatie\Browsershot\Browsershot;

/**
 * Captures a server-side screenshot of a page and stores it on the public disk
 * as the focus-heatmap background. Best-effort: every failure returns null so a
 * capture problem can never break verification or the dashboard.
 *
 * The SSRF guard (SafeUrlFetcher) is applied to UNTRUSTED (externally submitted)
 * URLs only — the app's own host is trusted, so the dogfood showcase (which
 * resolves to loopback in local dev) can still be captured.
 */
class PageScreenshotService
{
    public function __construct(private SafeUrlFetcher $fetcher) {}

    public function capture(string $url, string $siteKey, string $path): ?SitePageShot
    {
        if (! config('screenshots.enabled', true)) {
            return null;
        }

        if (! $this->isOwnHost($url)) {
            try {
                $this->fetcher->assertSafe($url);
            } catch (\Throwable $e) {
                return null;
            }
        }

        $width = (int) config('screenshots.width', 1440);
        $height = (int) config('screenshots.height', 900);

        try {
            $png = $this->render($url, $width, $height);
        } catch (\Throwable $e) {
            report($e);

            return null;
        }

        $relPath = sprintf('heatmaps/%s/%s.png', $this->safeKey($siteKey), sha1($path));
        Storage::disk('public')->put($relPath, $png);

        return SitePageShot::updateOrCreate(
            ['site_key' => $siteKey, 'path' => $path],
            ['image_path' => $relPath, 'vw' => $width, 'vh' => $height, 'captured_at' => now()],
        );
    }

    /**
     * Render the page to PNG bytes via Browsershot. Split out so tests can fake
     * it without a headless Chrome.
     */
    protected function render(string $url, int $width, int $height): string
    {
        $shot = Browsershot::url($url)
            ->setScreenshotType('png')
            ->windowSize($width, $height)
            ->deviceScaleFactor(1)
            ->ignoreHttpsErrors()
            ->waitUntilNetworkIdle()
            ->timeout((int) config('screenshots.timeout', 60));

        if ($node = config('screenshots.node_binary')) {
            $shot->setNodeBinary($node);
        }
        if ($npm = config('screenshots.npm_binary')) {
            $shot->setNpmBinary($npm);
        }
        if ($chrome = config('screenshots.chrome_path')) {
            $shot->setChromePath($chrome);
        }
        if (config('screenshots.no_sandbox', false)) {
            $shot->noSandbox();
        }

        return $shot->screenshot();
    }

    /**
     * Is this URL on the app's own host? Such URLs are trusted (no SSRF guard)
     * so the dogfood site — loopback in local dev — can be captured.
     */
    private function isOwnHost(string $url): bool
    {
        $own = parse_url((string) config('app.url'), PHP_URL_HOST);
        $host = parse_url($url, PHP_URL_HOST);

        return $own !== null && $host !== null && strcasecmp($own, $host) === 0;
    }

    private function safeKey(string $siteKey): string
    {
        return preg_replace('/[^a-z0-9_-]/i', '', $siteKey) ?: 'site';
    }
}

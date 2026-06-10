<?php

namespace App\Services\Heuristics;

use App\Models\SitePageShot;
use App\Services\Showcase\SafeUrlFetcher;
use FancyHeuristics\Models\HeuristicsEvent;
use Illuminate\Support\Facades\Http;
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
    /** Paths that must never be screenshotted — they require auth and would just
     *  capture a login redirect. LIKE-prefixed groups + exact matches. */
    private const PRIVATE_PREFIXES = ['/admin', '/auth'];

    private const PRIVATE_EXACT = ['/login', '/logout', '/profile', '/dev-login'];

    public function __construct(private SafeUrlFetcher $fetcher) {}

    /**
     * The site's busiest PUBLIC path (most pointer/click events) for the focus
     * heatmap + screenshot — excluding admin/auth routes, which an unauthenticated
     * headless renderer would only capture as a login page. Falls back to the
     * registered URL's path (its homepage).
     */
    public function busiestPublicPath(string $siteKey, string $registeredUrl): string
    {
        $query = HeuristicsEvent::query()
            ->where('site_key', $siteKey)
            ->whereIn('kind', ['pointer', 'click'])
            ->whereNotIn('path', self::PRIVATE_EXACT);

        foreach (self::PRIVATE_PREFIXES as $prefix) {
            $query->where('path', 'not like', $prefix.'%');
        }

        $busiest = $query->selectRaw('path, COUNT(*) as hits')
            ->groupBy('path')
            ->orderByDesc('hits')
            ->value('path');

        return $busiest ?: (parse_url($registeredUrl, PHP_URL_PATH) ?: '/');
    }

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
     * Render the page to PNG bytes. Split out (and kept as the single seam) so
     * tests can fake it without a real renderer. Dispatches to the configured
     * driver: `browsershot` (local headless Chrome) or `cloudflare` (the Browser
     * Rendering REST API — no browser/Chromium on this server).
     */
    protected function render(string $url, int $width, int $height): string
    {
        return match (config('screenshots.driver', 'browsershot')) {
            'cloudflare' => $this->renderWithCloudflare($url, $width, $height),
            default => $this->renderWithBrowsershot($url, $width, $height),
        };
    }

    /** Local headless Chrome via spatie/browsershot. */
    protected function renderWithBrowsershot(string $url, int $width, int $height): string
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
     * Cloudflare Browser Rendering — renders the URL on Cloudflare's edge and
     * returns the PNG, so no browser/Chromium is needed on this server. The
     * snapshot endpoint returns the screenshot base64-encoded inside JSON.
     */
    protected function renderWithCloudflare(string $url, int $width, int $height): string
    {
        $account = (string) config('screenshots.cloudflare.account_id');
        $token = (string) config('screenshots.cloudflare.token');
        if ($account === '' || $token === '') {
            throw new \RuntimeException('Cloudflare screenshot driver needs CF_BROWSER_ACCOUNT_ID + CF_BROWSER_TOKEN.');
        }

        $timeout = (int) config('screenshots.timeout', 60);
        $response = Http::withToken($token)
            ->acceptJson()
            ->timeout($timeout + 15)
            ->post("https://api.cloudflare.com/client/v4/accounts/{$account}/browser-rendering/snapshot", [
                'url' => $url,
                'viewport' => ['width' => $width, 'height' => $height, 'deviceScaleFactor' => 1],
                'screenshotOptions' => ['fullPage' => false],
                'gotoOptions' => ['waitUntil' => 'networkidle0', 'timeout' => $timeout * 1000],
            ])
            ->throw();

        $base64 = (string) data_get($response->json(), 'result.screenshot', '');
        $png = $base64 !== '' ? base64_decode($base64, true) : false;
        if ($png === false || $png === '') {
            throw new \RuntimeException('Cloudflare snapshot returned no screenshot.');
        }

        return $png;
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

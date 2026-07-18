<?php

namespace App\Services\Heuristics;

use App\Models\SitePageShot;
use App\Services\Showcase\SafeUrlFetcher;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Storage;
use ParticleAcademy\XFiles\Laravel\HonorsRobots;
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
    /** User-agent we present to robots.txt (and identify as when rendering). */
    public const USER_AGENT = 'FancyUiScreenshotBot';

    public function __construct(private SafeUrlFetcher $fetcher) {}

    /**
     * Honor the target host's robots.txt for our user-agent via fancy-x-files'
     * shared, default-open robots evaluator (HonorsRobots / RobotsPolicy) — the
     * same honest precedence the site's own robots.txt is built with. Fetched
     * once per capture; unreachable / non-200 / unparseable → allowed so a
     * quirky robots file never silently kills a legitimate capture. Our own
     * robots.txt protects /admin, /auth, /login, … so the scraper can never
     * shoot the dashboard, and submitters' rules are respected too.
     */
    private function allowedByRobots(string $url): bool
    {
        $origin = preg_replace('#^(https?://[^/]+).*#i', '$1', $url);
        if ($origin === null || $origin === '') {
            return true;
        }
        $path = parse_url($url, PHP_URL_PATH) ?: '/';

        try {
            $res = Http::timeout((int) config('screenshots.robots_timeout', 8))
                ->withHeaders(['User-Agent' => self::USER_AGENT])
                ->get(rtrim($origin, '/').'/robots.txt');
        } catch (\Throwable $e) {
            return true;
        }

        if (! $res->ok()) {
            return true;
        }

        return HonorsRobots::allows($res->body(), $path, self::USER_AGENT);
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

            // assertSafe only vets the top-level URL. A local headless-Chrome
            // render then follows redirects / subresources / iframes to ANY
            // host with no re-validation — so an externally-submitted page can
            // pull 127.0.0.1 / 169.254.169.254 / internal services into a PNG
            // that is served publicly (SSRF → exfil). Only render an untrusted
            // URL on the off-box renderer, which has no route to our internal
            // network. Own-host URLs are trusted and render on any driver.
            if (! $this->rendererIsOffBox()) {
                return null;
            }
        }

        // Be a polite scraper: never capture a page the site's robots.txt blocks
        // for us. Our own robots.txt disallows /admin, /auth, /login, … so we can
        // never screenshot the dashboard, and external sites' rules are honored.
        if (! $this->allowedByRobots($url)) {
            return null;
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
     * True when the configured renderer runs off this server's network
     * (Cloudflare Browser Rendering), so it cannot reach our internal services
     * or cloud metadata even if a page redirects there.
     */
    private function rendererIsOffBox(): bool
    {
        return config('screenshots.driver', 'browsershot') === 'cloudflare';
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

<?php

namespace App\Listeners;

use App\Jobs\CaptureSiteScreenshot;
use App\Models\ShowcaseSubmission;
use App\Services\Heuristics\PageScreenshotService;
use FancyHeuristics\Events\PixelVerificationPassed;

/**
 * On every successful pixel verification (twice-daily poll + on-demand), queue a
 * fresh screenshot of the site's busiest PUBLIC path so the focus heatmap always
 * draws on a current image of the real page. Falls back to the registered URL's
 * path. Admin/auth routes are excluded — they'd just capture a login redirect.
 */
class CaptureScreenshotOnVerified
{
    public function __construct(private PageScreenshotService $shots) {}

    public function handle(PixelVerificationPassed $event): void
    {
        $site = $event->site;

        // Respect moderation — NSFW + children's sites never get a screenshot.
        $submission = ShowcaseSubmission::query()->where('site_key', $site->site_key)->first();
        if ($submission && ! $submission->shouldCaptureScreenshot()) {
            return;
        }

        $path = $this->shots->busiestPublicPath($site->site_key, $site->url);

        CaptureSiteScreenshot::dispatch($this->urlForPath($site->url, $path), $site->site_key, $path);
    }

    /**
     * Combine the registered site's origin with the target path.
     */
    private function urlForPath(string $registeredUrl, string $path): string
    {
        $origin = preg_replace('#^(https?://[^/]+).*#i', '$1', $registeredUrl);

        return rtrim((string) $origin, '/').'/'.ltrim($path, '/');
    }
}

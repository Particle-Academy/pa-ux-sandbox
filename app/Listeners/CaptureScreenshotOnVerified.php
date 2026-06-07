<?php

namespace App\Listeners;

use App\Jobs\CaptureSiteScreenshot;
use FancyHeuristics\Events\PixelVerificationPassed;
use FancyHeuristics\Models\HeuristicsEvent;

/**
 * On every successful pixel verification (twice-daily poll + on-demand), queue a
 * fresh screenshot of the site's busiest path so the focus heatmap always draws
 * on a current image of the real page. Falls back to the registered URL's path.
 */
class CaptureScreenshotOnVerified
{
    public function handle(PixelVerificationPassed $event): void
    {
        $site = $event->site;

        $busiest = HeuristicsEvent::query()
            ->where('site_key', $site->site_key)
            ->whereIn('kind', ['pointer', 'click'])
            ->selectRaw('path, COUNT(*) as hits')
            ->groupBy('path')
            ->orderByDesc('hits')
            ->value('path');

        $path = $busiest ?: (parse_url($site->url, PHP_URL_PATH) ?: '/');

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

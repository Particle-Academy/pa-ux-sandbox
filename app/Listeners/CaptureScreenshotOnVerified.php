<?php

namespace App\Listeners;

use App\Jobs\CaptureSiteScreenshot;
use App\Models\ShowcaseSubmission;
use FancyHeuristics\Events\PixelVerificationPassed;

/**
 * On every successful pixel verification (twice-daily poll + on-demand), queue a
 * fresh screenshot of the site's own registered URL — its homepage, never an
 * internal path — so the focus heatmap always draws on a current image of the
 * real landing page. The screenshot service additionally honors robots.txt.
 */
class CaptureScreenshotOnVerified
{
    public function handle(PixelVerificationPassed $event): void
    {
        $site = $event->site;

        // Respect moderation — NSFW + children's sites never get a screenshot.
        $submission = ShowcaseSubmission::query()->where('site_key', $site->site_key)->first();
        if ($submission && ! $submission->shouldCaptureScreenshot()) {
            return;
        }

        $path = parse_url($site->url, PHP_URL_PATH) ?: '/';

        CaptureSiteScreenshot::dispatch($site->url, $site->site_key, $path);
    }
}

<?php

namespace App\Jobs;

use App\Services\Heuristics\PageScreenshotService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

/**
 * Queued screenshot capture for one page (site_key + path). Dispatched by the
 * verification poll (CaptureScreenshotOnVerified) and the submission scan, so it
 * never blocks verification itself.
 */
class CaptureSiteScreenshot implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function __construct(
        public string $url,
        public string $siteKey,
        public string $path,
    ) {}

    public function handle(PageScreenshotService $shots): void
    {
        $shots->capture($this->url, $this->siteKey, $this->path);
    }
}

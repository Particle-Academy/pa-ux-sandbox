<?php

use App\Jobs\CaptureSiteScreenshot;
use App\Models\SitePageShot;
use App\Services\Heuristics\HeuristicsReport;
use App\Services\Heuristics\PageScreenshotService;
use App\Services\Showcase\SafeUrlFetcher;
use FancyHeuristics\Events\PixelVerificationPassed;
use FancyHeuristics\Models\HeuristicsEvent;
use FancyHeuristics\Models\HeuristicsSite;
use Illuminate\Support\Facades\Bus;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

uses(TestCase::class);

afterEach(function () {
    SafeUrlFetcher::resolveUsing(null);
});

it('is a no-op when screenshots are disabled', function () {
    config(['screenshots.enabled' => false]);

    expect(app(PageScreenshotService::class)->capture('https://example.test/', 'sk', '/'))
        ->toBeNull();
});

it('refuses to capture an SSRF-unsafe external URL', function () {
    config(['screenshots.enabled' => true, 'app.url' => 'https://showcase.test']);
    // Any external host resolves to a private IP → SafeUrlFetcher::assertSafe throws.
    SafeUrlFetcher::resolveUsing(fn (string $host): array => ['10.0.0.5']);

    expect(app(PageScreenshotService::class)->capture('https://evil.test/', 'sk', '/'))
        ->toBeNull();
});

it('captures, stores, and upserts a shot for a trusted (own-host) URL', function () {
    Storage::fake('public');
    config(['screenshots.enabled' => true, 'app.url' => 'https://showcase.test']);

    // Subclass overrides the protected render() seam so no headless Chrome runs.
    $svc = new class(app(SafeUrlFetcher::class)) extends PageScreenshotService
    {
        protected function render(string $url, int $width, int $height): string
        {
            return 'FAKE_PNG_BYTES';
        }
    };

    $shot = $svc->capture('https://showcase.test/pricing', 'fancy-ui-showcase', '/pricing');

    expect($shot)->not->toBeNull()
        ->and($shot->vw)->toBe(1440)
        ->and($shot->vh)->toBe(900);
    Storage::disk('public')->assertExists($shot->image_path);
    $this->assertDatabaseHas('site_page_shots', [
        'site_key' => 'fancy-ui-showcase',
        'path' => '/pricing',
    ]);
});

it('queues a screenshot of the busiest path on pixel verification', function () {
    Bus::fake();

    $site = HeuristicsSite::create(['site_key' => 'sk', 'url' => 'https://sk.test', 'visible' => true]);
    foreach ([['/', 1], ['/pricing', 5], ['/docs', 2]] as [$path, $n]) {
        for ($i = 0; $i < $n; $i++) {
            HeuristicsEvent::create([
                'site_key' => 'sk', 'kind' => 'click', 'path' => $path,
                'x' => 1, 'y' => 1, 'occurred_at' => now(),
            ]);
        }
    }

    event(new PixelVerificationPassed($site));

    Bus::assertDispatched(CaptureSiteScreenshot::class, function (CaptureSiteScreenshot $job) {
        return $job->siteKey === 'sk'
            && $job->path === '/pricing'
            && $job->url === 'https://sk.test/pricing';
    });
});

it('exposes a captured shot via HeuristicsReport::screenshotForPath', function () {
    SitePageShot::create([
        'site_key' => 'sk', 'path' => '/pricing',
        'image_path' => 'heatmaps/sk/abc.png', 'vw' => 1440, 'vh' => 900, 'captured_at' => now(),
    ]);

    $report = app(HeuristicsReport::class);
    $out = $report->screenshotForPath('sk', '/pricing');

    expect($out)->not->toBeNull()
        ->and($out['vw'])->toBe(1440)
        ->and($out['url'])->toContain('heatmaps/sk/abc.png');
    expect($report->screenshotForPath('sk', '/missing'))->toBeNull();
});

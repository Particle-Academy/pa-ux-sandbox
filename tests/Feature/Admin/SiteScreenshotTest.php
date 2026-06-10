<?php

use App\Models\Setting;
use App\Models\ShowcaseSubmission;
use App\Models\SitePageShot;
use App\Models\User;
use App\Services\Heuristics\PageScreenshotService;
use App\Services\Showcase\SafeUrlFetcher;
use Database\Seeders\FunLabSeeder;
use FancyHeuristics\Models\HeuristicsEvent;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

uses(TestCase::class);

beforeEach(function () {
    $this->seed(FunLabSeeder::class);
});

function screenshotAdmin(): User
{
    return User::factory()->create(['is_admin' => true]);
}

it('captures a screenshot synchronously from the recapture button', function () {
    Storage::fake('public');
    config(['screenshots.enabled' => true, 'app.url' => 'https://showcase.test']);

    $sub = ShowcaseSubmission::create([
        'user_id' => User::factory()->create()->id,
        'kind' => 'website',
        'url' => 'https://showcase.test',
        'title' => 'Showcase',
        'status' => 'verified',
    ]);

    // Override the render seam so no headless Chrome / Cloudflare call runs.
    $this->app->bind(PageScreenshotService::class, fn ($app) => new class($app->make(SafeUrlFetcher::class)) extends PageScreenshotService
    {
        protected function render(string $url, int $width, int $height): string
        {
            return 'FAKE_PNG';
        }
    });

    $this->actingAs(screenshotAdmin())
        ->post("/admin/sites/{$sub->id}/recapture")
        ->assertRedirect()
        ->assertSessionHas('success');

    $this->assertDatabaseHas('site_page_shots', ['site_key' => $sub->site_key]);
});

it('reports an error (not silence) when capture fails', function () {
    config(['screenshots.enabled' => true, 'app.url' => 'https://showcase.test']);

    $sub = ShowcaseSubmission::create([
        'user_id' => User::factory()->create()->id,
        'kind' => 'website',
        'url' => 'https://showcase.test',
        'title' => 'Showcase',
        'status' => 'verified',
    ]);

    // Render throws → capture() returns null → the action flashes an error.
    $this->app->bind(PageScreenshotService::class, fn ($app) => new class($app->make(SafeUrlFetcher::class)) extends PageScreenshotService
    {
        protected function render(string $url, int $width, int $height): string
        {
            throw new RuntimeException('driver down');
        }
    });

    $this->actingAs(screenshotAdmin())
        ->post("/admin/sites/{$sub->id}/recapture")
        ->assertRedirect()
        ->assertSessionHas('error');
});

it('exposes the latest screenshot on the site detail page', function () {
    $sub = ShowcaseSubmission::create([
        'user_id' => User::factory()->create()->id,
        'kind' => 'website',
        'url' => 'https://showcase.test',
        'title' => 'Showcase',
        'status' => 'verified',
    ]);
    SitePageShot::create([
        'site_key' => $sub->site_key,
        'path' => '/',
        'image_path' => 'heatmaps/x/y.png',
        'vw' => 1440, 'vh' => 900, 'captured_at' => now(),
    ]);

    $this->actingAs(screenshotAdmin())
        ->get("/admin/sites/{$sub->id}")
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('Admin/SiteShow')
            ->where('latestShot.path', '/')
            ->where('latestShot.url', '/storage/heatmaps/x/y.png')
        );
});

it('never targets admin/auth paths for a screenshot (would capture a login page)', function () {
    // /admin/sites has the most hits, but an unauthenticated renderer would only
    // get a login redirect there — so the public /pricing must win.
    foreach ([['/admin/sites', 9], ['/login', 6], ['/pricing', 3], ['/', 1]] as [$path, $hits]) {
        for ($i = 0; $i < $hits; $i++) {
            HeuristicsEvent::create(['site_key' => 'sk', 'kind' => 'click', 'path' => $path, 'x' => 1, 'y' => 1, 'occurred_at' => now()]);
        }
    }

    expect(app(PageScreenshotService::class)->busiestPublicPath('sk', 'https://sk.test'))->toBe('/pricing');
});

it('falls back to the registered homepage when only private paths have events', function () {
    HeuristicsEvent::create(['site_key' => 'sk2', 'kind' => 'click', 'path' => '/admin/x', 'x' => 1, 'y' => 1, 'occurred_at' => now()]);

    expect(app(PageScreenshotService::class)->busiestPublicPath('sk2', 'https://sk2.test/home'))->toBe('/home');
});

it('upgrades an http tracker snippet to https on a secure request', function () {
    Setting::put('tracker_code', '<script data-site="abc" data-endpoint="http://showcase.test/heuristics"></script>');

    $res = $this->get('https://localhost/');
    $res->assertOk();
    $res->assertSee('https://showcase.test/heuristics', false);
    $res->assertDontSee('http://showcase.test/heuristics', false);
});

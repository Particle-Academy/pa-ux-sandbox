<?php

use App\Models\Setting;
use App\Models\ShowcaseSubmission;
use App\Models\SitePageShot;
use App\Models\User;
use App\Services\Heuristics\PageScreenshotService;
use App\Services\Showcase\SafeUrlFetcher;
use Database\Seeders\FunLabSeeder;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

uses(TestCase::class);

beforeEach(function () {
    $this->seed(FunLabSeeder::class);
});

/** Fake a permissive robots.txt so capture() proceeds (no real network). */
function allowRobots(): void
{
    Http::fake(['*/robots.txt' => Http::response("User-agent: *\nAllow: /\n", 200)]);
}

function screenshotAdmin(): User
{
    return User::factory()->create(['is_admin' => true]);
}

function fakeRenderingService(string $bytes = 'FAKE_PNG'): void
{
    app()->bind(PageScreenshotService::class, fn ($app) => new class($app->make(SafeUrlFetcher::class), $bytes) extends PageScreenshotService
    {
        public function __construct(SafeUrlFetcher $fetcher, private string $bytes)
        {
            parent::__construct($fetcher);
        }

        protected function render(string $url, int $width, int $height): string
        {
            return $this->bytes;
        }
    });
}

it('recaptures the site homepage synchronously (never an internal path)', function () {
    Storage::fake('public');
    config(['screenshots.enabled' => true, 'app.url' => 'https://showcase.test']);
    allowRobots();
    fakeRenderingService();

    $sub = ShowcaseSubmission::create([
        'user_id' => User::factory()->create()->id,
        'kind' => 'website',
        'url' => 'https://showcase.test',
        'title' => 'Showcase',
        'status' => 'verified',
    ]);

    $this->actingAs(screenshotAdmin())
        ->post("/admin/sites/{$sub->id}/recapture")
        ->assertRedirect()
        ->assertSessionHas('success');

    // The captured path is the registered URL's homepage, not /admin/anything.
    $this->assertDatabaseHas('site_page_shots', ['site_key' => $sub->site_key, 'path' => '/']);
});

it('reports an error (not silence) when capture fails', function () {
    config(['screenshots.enabled' => true, 'app.url' => 'https://showcase.test']);
    allowRobots();

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

it('honors robots.txt — a disallowed page is never captured', function () {
    Storage::fake('public');
    config(['screenshots.enabled' => true, 'app.url' => 'https://showcase.test']);
    // robots.txt blocks everything for us → capture must bail before rendering.
    Http::fake(['*/robots.txt' => Http::response("User-agent: *\nDisallow: /\n", 200)]);
    fakeRenderingService();

    expect(app(PageScreenshotService::class)->capture('https://showcase.test/', 'sk', '/'))->toBeNull();
    $this->assertDatabaseMissing('site_page_shots', ['site_key' => 'sk']);
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

it('upgrades an http tracker snippet to https on a secure request', function () {
    Setting::put('tracker_code', '<script data-site="abc" data-endpoint="http://showcase.test/heuristics"></script>');

    $res = $this->get('https://localhost/');
    $res->assertOk();
    $res->assertSee('https://showcase.test/heuristics', false);
    $res->assertDontSee('http://showcase.test/heuristics', false);
});

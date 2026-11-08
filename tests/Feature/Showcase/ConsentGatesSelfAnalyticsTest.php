<?php

use App\Models\Setting;
use App\Models\User;
use FancyHeuristics\Models\HeuristicsEvent;
use FancyHeuristics\Models\HeuristicsPixelPing;
use Illuminate\Support\Facades\Artisan;
use Tests\TestCase;

uses(TestCase::class);

/*
 * The showcase's own analytics run only under `analytics` consent
 * (fancy-compliance 0.1.0). Two halves: the browser never mounts the pixel or
 * the agent sink without it (ShowcaseAnalytics.tsx, AgentAnalyticsSink.tsx),
 * and the server drops this site's own batches without it (GateSelfAnalytics).
 * These are the server half and the page the browser half is handed.
 *
 * Other sites' pixels post to the same routes cross-origin, with no consent of
 * ours to give, so they must keep flowing: gating the whole route would have
 * silently emptied every listed site's analytics.
 */

const SELF_PIXEL = '<script src="https://cdn.example.com/npm/@particle-academy/fancy-pixel/dist/fancy-pixel.global.min.js" data-site="selfkey01" data-endpoint="/heuristics" data-style="badge"></script>';

function selfBatch(string $siteKey = 'selfkey01'): array
{
    return [
        'siteKey' => $siteKey,
        'sessionId' => 'session01',
        'events' => [['kind' => 'click', 'actor' => 'human', 'path' => '/', 'ts' => now()->getTimestampMs(), 'x' => 1, 'y' => 2, 'vw' => 1280, 'vh' => 800]],
    ];
}

function selfPing(): array
{
    return ['siteKey' => 'selfkey01', 'style' => 'badge', 'mode' => 'floating', 'visible' => true, 'path' => '/', 'ts' => 1717000000000];
}

beforeEach(function () {
    Setting::put('tracker_code', SELF_PIXEL);
});

it('drops this site\'s own batch and beacon without consent', function () {
    $this->postJson('/heuristics/collect', selfBatch())
        ->assertNoContent()
        ->assertHeader('X-Fancy-Compliance', 'consent-required');
    $this->postJson('/heuristics/pixel', selfPing())->assertNoContent();

    expect(HeuristicsEvent::query()->where('site_key', 'selfkey01')->count())->toBe(0)
        ->and(HeuristicsPixelPing::query()->where('site_key', 'selfkey01')->count())->toBe(0);
});

it('still ingests every other site\'s pixel, which our consent does not govern', function () {
    $this->postJson('/heuristics/collect', selfBatch('othersite'))->assertStatus(202);

    expect(HeuristicsEvent::query()->where('site_key', 'othersite')->count())->toBe(1);
});

it('collects from a guest once they accept analytics, through the encrypted cookie', function () {
    $decided = $this->postJson('/fancy-compliance/consent', ['granted' => ['analytics'], 'source' => 'banner'])->assertOk();
    $token = $decided->getCookie('fancy_compliance_subject')?->getValue();
    expect($token)->not->toBeNull();

    // withCookie encrypts, as the browser's copy is: the api group does not
    // decrypt it, so this passes only because the gate does.
    $this->withCredentials()->withCookie('fancy_compliance_subject', $token)
        ->postJson('/heuristics/collect', selfBatch())
        ->assertStatus(202);

    expect(HeuristicsEvent::query()->where('site_key', 'selfkey01')->count())->toBe(1);
});

it('drops it again once the guest withdraws', function () {
    $token = $this->postJson('/fancy-compliance/consent', ['granted' => ['analytics'], 'source' => 'banner'])
        ->getCookie('fancy_compliance_subject')->getValue();

    $this->withCredentials()->withCookie('fancy_compliance_subject', $token)
        ->postJson('/fancy-compliance/consent/withdraw', ['categories' => ['analytics'], 'source' => 'preferences'])
        ->assertOk();

    $this->withCredentials()->withCookie('fancy_compliance_subject', $token)
        ->postJson('/heuristics/collect', selfBatch())
        ->assertNoContent();

    expect(HeuristicsEvent::query()->where('site_key', 'selfkey01')->count())->toBe(0);
});

it('collects from a signed-in person who accepted, and not from one who refused', function () {
    $yes = User::factory()->create();
    $this->actingAs($yes)->postJson('/fancy-compliance/consent', ['granted' => ['analytics'], 'source' => 'banner'])->assertOk();
    $this->actingAs($yes)->postJson('/heuristics/collect', selfBatch())->assertStatus(202);

    $no = User::factory()->create();
    $this->actingAs($no)->postJson('/fancy-compliance/consent', ['granted' => [], 'source' => 'banner'])->assertOk();
    $this->actingAs($no)->postJson('/heuristics/collect', selfBatch())->assertNoContent();

    expect(HeuristicsEvent::query()->where('site_key', 'selfkey01')->count())->toBe(1);
});

it('never prints a Fancy Pixel snippet, and hands the client its mount options', function () {
    $html = $this->get('/')->assertOk()->getContent();

    expect($html)->not->toContain('fancy-pixel.global.min.js');

    $this->get('/')->assertInertia(fn ($page) => $page
        ->where('selfPixel.siteKey', 'selfkey01')
        ->where('selfPixel.endpoint', '/heuristics')
        ->where('selfPixel.style', 'badge')
        ->where('fancyCompliance.needsConsent', true)
        ->where('fancyCompliance.categories', fn ($categories) => collect($categories)->pluck('key')->all() === ['necessary', 'analytics']));
});

it('prints any other tracker only on a page load that already has consent', function () {
    Setting::put('tracker_code', '<script src="https://stats.example.com/s.js" data-domain="x"></script>');

    expect($this->get('/')->getContent())->not->toContain('stats.example.com/s.js');

    $token = $this->postJson('/fancy-compliance/consent', ['granted' => ['analytics'], 'source' => 'banner'])
        ->getCookie('fancy_compliance_subject')->getValue();

    expect($this->withCookie('fancy_compliance_subject', $token)->get('/')->getContent())
        ->toContain('stats.example.com/s.js');
});

it('throttles the consent routes', function () {
    $route = collect(app('router')->getRoutes())->first(fn ($r) => $r->getName() === 'fancy-compliance.record');

    expect($route->gatherMiddleware())->toContain('throttle:30,1');
});

/*
 * fancy-heuristics 0.6 / fancy-heuristics-js 0.4: the collector now sends wire
 * v2, carrying the route and the title as their own fields. The gate must
 * still find this site's key in it, and the page must hand the collector the
 * route it reads.
 */
function selfBatchV2(): array
{
    return [
        'schemaVersion' => 2,
        'batchId' => 'batch-0001',
        'sentAt' => 1717000000000,
        'siteKey' => 'selfkey01',
        'sessionId' => 'session01',
        'events' => [[
            'eventId' => 'evt-0001',
            'name' => 'ui.view',
            'kind' => 'pageview',
            'actor' => 'human',
            'path' => '/docs/install',
            'ts' => now()->getTimestampMs(),
            'route' => ['name' => 'docs.show', 'pattern' => '/docs/{slug}'],
            'title' => 'Install — Docs — Fancy UI',
        ]],
    ];
}

it('gates a wire-v2 batch the same way: dropped without consent, stored with its route and title once given', function () {
    $this->postJson('/heuristics/collect', selfBatchV2())->assertNoContent();
    expect(HeuristicsEvent::query()->where('site_key', 'selfkey01')->count())->toBe(0);

    $token = $this->postJson('/fancy-compliance/consent', ['granted' => ['analytics'], 'source' => 'banner'])
        ->getCookie('fancy_compliance_subject')->getValue();
    $this->withCredentials()->withCookie('fancy_compliance_subject', $token)
        ->postJson('/heuristics/collect', selfBatchV2())
        ->assertStatus(202);

    $event = HeuristicsEvent::query()->where('site_key', 'selfkey01')->sole();
    expect($event->name)->toBe('ui.view')
        ->and($event->route_name)->toBe('docs.show')
        ->and($event->route_pattern)->toBe('/docs/{slug}')
        ->and($event->title)->toBe('Install — Docs — Fancy UI');
});

it('hands the collector the Laravel route name and pattern of every page', function () {
    $this->get('/docs')->assertInertia(fn ($page) => $page
        ->where('analyticsRoute.name', 'docs.index')
        ->where('analyticsRoute.pattern', '/docs'));

    $this->get('/features/connectors/twilio/setup')->assertInertia(fn ($page) => $page
        ->where('analyticsRoute.name', 'features.connectors.setup')
        ->where('analyticsRoute.pattern', '/features/connectors/{service}/setup'));

    $this->get('/')->assertInertia(fn ($page) => $page->where('analyticsRoute.pattern', '/'));
});

it('runs the collector from the showcase under consent, never from inside the pixel', function () {
    $component = (string) file_get_contents(resource_path('js/components/ShowcaseAnalytics.tsx'));
    $module = (string) file_get_contents(resource_path('js/analytics/selfAnalytics.ts'));

    expect($component)->toContain('collect: false')
        ->and($component)->toContain('syncSelfAnalytics(')
        ->and($component)->toContain('allows("analytics")')
        ->and($module)->toContain('consent: granted')
        ->and($module)->toContain('setConsent(granted)')
        ->and($module)->toContain('title: () => context.title')
        ->and($module)->toContain('route: () => context.route');
});

it('registers the taxonomy backfill command, which this deploy does not run', function () {
    expect(array_keys(Artisan::all()))->toContain('heuristics:backfill-taxonomy');
});

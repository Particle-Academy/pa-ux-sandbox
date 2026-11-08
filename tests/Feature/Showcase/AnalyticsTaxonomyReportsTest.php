<?php

use App\Http\Controllers\AnalyticsController;
use App\Models\User;
use Database\Seeders\FunLabSeeder;
use FancyHeuristics\Facades\Heuristics;
use FancyHeuristics\Models\HeuristicsEvent;
use FancyHeuristics\Models\HeuristicsSite;
use LaravelFunLab\Facades\LFL;
use Tests\TestCase;

uses(TestCase::class);

/*
 * The Elements and Pages reports after fancy-heuristics 0.6 / -js 0.4.
 *
 * New rows carry a `<domain>.<verb>` event name, the activated control (its
 * component and its own accessible name), the route pattern and the page
 * title. Rows stored before the upgrade have none of that, and nobody runs
 * `heuristics:backfill-taxonomy` on this deploy, so they must still show,
 * marked as legacy, with the label they were stored with.
 *
 * Agent activity is no longer a click (0.6 stores it as kind `agent`, named
 * `agent.tool` / `agent.act`), so the agent Elements read it by name; an old
 * agent click still shows.
 */

const HEADER_TEXT = 'Fancy UI Kitv0.5DocsLearnPackagesFeaturesUse CasesInspirationShowcaseLeaderboardCtrlKSign inDocsPackagesFeaturesMoreSign';

beforeEach(function () {
    $this->seed(FunLabSeeder::class);
});

function taxonomyProUser(): User
{
    $user = User::factory()->create();
    LFL::grant('sandbox-pro')->to($user)->save();

    return $user;
}

function seedTaxonomyEvents(): void
{
    $site = AnalyticsController::DEFAULT_SITE;
    HeuristicsSite::firstOrCreate(['site_key' => $site], ['url' => 'https://ui.example.com', 'visible' => true]);
    $at = now()->subDays(2);

    // Stored by 0.5, before the upgrade: no name, no target, the header's text.
    HeuristicsEvent::create(['site_key' => $site, 'session_id' => 'old-1', 'actor' => 'human', 'kind' => 'click', 'path' => '/', 'label' => HEADER_TEXT, 'occurred_at' => $at]);
    HeuristicsEvent::create(['site_key' => $site, 'session_id' => 'old-1', 'actor' => 'human', 'kind' => 'pageview', 'path' => '/old-page', 'occurred_at' => $at]);
    HeuristicsEvent::create(['site_key' => $site, 'session_id' => 'old-2', 'actor' => 'agent', 'kind' => 'click', 'path' => '/docs', 'target_id' => 'docs-link', 'label' => 'Docs', 'occurred_at' => $at]);

    // Wire v2, as fancy-heuristics-js 0.4 sends it.
    Heuristics::collect([
        'schemaVersion' => 2,
        'batchId' => 'b-1',
        'siteKey' => $site,
        'sessionId' => 'new-1',
        'events' => [
            ['eventId' => 'e-1', 'name' => 'ui.view', 'kind' => 'pageview', 'actor' => 'human', 'path' => '/docs/install', 'ts' => $at->valueOf(),
                'route' => ['name' => 'docs.show', 'pattern' => '/docs/{slug}'], 'title' => 'Install — Docs — Fancy UI'],
            ['eventId' => 'e-2', 'name' => 'ui.activate', 'kind' => 'click', 'actor' => 'human', 'path' => '/docs/install', 'ts' => $at->copy()->addSeconds(5)->valueOf(),
                'route' => ['name' => 'docs.show', 'pattern' => '/docs/{slug}'], 'target' => ['component' => 'button', 'role' => 'button', 'name' => 'Sign in']],
            ['eventId' => 'e-3', 'name' => 'ui.activate', 'kind' => 'click', 'actor' => 'human', 'path' => '/docs/install', 'ts' => $at->copy()->addSeconds(9)->valueOf(),
                'route' => ['name' => 'docs.show', 'pattern' => '/docs/{slug}'], 'target' => ['component' => 'button', 'role' => 'button', 'name' => 'Sign in']],
        ],
    ]);

    // The relay's server-side agent tool call (AgentRelayController, wire v1).
    Heuristics::collect([
        'siteKey' => $site,
        'sessionId' => 'relay-1',
        'events' => [[
            'kind' => 'click', 'actor' => 'agent', 'path' => '/', 'ts' => $at->valueOf(),
            'targetId' => 'page_navigate', 'label' => 'page navigate',
            'meta' => ['action' => 'page_navigate', 'source' => 'agent', 'via' => 'relay'],
        ]],
    ]);
}

it('shows the activated control with its event name and its own label, and keeps old rows as legacy', function () {
    seedTaxonomyEvents();

    $this->actingAs(taxonomyProUser())->get('/analytics')->assertOk()->assertInertia(function ($page) {
        $elements = collect($page->toArray()['props']['behavior']['topElements']);

        $signIn = $elements->firstWhere('label', 'Sign in');
        expect($signIn)->not->toBeNull()
            ->and($signIn['event'])->toBe('ui.activate')
            ->and($signIn['component'])->toBe('button')
            ->and($signIn['clicks'])->toBe(2)
            ->and($signIn['legacy'])->toBeFalse();

        $old = $elements->firstWhere('label', HEADER_TEXT);
        expect($old)->not->toBeNull('a row stored before the upgrade no longer displays')
            ->and($old['legacy'])->toBeTrue()
            ->and($old['event'])->toBeNull();
    });
});

it('shows each page with its title and route, and an old page without them', function () {
    seedTaxonomyEvents();

    $this->actingAs(taxonomyProUser())->get('/analytics')->assertOk()->assertInertia(function ($page) {
        $pages = collect($page->toArray()['props']['behavior']['topPages'])->keyBy('path');

        expect($pages['/docs/install']['title'])->toBe('Install — Docs — Fancy UI')
            ->and($pages['/docs/install']['route_pattern'])->toBe('/docs/{slug}')
            ->and($pages['/docs/install']['route_name'])->toBe('docs.show');

        expect($pages)->toHaveKey('/old-page')
            ->and($pages['/old-page']['title'])->toBeNull()
            ->and($pages['/old-page']['route_name'])->toBeNull();
    });
});

it('counts events by their domain.verb name', function () {
    seedTaxonomyEvents();

    $this->actingAs(taxonomyProUser())->get('/analytics')->assertOk()->assertInertia(function ($page) {
        $names = collect($page->toArray()['props']['behavior']['eventNames'])->keyBy('name');

        expect($names['ui.activate']['events'])->toBe(2)
            ->and($names['ui.view']['events'])->toBe(1)
            ->and($names['agent.tool']['events'])->toBe(1);
    });
});

it('reads agent elements by name now that agent activity is not a click, and still shows an old agent click', function () {
    seedTaxonomyEvents();

    $this->actingAs(taxonomyProUser())->get('/analytics')->assertOk()->assertInertia(function ($page) {
        $agent = collect($page->toArray()['props']['agent']['agentElements']);

        $tool = $agent->firstWhere('event', 'agent.tool');
        expect($tool)->not->toBeNull('the relay\'s tool call is missing from agent elements')
            ->and($tool['label'])->toBe('page navigate')
            ->and($tool['target_id'])->toBe('page_navigate')
            ->and($tool['clicks'])->toBe(1);

        $old = $agent->firstWhere('target_id', 'docs-link');
        expect($old)->not->toBeNull()
            ->and($old['legacy'])->toBeTrue()
            ->and($old['label'])->toBe('Docs');

        $human = collect($page->toArray()['props']['agent']['humanElements']);
        expect($human->firstWhere('label', 'Sign in')['event'])->toBe('ui.activate');
    });
});

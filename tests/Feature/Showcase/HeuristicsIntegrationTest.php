<?php

use App\Models\ShowcaseSubmission;
use App\Models\User;
use FancyHeuristics\Models\HeuristicsEvent;
use FancyHeuristics\Models\HeuristicsPixelPing;
use FancyHeuristics\Models\HeuristicsSite;
use Tests\TestCase;

uses(TestCase::class);

it('registers a HeuristicsSite when a showcase submission is created', function () {
    $owner = User::factory()->create();

    $submission = ShowcaseSubmission::create([
        'user_id' => $owner->id,
        'kind' => 'website',
        'url' => 'https://mapped-site.test',
        'status' => 'pending',
    ]);

    $site = HeuristicsSite::query()->where('site_key', $submission->site_key)->first();

    expect($site)->not->toBeNull()
        ->and($site->url)->toBe('https://mapped-site.test')
        // The public listing is gated by the showcase's own per-kind verification,
        // not the heuristics site flag, so it starts not-visible.
        ->and((bool) $site->visible)->toBeFalse();
});

it('ingests a Fancy Pixel collect batch at the mounted endpoint', function () {
    $response = $this->postJson('/heuristics/collect', [
        'siteKey' => 'sitekey01',
        'sessionId' => 'session01',
        'events' => [
            ['kind' => 'click', 'actor' => 'human', 'path' => '/pricing', 'ts' => 1717000000000, 'x' => 120, 'y' => 340, 'vw' => 1280, 'vh' => 800, 'targetId' => 'cta'],
            ['kind' => 'scroll', 'actor' => 'human', 'path' => '/pricing', 'ts' => 1717000000100, 'scrollPct' => 62],
        ],
    ]);

    $response->assertStatus(202);

    expect(HeuristicsEvent::query()->where('site_key', 'sitekey01')->count())->toBe(2);
});

it('ingests a Fancy Pixel liveness beacon at the mounted endpoint', function () {
    $response = $this->postJson('/heuristics/pixel', [
        'siteKey' => 'sitekey02',
        'style' => 'badge',
        'mode' => 'floating',
        'visible' => true,
        'path' => '/',
        'ts' => 1717000000000,
    ]);

    $response->assertStatus(202);

    expect(HeuristicsPixelPing::query()->where('site_key', 'sitekey02')->count())->toBe(1);
});

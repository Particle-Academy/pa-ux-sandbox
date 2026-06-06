<?php

use App\Models\ShowcaseSubmission;
use App\Models\User;
use FancyHeuristics\Models\HeuristicsEvent;
use Tests\TestCase;

uses(TestCase::class);

/**
 * Create a submission for a user with an explicit, predictable site_key (the
 * model's boot hook only auto-generates one when it's empty).
 */
function mkSubmission(User $user, string $siteKey, array $attrs = []): ShowcaseSubmission
{
    return ShowcaseSubmission::create(array_merge([
        'user_id' => $user->id,
        'site_key' => $siteKey,
        'kind' => 'website',
        'url' => 'https://example.test',
        'status' => 'pending',
    ], $attrs));
}

it('requires authentication', function () {
    $this->get('/showcase/mine')->assertRedirect('/login');
});

it('lists only the signed-in user’s own submissions, newest first', function () {
    $me = User::factory()->create();
    $other = User::factory()->create();

    mkSubmission($me, 'mine-aaa', ['title' => 'Mine A']);
    mkSubmission($me, 'mine-bbb', ['title' => 'Mine B', 'kind' => 'repo', 'url' => 'https://github.com/me/repo']);
    mkSubmission($other, 'theirs-ccc', ['title' => 'Theirs']);

    $this->actingAs($me)
        ->get('/showcase/mine')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('Showcase/Mine')
            ->has('submissions', 2)
            ->where('submissions.0.site_key', 'mine-bbb')
            ->where('submissions.1.site_key', 'mine-aaa')
        );
});

it('includes a free basic stat strip per submission from the live feed', function () {
    $me = User::factory()->create();
    mkSubmission($me, 'mine-stats', ['title' => 'Statful']);

    $now = now();
    $events = [
        ['session_id' => 's1', 'actor' => 'human', 'kind' => 'pageview', 'path' => '/'],
        ['session_id' => 's1', 'actor' => 'human', 'kind' => 'click', 'path' => '/', 'x' => 10, 'y' => 10, 'vw' => 1000, 'vh' => 800],
        ['session_id' => 's2', 'actor' => 'agent', 'kind' => 'pageview', 'path' => '/docs'],
    ];
    foreach ($events as $i => $e) {
        HeuristicsEvent::create(array_merge(
            ['site_key' => 'mine-stats', 'occurred_at' => $now->copy()->subMinutes(5 - $i)],
            $e,
        ));
    }

    $this->actingAs($me)
        ->get('/showcase/mine')
        ->assertInertia(fn ($page) => $page
            ->where('submissions.0.stats.pageviews', 2)
            ->where('submissions.0.stats.clicks', 1)
            ->where('submissions.0.stats.sessions', 2)
            ->where('submissions.0.stats.human', 2)
            ->where('submissions.0.stats.agent', 1)
            ->where('submissions.0.stats.totalEvents', 3)
        );
});

it('reports zeroed stats for a submission with no activity yet', function () {
    $me = User::factory()->create();
    mkSubmission($me, 'mine-quiet');

    $this->actingAs($me)
        ->get('/showcase/mine')
        ->assertInertia(fn ($page) => $page
            ->where('submissions.0.stats.totalEvents', 0)
            ->where('submissions.0.stats.pageviews', 0)
        );
});

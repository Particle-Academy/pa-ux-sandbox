<?php

use App\Models\GithubRepoStat;
use App\Models\User;
use Database\Seeders\FunLabSeeder;
use Illuminate\Testing\TestResponse;
use Tests\TestCase;

uses(TestCase::class);

beforeEach(function () {
    $this->seed(FunLabSeeder::class);
    config([
        'services.github.webhook_secret' => 'shh-secret',
        'services.github.org' => 'Particle-Academy',
        'services.github.bug_labels' => ['bug', 'confirmed'],
    ]);
});

function ghPost(array $payload, string $event = 'issues', ?string $secret = 'shh-secret'): TestResponse
{
    $body = json_encode($payload);
    $headers = ['X-GitHub-Event' => $event, 'Content-Type' => 'application/json'];
    if ($secret !== null) {
        $headers['X-Hub-Signature-256'] = 'sha256='.hash_hmac('sha256', $body, $secret);
    }

    return test()->call('POST', '/webhooks/github', [], [], [], transformHeaders($headers), $body);
}

function transformHeaders(array $headers): array
{
    $server = [];
    foreach ($headers as $k => $v) {
        $server['HTTP_'.strtoupper(str_replace('-', '_', $k))] = $v;
    }
    // Content-Type maps to CONTENT_TYPE, not HTTP_CONTENT_TYPE.
    if (isset($headers['Content-Type'])) {
        $server['CONTENT_TYPE'] = $headers['Content-Type'];
    }

    return $server;
}

function bugPayload(string $login, string $repo = 'Particle-Academy/react-fancy', int $number = 7): array
{
    return [
        'action' => 'labeled',
        'repository' => ['full_name' => $repo],
        'issue' => [
            'number' => $number,
            'user' => ['login' => $login],
            'labels' => [['name' => 'bug']],
        ],
    ];
}

it('rejects an unsigned request', function () {
    $user = User::factory()->create(['github_username' => 'octocat']);

    ghPost(bugPayload('octocat'), secret: null)->assertForbidden();

    expect($user->getProfile()->getXpFor('bug-hunter-xp'))->toBe(0);
});

it('rejects a bad signature', function () {
    ghPost(bugPayload('octocat'), secret: 'wrong-secret')->assertForbidden();
});

it('returns 503 when no webhook secret is configured', function () {
    config(['services.github.webhook_secret' => '']);

    ghPost(bugPayload('octocat'))->assertStatus(503);
});

it('awards bug-hunter-xp + first-bug to the linked issue author', function () {
    $user = User::factory()->create(['github_username' => 'octocat']);

    ghPost(bugPayload('octocat'))->assertOk()->assertJson(['bug' => true]);

    $user->refresh();
    expect($user->getProfile()->getXpFor('bug-hunter-xp'))->toBe(50)
        ->and($user->hasAchievement('first-bug'))->toBeTrue();
});

it('is idempotent per issue', function () {
    $user = User::factory()->create(['github_username' => 'octocat']);

    ghPost(bugPayload('octocat', number: 7))->assertOk();
    ghPost(bugPayload('octocat', number: 7))->assertOk()->assertJson(['bug' => false]);

    expect($user->fresh()->getProfile()->getXpFor('bug-hunter-xp'))->toBe(50);
});

it('does not award bug-hunter-xp without a bug label', function () {
    $user = User::factory()->create(['github_username' => 'octocat']);
    $payload = bugPayload('octocat');
    $payload['action'] = 'labeled';
    $payload['issue']['labels'] = [['name' => 'question']];

    ghPost($payload)->assertOk();

    expect($user->getProfile()->getXpFor('bug-hunter-xp'))->toBe(0);
});

it('ignores repos outside the configured org', function () {
    $user = User::factory()->create(['github_username' => 'octocat']);

    ghPost(bugPayload('octocat', repo: 'someone-else/their-repo'))
        ->assertOk()->assertJson(['ignored' => 'org']);

    expect($user->getProfile()->getXpFor('bug-hunter-xp'))->toBe(0);
});

it('awards contributor-xp when a linked user opens any issue', function () {
    $user = User::factory()->create(['github_username' => 'octocat']);

    ghPost([
        'action' => 'opened',
        'repository' => ['full_name' => 'Particle-Academy/react-fancy'],
        'issue' => ['number' => 12, 'user' => ['login' => 'octocat'], 'labels' => []],
    ])->assertOk()->assertJson(['contributor' => true]);

    expect($user->fresh()->getProfile()->getXpFor('contributor-xp'))->toBe(10);
});

it('awards contributor-xp when a linked user gets a PR merged', function () {
    $user = User::factory()->create(['github_username' => 'octocat']);

    ghPost([
        'action' => 'closed',
        'repository' => ['full_name' => 'Particle-Academy/react-fancy'],
        'pull_request' => ['number' => 5, 'merged' => true, 'user' => ['login' => 'octocat']],
    ], event: 'pull_request')->assertOk()->assertJson(['awarded' => true]);

    expect($user->fresh()->getProfile()->getXpFor('contributor-xp'))->toBe(50);
});

it('ignores a closed-but-unmerged PR', function () {
    $user = User::factory()->create(['github_username' => 'octocat']);

    ghPost([
        'action' => 'closed',
        'repository' => ['full_name' => 'Particle-Academy/react-fancy'],
        'pull_request' => ['number' => 5, 'merged' => false, 'user' => ['login' => 'octocat']],
    ], event: 'pull_request')->assertOk()->assertJson(['ignored' => 'not merged']);

    expect($user->fresh()->getProfile()->getXpFor('contributor-xp'))->toBe(0);
});

it('awards promotion-xp on a star and nudges the cached count', function () {
    $user = User::factory()->create(['github_username' => 'octocat']);
    GithubRepoStat::create(['repo' => 'Particle-Academy/react-fancy', 'stars' => 100]);

    ghPost([
        'action' => 'created',
        'repository' => ['full_name' => 'Particle-Academy/react-fancy'],
        'sender' => ['login' => 'octocat'],
    ], event: 'star')->assertOk()->assertJson(['awarded' => true]);

    expect($user->fresh()->getProfile()->getXpFor('promotion-xp'))->toBe(5)
        ->and(GithubRepoStat::first()->stars)->toBe(101);
});

it('decrements the cached count when a star is removed', function () {
    GithubRepoStat::create(['repo' => 'Particle-Academy/react-fancy', 'stars' => 100]);

    ghPost([
        'action' => 'deleted',
        'repository' => ['full_name' => 'Particle-Academy/react-fancy'],
        'sender' => ['login' => 'octocat'],
    ], event: 'star')->assertOk();

    expect(GithubRepoStat::first()->stars)->toBe(99);
});

it('accepts engagement from unlinked GitHub users without awarding XP', function () {
    // No account for "stranger" — the periodic sweep credits them on the
    // leaderboard instead; the webhook just 200s.
    ghPost([
        'action' => 'created',
        'repository' => ['full_name' => 'Particle-Academy/react-fancy'],
        'sender' => ['login' => 'stranger'],
    ], event: 'star')->assertOk()->assertJson(['awarded' => false]);
});

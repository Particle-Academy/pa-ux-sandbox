<?php

use App\Models\User;
use Database\Seeders\FunLabSeeder;
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

function ghPost(array $payload, string $event = 'issues', ?string $secret = 'shh-secret'): \Illuminate\Testing\TestResponse
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

    ghPost(bugPayload('octocat'))->assertOk()->assertJson(['awarded' => true]);

    $user->refresh();
    expect($user->getProfile()->getXpFor('bug-hunter-xp'))->toBe(50)
        ->and($user->hasAchievement('first-bug'))->toBeTrue()
        // bug-hunter-xp 0.35 -> 17 coins + first-bug default achievement bonus 50
        ->and($user->coinBalance())->toBe(67);
});

it('is idempotent per issue', function () {
    $user = User::factory()->create(['github_username' => 'octocat']);

    ghPost(bugPayload('octocat', number: 7))->assertOk();
    ghPost(bugPayload('octocat', number: 7))->assertOk()->assertJson(['awarded' => false]);

    expect($user->fresh()->getProfile()->getXpFor('bug-hunter-xp'))->toBe(50);
});

it('ignores issues without a bug label', function () {
    $user = User::factory()->create(['github_username' => 'octocat']);
    $payload = bugPayload('octocat');
    $payload['issue']['labels'] = [['name' => 'question']];

    ghPost($payload)->assertOk()->assertJson(['ignored' => 'no bug label']);

    expect($user->getProfile()->getXpFor('bug-hunter-xp'))->toBe(0);
});

it('ignores repos outside the configured org', function () {
    $user = User::factory()->create(['github_username' => 'octocat']);

    ghPost(bugPayload('octocat', repo: 'someone-else/their-repo'))
        ->assertOk()->assertJson(['ignored' => 'org']);

    expect($user->getProfile()->getXpFor('bug-hunter-xp'))->toBe(0);
});

it('ignores issues from users with no linked account', function () {
    ghPost(bugPayload('stranger'))->assertOk()->assertJson(['ignored' => 'no linked user']);
});

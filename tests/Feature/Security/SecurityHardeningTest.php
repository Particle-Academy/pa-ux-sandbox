<?php

use App\Models\User;
use App\Services\Heuristics\PageScreenshotService;
use App\Services\Showcase\SafeUrlFetcher;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

uses(TestCase::class);

it('never mass-assigns privilege columns on User', function () {
    $user = User::factory()->create(['is_admin' => false, 'pro_override' => false]);

    // A stray fill()/create() from request data must not escalate the account.
    $user->fill(['is_admin' => true, 'pro_override' => true, 'suspended_at' => now()])->save();

    expect($user->fresh()->is_admin)->toBeFalse()
        ->and($user->fresh()->pro_override)->toBeFalse()
        ->and($user->fresh()->suspended_at)->toBeNull();
});

it('coerces a disallowed model to the default in the public whiteboard proxy', function () {
    config()->set('services.anthropic.key', 'test-key');
    Http::fake(['api.anthropic.com/*' => Http::response(['content' => []], 200)]);

    $this->postJson('/whiteboard-agent/turn', [
        'model' => 'claude-opus-4-8', // not on the demo allow-list
        'messages' => [['role' => 'user', 'content' => 'hi']],
    ])->assertOk();

    Http::assertSent(fn ($request) => data_get($request->data(), 'model') === 'claude-sonnet-4-5');
});

it('refuses to render an untrusted external URL on the local browsershot driver', function () {
    config()->set('screenshots.enabled', true);
    config()->set('screenshots.driver', 'browsershot');

    // Make the SSRF guard pass (host resolves to a public IP) so the ONLY thing
    // stopping the render is the off-box-renderer requirement for untrusted URLs.
    SafeUrlFetcher::resolveUsing(fn () => ['93.184.216.34']);

    $shot = app(PageScreenshotService::class)->capture('https://external.test/', 'sitekey', '/');

    expect($shot)->toBeNull();

    SafeUrlFetcher::resolveUsing(null);
});

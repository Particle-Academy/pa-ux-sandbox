<?php

use App\Models\ShowcaseSubmission;
use App\Models\User;
use App\Services\Showcase\SafeUrlFetcher;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Queue;
use Tests\TestCase;

uses(TestCase::class);

/*
 * The submission gate: a website is only accepted once the Fancy Pixel is
 * actually present on it. The controller fetches the URL server-side
 * (SSRF-safe) and runs the shared FancyPixelDetector BEFORE creating the row.
 *
 * Http::fake() stubs the fetch; SafeUrlFetcher::resolveUsing() stubs DNS so
 * the SSRF guard can be exercised without live lookups.
 */

beforeEach(function () {
    Queue::fake();
    // Test hosts resolve to a public IP so the SSRF guard lets them through.
    SafeUrlFetcher::resolveUsing(fn (string $host) => ['93.184.216.34']);
});

afterEach(function () {
    SafeUrlFetcher::resolveUsing(null);
});

it('rejects a website whose HTML lacks the Fancy Pixel', function () {
    Http::fake([
        'https://no-pixel.example' => Http::response('<html><body>nothing here</body></html>', 200),
    ]);

    $this->actingAs(User::factory()->create());

    $response = $this->from('/showcase/submit')->post('/showcase/submit', [
        'kind' => 'website',
        'url' => 'https://no-pixel.example',
    ]);

    $response->assertRedirect('/showcase/submit');
    $response->assertSessionHasErrors('url');
    expect(session('errors')->get('url')[0])->toContain("couldn't find the Fancy Pixel");

    expect(ShowcaseSubmission::count())->toBe(0);
});

it('accepts a website whose HTML contains the fancy-pixel loader script', function () {
    Http::fake([
        'https://has-pixel.example' => Http::response(
            '<html><head><script src="https://unpkg.com/@particle-academy/fancy-pixel/dist/fancy-pixel.global.min.js" data-site="acme" data-style="badge"></script></head><body>hi</body></html>',
            200
        ),
    ]);

    $user = User::factory()->create();
    $this->actingAs($user);

    $response = $this->post('/showcase/submit', [
        'kind' => 'website',
        'url' => 'https://has-pixel.example',
    ]);

    $response->assertRedirect(route('showcase.showcase.index'));
    $response->assertSessionHasNoErrors();

    $submission = ShowcaseSubmission::query()->where('url', 'https://has-pixel.example')->first();
    expect($submission)->not->toBeNull();
    expect($submission->kind)->toBe('website');
    expect($submission->user_id)->toBe($user->id);
    // The gate pre-seeds the badge finding for the background scanner.
    expect($submission->scan_result['badge'] ?? null)->toBeTrue();
});

it('refuses a URL that resolves to a private / loopback address (SSRF guard)', function () {
    // This host resolves to loopback — the SSRF guard must block it before
    // any request is made.
    SafeUrlFetcher::resolveUsing(fn (string $host) => ['127.0.0.1']);

    Http::fake();

    $this->actingAs(User::factory()->create());

    $response = $this->from('/showcase/submit')->post('/showcase/submit', [
        'kind' => 'website',
        'url' => 'https://internal.example',
    ]);

    $response->assertSessionHasErrors('url');
    expect(ShowcaseSubmission::count())->toBe(0);
    // No outbound request should have been attempted.
    Http::assertNothingSent();
});

it('refuses a non-http(s) scheme (SSRF guard)', function () {
    Http::fake();

    $this->actingAs(User::factory()->create());

    $response = $this->from('/showcase/submit')->post('/showcase/submit', [
        'kind' => 'website',
        // url validation allows ftp:// through Laravel's `url` rule, so the
        // scheme guard is what stops it.
        'url' => 'ftp://files.example/x',
    ]);

    $response->assertSessionHasErrors('url');
    expect(ShowcaseSubmission::count())->toBe(0);
});

it('does not run the pixel gate for repo submissions', function () {
    // Repos are verified against package manifests by the scanner, not the
    // pixel gate — so no fetch happens and the row is created immediately.
    Http::fake();

    $this->actingAs(User::factory()->create());

    $response = $this->post('/showcase/submit', [
        'kind' => 'repo',
        'url' => 'https://github.com/acme/widget',
    ]);

    $response->assertRedirect(route('showcase.showcase.index'));
    expect(ShowcaseSubmission::query()->where('kind', 'repo')->count())->toBe(1);
    Http::assertNothingSent();
});

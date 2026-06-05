<?php

use App\Jobs\ScanShowcaseSubmission;
use App\Models\ShowcaseSubmission;
use App\Models\User;
use App\Services\Showcase\FancyPixelDetector;
use App\Services\Showcase\SafeUrlFetcher;
use App\Services\Showcase\UnsafeUrlException;
use Illuminate\Support\Facades\Bus;
use Tests\TestCase;

uses(TestCase::class);

/*
 * GA-style registration: submitting NEVER blocks. Registering a site always
 * succeeds and creates a PENDING submission with a generated site_key; the
 * async ScanShowcaseSubmission job is what later flips pending -> verified once
 * the Fancy Pixel is detected. There is no submit-time pixel gate any more.
 *
 * The FancyPixelDetector + SafeUrlFetcher remain in play — they're now only
 * exercised by the async scanner — so their unit-level behaviour is asserted
 * directly at the bottom of this file.
 */

beforeEach(function () {
    Bus::fake();
});

it('registers a website without the pixel and creates a pending submission', function () {
    $user = User::factory()->create();
    $this->actingAs($user);

    $response = $this->post('/showcase/submit', [
        'kind' => 'website',
        'url' => 'https://no-pixel.example',
        'style' => 'mark',
        'mode' => 'placed',
    ]);

    $submission = ShowcaseSubmission::query()->where('url', 'https://no-pixel.example')->first();

    expect($submission)->not->toBeNull();
    expect($submission->status)->toBe('pending');
    expect($submission->site_key)->not->toBeEmpty();
    expect($submission->style)->toBe('mark');
    expect($submission->mode)->toBe('placed');
    expect($submission->user_id)->toBe($user->id);

    // Redirects to the install page for the new submission.
    $response->assertRedirect(route('showcase.showcase.installed', $submission));
    $response->assertSessionHasNoErrors();
});

it('dispatches the async pixel verifier on registration', function () {
    $this->actingAs(User::factory()->create());

    $this->post('/showcase/submit', [
        'kind' => 'website',
        'url' => 'https://pending.example',
    ]);

    Bus::assertDispatched(ScanShowcaseSubmission::class);
});

it('defaults style to badge and mode to floating when omitted', function () {
    $this->actingAs(User::factory()->create());

    $this->post('/showcase/submit', [
        'kind' => 'website',
        'url' => 'https://defaults.example',
    ]);

    $submission = ShowcaseSubmission::query()->where('url', 'https://defaults.example')->first();
    expect($submission->style)->toBe('badge');
    expect($submission->mode)->toBe('floating');
});

it('generates a unique site_key per submission', function () {
    $this->actingAs(User::factory()->create());

    $this->post('/showcase/submit', ['kind' => 'website', 'url' => 'https://a.example']);
    $this->post('/showcase/submit', ['kind' => 'website', 'url' => 'https://b.example']);

    $keys = ShowcaseSubmission::query()->pluck('site_key');
    expect($keys)->toHaveCount(2);
    expect($keys->unique())->toHaveCount(2);
    expect($keys->every(fn ($k) => filled($k)))->toBeTrue();
});

it('rejects a malformed url at validation', function () {
    $this->actingAs(User::factory()->create());

    $response = $this->from('/showcase/submit')->post('/showcase/submit', [
        'kind' => 'website',
        'url' => 'not-a-url',
    ]);

    $response->assertSessionHasErrors('url');
    expect(ShowcaseSubmission::count())->toBe(0);
});

it('rejects a non-http(s) scheme at validation', function () {
    $this->actingAs(User::factory()->create());

    $response = $this->from('/showcase/submit')->post('/showcase/submit', [
        'kind' => 'website',
        'url' => 'ftp://files.example/x',
    ]);

    $response->assertSessionHasErrors('url');
    expect(ShowcaseSubmission::count())->toBe(0);
});

it('registers a repo submission as pending', function () {
    $this->actingAs(User::factory()->create());

    $response = $this->post('/showcase/submit', [
        'kind' => 'repo',
        'url' => 'https://github.com/acme/widget',
    ]);

    $submission = ShowcaseSubmission::query()->where('kind', 'repo')->first();
    expect($submission)->not->toBeNull();
    expect($submission->status)->toBe('pending');
    $response->assertRedirect(route('showcase.showcase.installed', $submission));
    Bus::assertDispatched(ScanShowcaseSubmission::class);
});

it('shows the install page with a snippet carrying the site_key, style and mode', function () {
    $user = User::factory()->create();
    $this->actingAs($user);

    $submission = ShowcaseSubmission::create([
        'user_id' => $user->id,
        'kind' => 'website',
        'url' => 'https://installed.example',
        'style' => 'beacon',
        'mode' => 'placed',
        'status' => 'pending',
    ]);

    $response = $this->get(route('showcase.showcase.installed', $submission));
    $response->assertOk();

    $response->assertInertia(
        fn ($page) => $page
            ->component('Showcase/Installed')
            ->where('submission.site_key', $submission->site_key)
            ->where('submission.status', 'pending')
            ->where('snippet', fn ($snippet) => str_contains($snippet, 'data-site="'.$submission->site_key.'"')
                && str_contains($snippet, 'data-style="beacon"')
                && str_contains($snippet, 'data-mode="placed"')
                && str_contains($snippet, '/heuristics')
            )
    );
});

it('forbids viewing another user\'s install page', function () {
    $owner = User::factory()->create();
    $other = User::factory()->create();

    $submission = ShowcaseSubmission::create([
        'user_id' => $owner->id,
        'kind' => 'website',
        'url' => 'https://owned.example',
        'status' => 'pending',
    ]);

    $this->actingAs($other);
    $this->get(route('showcase.showcase.installed', $submission))->assertForbidden();
});

it('re-dispatches the scan when the owner clicks Check now', function () {
    $user = User::factory()->create();
    $this->actingAs($user);

    $submission = ShowcaseSubmission::create([
        'user_id' => $user->id,
        'kind' => 'website',
        'url' => 'https://recheck.example',
        'status' => 'pending',
    ]);

    $response = $this->post(route('showcase.showcase.rescan', $submission));

    $response->assertRedirect(route('showcase.showcase.installed', $submission));
    Bus::assertDispatched(ScanShowcaseSubmission::class);
});

it('lists only verified submissions on the public showcase index', function () {
    $user = User::factory()->create();

    ShowcaseSubmission::create([
        'user_id' => $user->id,
        'kind' => 'website',
        'url' => 'https://pending-hidden.example',
        'title' => 'Hidden Pending',
        'status' => 'pending',
    ]);
    ShowcaseSubmission::create([
        'user_id' => $user->id,
        'kind' => 'website',
        'url' => 'https://verified-shown.example',
        'title' => 'Shown Verified',
        'status' => 'verified',
    ]);

    $response = $this->get('/showcase');
    $response->assertOk();

    $response->assertInertia(
        fn ($page) => $page
            ->component('Showcase/Index')
            ->has('submissions', 1)
            ->where('submissions.0.url', 'https://verified-shown.example')
    );
});

/*
 * ── The detector + fetcher still back the async scan ─────────────────────
 * These keep the SafeUrlFetcher SSRF guard and FancyPixelDetector behaviour
 * pinned, since the scanner (not a submit-time gate) now relies on them.
 */

it('detects the fancy-pixel loader script in HTML', function () {
    $html = '<html><head><script src="https://unpkg.com/@particle-academy/fancy-pixel/dist/fancy-pixel.global.min.js" data-site="acme"></script></head></html>';
    expect(app(FancyPixelDetector::class)->detect($html))->toBeTrue();
});

it('does not detect a pixel in plain HTML', function () {
    expect(app(FancyPixelDetector::class)->detect('<html><body>nothing</body></html>'))->toBeFalse();
});

it('blocks a URL that resolves to a loopback address (SSRF guard)', function () {
    SafeUrlFetcher::resolveUsing(fn (string $host) => ['127.0.0.1']);

    expect(fn () => app(SafeUrlFetcher::class)->assertSafe('https://internal.example'))
        ->toThrow(UnsafeUrlException::class);

    SafeUrlFetcher::resolveUsing(null);
});

it('blocks a non-http(s) scheme in the fetcher (SSRF guard)', function () {
    expect(fn () => app(SafeUrlFetcher::class)->assertSafe('ftp://files.example/x'))
        ->toThrow(UnsafeUrlException::class);
});

it('allows a public host through the SSRF guard', function () {
    SafeUrlFetcher::resolveUsing(fn (string $host) => ['93.184.216.34']);

    $fetcher = app(SafeUrlFetcher::class);
    // assertSafe returns void and must NOT throw for a public address.
    $fetcher->assertSafe('https://public.example');
    expect(true)->toBeTrue();

    SafeUrlFetcher::resolveUsing(null);
});

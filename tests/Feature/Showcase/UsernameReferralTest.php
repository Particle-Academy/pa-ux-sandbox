<?php

use App\Models\User;
use App\Services\Mlm\MlmProgram;
use Database\Seeders\FunLabSeeder;
use FancyMlm\Laravel\Models\Member;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

uses(TestCase::class);

beforeEach(function () {
    Cache::flush();
    $this->seed(FunLabSeeder::class);
});

// ── Username settings (profile) ─────────────────────────────────────────

it('claims a username from profile settings, lowercased', function () {
    $user = User::factory()->create();

    $this->actingAs($user)->post('/profile/username', ['username' => 'My-Handle'])
        ->assertRedirect()
        ->assertSessionHasNoErrors();

    expect($user->refresh()->username)->toBe('my-handle');
});

it('rejects malformed usernames', function (string $bad) {
    $user = User::factory()->create();

    $this->actingAs($user)->post('/profile/username', ['username' => $bad])
        ->assertSessionHasErrors('username');

    expect($user->refresh()->username)->toBeNull();
})->with(['ab', '-starts-with-dash', 'has spaces', 'dots.not.ok', 'wäy-too-fancy', str_repeat('a', 31)]);

it('rejects reserved usernames', function () {
    $user = User::factory()->create();

    foreach (['admin', 'join', 'referrals', 'packages', 'login'] as $reserved) {
        $this->actingAs($user)->post('/profile/username', ['username' => $reserved])
            ->assertSessionHasErrors('username');
    }

    expect($user->refresh()->username)->toBeNull();
});

it('enforces case-insensitive uniqueness', function () {
    User::factory()->create(['username' => 'alice']);
    $user = User::factory()->create();

    $this->actingAs($user)->post('/profile/username', ['username' => 'ALICE'])
        ->assertSessionHasErrors('username');

    expect($user->refresh()->username)->toBeNull();
});

it('lets a user change their own username without a false uniqueness clash', function () {
    $user = User::factory()->create(['username' => 'bob']);

    $this->actingAs($user)->post('/profile/username', ['username' => 'Bob'])
        ->assertSessionHasNoErrors();

    expect($user->refresh()->username)->toBe('bob');
});

it('exposes username + a github-based suggestion on the profile page', function () {
    $user = User::factory()->create(['github_username' => 'Cool-Dev']);

    $this->actingAs($user)->get('/profile')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('Profile/Show')
            ->where('username', null)
            ->where('usernameSuggestion', 'cool-dev'));
});

// ── Referrals page branches ─────────────────────────────────────────────

it('shows the set-your-username notice branch when the user has no username', function () {
    $user = User::factory()->create(['username' => null]);

    $this->actingAs($user)->get('/referrals')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('Referrals/Show')
            ->where('referralUrl', null));
});

it('exposes the username-based referral link when set — absolute and server-built', function () {
    $user = User::factory()->create(['username' => 'sharer']);

    // Absolute (server-built) so SSR and the client render the SAME string —
    // deriving it from window.location was a guaranteed hydration mismatch.
    $this->actingAs($user)->get('/referrals')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->where('referralUrl', url('/join/sharer')));
});

// ── /join/{username} attribution flow ───────────────────────────────────

it('renders the invite landing page and stores the referral attribution cookie', function () {
    $referrer = User::factory()->create(['username' => 'ray', 'name' => 'Ray']);

    $this->get('/join/ray')
        ->assertOk()
        ->assertCookie(MlmProgram::REFERRAL_COOKIE, (string) $referrer->getKey())
        ->assertInertia(fn ($page) => $page
            ->component('Referrals/Join')
            ->where('inviter.name', 'Ray')
            ->where('inviter.username', 'ray'));
});

it('serves personalized OG share meta on the invite page', function () {
    User::factory()->create(['username' => 'ray', 'name' => 'Ray']);

    $html = $this->get('/join/ray')->assertOk()->getContent();

    expect($html)
        ->toContain('property="og:title" content="Ray invited you to Fancy UI"')
        ->toContain('property="og:image" content="'.config('app.url').'/og/join/ray.png"')
        ->toContain('property="og:url" content="'.config('app.url').'/join/ray"')
        ->toContain('rel="canonical" href="'.config('app.url').'/join/ray"')
        ->toContain('property="og:image:width" content="1200"')
        ->toContain('property="og:image:height" content="630"')
        ->toContain('name="twitter:card" content="summary_large_image"')
        // Personalized invite pages stay out of search for ordinary requests +
        // search engines (this test's UA is neither a social scraper).
        ->toContain('name="robots" content="noindex, nofollow"');
});

it('serves indexable meta to social card scrapers so the preview image renders', function () {
    User::factory()->create(['username' => 'ray', 'name' => 'Ray']);

    // X/Twitter, Facebook, Slack, … drop the preview IMAGE when a page is
    // noindex. Invite pages are noindex on purpose, so we must hand the unfurl
    // bots indexable meta — otherwise the share card (the page's whole reason
    // to exist) loses its image.
    $html = $this->withHeader('User-Agent', 'Twitterbot/1.0')
        ->get('/join/ray')
        ->assertOk()
        ->getContent();

    expect($html)
        ->not->toContain('noindex')
        // …while still carrying the full personalized card meta.
        ->toContain('property="og:title" content="Ray invited you to Fancy UI"')
        ->toContain('property="og:image" content="'.config('app.url').'/og/join/ray.png"')
        ->toContain('name="twitter:card" content="summary_large_image"');
});

it('keeps invite pages noindex for real search engines', function () {
    User::factory()->create(['username' => 'ray', 'name' => 'Ray']);

    // Googlebot is a search crawler, not a card scraper — the near-duplicate
    // invite URLs must still be kept out of the index.
    expect($this->withHeader('User-Agent', 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)')
        ->get('/join/ray')->getContent())
        ->toContain('name="robots" content="noindex, nofollow"');
});

it('matches join links case-insensitively', function () {
    $referrer = User::factory()->create(['username' => 'ray']);

    $this->get('/join/RAY')
        ->assertOk()
        ->assertCookie(MlmProgram::REFERRAL_COOKIE, (string) $referrer->getKey());

    // The canonical + OG card normalize to the lowercase username.
    expect($this->get('/join/RAY')->getContent())
        ->toContain('rel="canonical" href="'.config('app.url').'/join/ray"')
        ->toContain('/og/join/ray.png');
});

it('serves a personalized 1200x630 PNG invite card', function () {
    Storage::fake('public');
    User::factory()->create(['username' => 'ray', 'name' => 'Ray']);

    $res = $this->get('/og/join/ray.png');

    $res->assertOk();
    expect($res->headers->get('Content-Type'))->toBe('image/png');
    $size = getimagesizefromstring($res->getContent());
    expect($size[0])->toBe(1200)
        ->and($size[1])->toBe(630)
        ->and($size['mime'])->toBe('image/png');
});

it('404s the invite card for unknown usernames', function () {
    $this->get('/og/join/nobody-here.png')->assertNotFound();
});

it('redirects unknown usernames home silently, without a cookie', function () {
    $this->get('/join/nobody-here')
        ->assertRedirect('/')
        ->assertSessionMissing('success')
        ->assertCookieMissing(MlmProgram::REFERRAL_COOKIE);
});

it('sponsors the referred user\'s member under the referrer on first visit', function () {
    $referrer = User::factory()->create(['username' => 'ray']);
    $program = app(MlmProgram::class);
    $referrerMember = $program->memberForUser($referrer);

    $friend = User::factory()->create();

    // Friend clicked /join/ray earlier (cookie), signs in, opens /referrals.
    $this->actingAs($friend)
        ->withCookie(MlmProgram::REFERRAL_COOKIE, (string) $referrer->getKey())
        ->get('/referrals')
        ->assertOk();

    $member = Member::query()->where('user_id', $friend->getKey())->first();
    expect($member)->not->toBeNull();
    expect((int) $member->sponsor_id)->toBe($referrerMember->getKey());
    expect($member->placement_id)->toBeNull();
});

it('auto-creates the referrer\'s member row when they never opened /referrals', function () {
    $referrer = User::factory()->create(['username' => 'ray']);
    $friend = User::factory()->create();

    $this->actingAs($friend)
        ->withCookie(MlmProgram::REFERRAL_COOKIE, (string) $referrer->getKey())
        ->get('/referrals')
        ->assertOk();

    $referrerMember = Member::query()->where('user_id', $referrer->getKey())->first();
    $friendMember = Member::query()->where('user_id', $friend->getKey())->first();
    expect($referrerMember)->not->toBeNull();
    expect((int) $friendMember->sponsor_id)->toBe($referrerMember->getKey());
});

it('never sponsors a user under themselves via their own link', function () {
    $user = User::factory()->create(['username' => 'selfie']);

    $this->actingAs($user)
        ->withCookie(MlmProgram::REFERRAL_COOKIE, (string) $user->getKey())
        ->get('/referrals')
        ->assertOk();

    $member = Member::query()->where('user_id', $user->getKey())->first();
    expect($member->sponsor_id)->toBeNull();
});

it('does not re-sponsor an existing member from a stale attribution cookie', function () {
    $referrer = User::factory()->create(['username' => 'ray']);
    $program = app(MlmProgram::class);
    $referrerMember = $program->memberForUser($referrer);

    $veteran = User::factory()->create();
    $program->memberForUser($veteran); // already in the network as a root

    $this->actingAs($veteran)
        ->withCookie(MlmProgram::REFERRAL_COOKIE, (string) $referrer->getKey())
        ->get('/referrals')
        ->assertOk();

    expect(Member::query()->where('user_id', $veteran->getKey())->first()->sponsor_id)->toBeNull();
});

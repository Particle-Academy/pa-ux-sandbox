<?php

use App\Models\ShowcaseSubmission;
use App\Models\User;
use App\Services\ActiveUserRecorder;
use App\Support\PlayerIdentity;
use Database\Seeders\FunLabSeeder;
use LaravelFunLab\Facades\LFL;
use Tests\TestCase;

uses(TestCase::class);

beforeEach(function () {
    $this->seed(FunLabSeeder::class);
});

/**
 * A purchased cosmetic is only visible where the owner's `cosmetic_slots`
 * travel alongside their name + avatar. Every surface below renders through
 * the one `identity` payload (App\Support\PlayerIdentity ->
 * resources/js/components/PlayerIdentity.tsx), so these tests are what stop a
 * new surface from quietly dropping the slots again.
 */
$slots = ['avatar-frame' => 'gold', 'name-color' => 'rainbow', 'banner' => 'aurora'];

it('builds a complete identity payload from a user', function () use ($slots) {
    $user = User::factory()->create([
        'name' => 'Real Name',
        'github_username' => 'handle',
        'avatar_url' => 'https://example.test/a.png',
        'cosmetic_slots' => $slots,
    ]);

    expect(PlayerIdentity::for($user))->toBe([
        'name' => 'handle',
        'avatarUrl' => 'https://example.test/a.png',
        'cosmetics' => $slots,
    ]);

    // Admin surfaces label people by account name but keep the cosmetics.
    expect(PlayerIdentity::for($user, $user->name)['name'])->toBe('Real Name');
});

it('falls back safely for a missing user or malformed slots', function () {
    expect(PlayerIdentity::for(null))->toBe([
        'name' => 'Anonymous',
        'avatarUrl' => null,
        'cosmetics' => [],
    ]);

    $user = User::factory()->create(['cosmetic_slots' => ['avatar-frame' => ['not', 'a', 'string']]]);

    expect(PlayerIdentity::for($user->fresh())['cosmetics'])->toBe([]);
});

it('shares the signed-in user identity with cosmetics on every page', function () use ($slots) {
    $user = User::factory()->create(['cosmetic_slots' => $slots]);

    $this->actingAs($user)
        ->get('/')
        ->assertInertia(fn ($page) => $page->where('auth.user.identity.cosmetics', $slots));
});

it('sends cosmetics with every leaderboard player', function () use ($slots) {
    $user = User::factory()->create(['name' => 'Shiny', 'cosmetic_slots' => $slots]);
    LFL::award('bridge-xp')->to($user)->amount(500)->save();

    $this->get('/leaderboard')->assertOk()->assertInertia(fn ($page) => $page
        ->where('players.0.identity.name', 'Shiny')
        ->where('players.0.identity.cosmetics', $slots)
    );
});

it('sends cosmetics to the profile page so the banner can render', function () use ($slots) {
    $user = User::factory()->create(['cosmetic_slots' => $slots]);

    $this->actingAs($user)->get('/profile')->assertOk()->assertInertia(fn ($page) => $page
        ->where('profile.identity.cosmetics', $slots)
    );
});

it('snapshots cosmetics onto the live presence row', function () use ($slots) {
    $user = User::factory()->create(['cosmetic_slots' => $slots]);

    app(ActiveUserRecorder::class)->record($user, 'page', 'browsing');

    $this->getJson('/active-users')
        ->assertOk()
        ->assertJsonPath('data.0.identity.cosmetics', $slots);
});

it('sends the inviter cosmetics to the referral landing page', function () use ($slots) {
    User::factory()->create([
        'username' => 'sparkle',
        'name' => 'Sparkle',
        'cosmetic_slots' => $slots,
    ]);

    $this->get('/join/sparkle')->assertOk()->assertInertia(fn ($page) => $page
        ->where('inviter.identity.name', 'Sparkle')
        ->where('inviter.identity.cosmetics', $slots)
    );
});

it('sends cosmetics to the admin user surfaces', function () use ($slots) {
    $admin = User::factory()->create(['is_admin' => true]);
    $player = User::factory()->create(['name' => 'Decorated', 'cosmetic_slots' => $slots]);

    $this->actingAs($admin)->get('/admin/users')->assertOk()->assertInertia(fn ($page) => $page
        ->where('users', fn ($users) => collect($users)
            ->contains(fn ($u) => $u['identity']['name'] === 'Decorated' && $u['identity']['cosmetics'] === $slots))
    );

    $this->actingAs($admin)->get("/admin/users/{$player->id}")->assertOk()->assertInertia(fn ($page) => $page
        ->where('user.identity.cosmetics', $slots)
    );
});

it('sends the site owner cosmetics to the admin site page', function () use ($slots) {
    $admin = User::factory()->create(['is_admin' => true]);
    $owner = User::factory()->create(['name' => 'Owner', 'cosmetic_slots' => $slots]);

    $submission = ShowcaseSubmission::create([
        'user_id' => $owner->id,
        'kind' => 'website',
        'url' => 'https://owned.example',
        'title' => 'Owned Site',
        'status' => 'verified',
    ]);

    $this->actingAs($admin)->get("/admin/sites/{$submission->id}")->assertOk()->assertInertia(fn ($page) => $page
        ->where('owner.identity.name', 'Owner')
        ->where('owner.identity.cosmetics', $slots)
    );
});

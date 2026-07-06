<?php

use App\Models\ShowcaseSubmission;
use App\Models\User;
use Database\Seeders\FunLabSeeder;
use FancyMlm\Laravel\Models\Member;
use Tests\TestCase;

uses(TestCase::class);

beforeEach(function () {
    $this->seed(FunLabSeeder::class);
});

function adminUser(): User
{
    return User::factory()->create(['is_admin' => true]);
}

it('blocks the users index for non-admins', function () {
    $this->actingAs(User::factory()->create(['is_admin' => false]))
        ->get('/admin/users')
        ->assertForbidden();
});

it('lists users for admins', function () {
    $admin = adminUser();
    $other = User::factory()->create(['name' => 'Findable Person']);

    $this->actingAs($admin)->get('/admin/users')
        ->assertOk()
        ->assertSee('Findable Person');
});

it('searches users by name', function () {
    $admin = adminUser();
    User::factory()->create(['name' => 'Zaphod Beeblebrox']);
    User::factory()->create(['name' => 'Arthur Dent']);

    $this->actingAs($admin)->get('/admin/users?q=Zaphod')
        ->assertOk()
        ->assertSee('Zaphod Beeblebrox')
        ->assertDontSee('Arthur Dent');
});

it('shows a user detail page with wallet + xp', function () {
    $admin = adminUser();
    $target = User::factory()->create(['name' => 'Target User']);
    $target->getWallet()->credit(500, 'seed');

    $this->actingAs($admin)->get("/admin/users/{$target->id}")
        ->assertOk()
        ->assertSee('Target User')
        ->assertSee('500');
});

it('grants XP from the admin panel', function () {
    $admin = adminUser();
    $target = User::factory()->create();

    $this->actingAs($admin)
        ->post("/admin/users/{$target->id}/grant-xp", ['metric' => 'bridge-xp', 'amount' => 100])
        ->assertRedirect()
        ->assertSessionHas('success');

    expect($target->getProfile()->fresh()->getXpFor('bridge-xp'))->toBe(100)
        // XP grant also mints coins via the earn pipeline (bridge-xp 0.25)
        ->and($target->coinBalance())->toBe(25);
});

it('credits coins directly from the admin panel', function () {
    $admin = adminUser();
    $target = User::factory()->create();

    $this->actingAs($admin)
        ->post("/admin/users/{$target->id}/grant-coins", ['amount' => 1234, 'reason' => 'contest prize'])
        ->assertRedirect()
        ->assertSessionHas('success');

    expect($target->coinBalance())->toBe(1234);
    $tx = $target->getWallet()->transactions()->first();
    expect($tx->reason)->toBe('contest prize')
        ->and($tx->metadata['source'] ?? null)->toBe('admin-grant');
});

it('grants an achievement from the admin panel', function () {
    $admin = adminUser();
    $target = User::factory()->create();

    $this->actingAs($admin)
        ->post("/admin/users/{$target->id}/grant-achievement", ['achievement' => 'first-pr'])
        ->assertRedirect()
        ->assertSessionHas('success');

    expect($target->hasAchievement('first-pr'))->toBeTrue()
        // achievement bonus (first-pr configured at 100 coins)
        ->and($target->coinBalance())->toBe(100);
});

it('rejects granting an unknown metric', function () {
    $admin = adminUser();
    $target = User::factory()->create();

    $this->actingAs($admin)
        ->post("/admin/users/{$target->id}/grant-xp", ['metric' => 'nope-xp', 'amount' => 10])
        ->assertSessionHasErrors('metric');
});

it('toggles opt-out state', function () {
    $admin = adminUser();
    $target = User::factory()->create();
    expect($target->isOptedIn())->toBeTrue();

    $this->actingAs($admin)->post("/admin/users/{$target->id}/toggle-opt-out")->assertRedirect();

    expect($target->fresh()->isOptedOut())->toBeTrue();
});

it('toggles admin flag for another user', function () {
    $admin = adminUser();
    $target = User::factory()->create(['is_admin' => false]);

    $this->actingAs($admin)->post("/admin/users/{$target->id}/toggle-admin")->assertRedirect();

    expect($target->fresh()->is_admin)->toBeTrue();
});

it('refuses to change your own admin flag', function () {
    $admin = adminUser();

    $this->actingAs($admin)->post("/admin/users/{$admin->id}/toggle-admin")
        ->assertSessionHas('error');

    expect($admin->fresh()->is_admin)->toBeTrue();
});

it('surfaces each user Pro tier + owned-site count on the index', function () {
    $admin = adminUser();
    $owner = User::factory()->create(['name' => 'Site Owner', 'pro_override' => true]);
    ShowcaseSubmission::create([
        'user_id' => $owner->id,
        'kind' => 'website',
        'url' => 'https://owned.example',
        'title' => 'Owned Site',
        'status' => 'verified',
    ]);

    $this->actingAs($admin)->get('/admin/users?q=Site Owner')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('Admin/Users')
            ->where('users.0.name', 'Site Owner')
            ->where('users.0.proSource', 'manual')
            ->where('users.0.sites', 1)
        );
});

it('lists a user owned showcase sites on the detail page', function () {
    $admin = adminUser();
    $owner = User::factory()->create(['name' => 'Builder']);
    $sub = ShowcaseSubmission::create([
        'user_id' => $owner->id,
        'kind' => 'website',
        'url' => 'https://builder.example',
        'title' => 'Builder Site',
        'status' => 'verified',
    ]);

    $this->actingAs($admin)->get("/admin/users/{$owner->id}")
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('Admin/UserShow')
            ->has('ownedSites', 1)
            ->where('ownedSites.0.id', $sub->id)
            ->where('ownedSites.0.label', 'Builder Site')
        );
});

it('lists each user referral sponsor on the index without an N+1', function () {
    $admin = adminUser();
    $sponsorUser = User::factory()->create(['name' => 'Referring Ray']);
    $sponsored = User::factory()->create(['name' => 'Sponsored Sam']);

    $sponsorMember = Member::query()->create([
        'user_id' => $sponsorUser->id, 'tier' => 'bronze', 'active' => true,
    ]);
    Member::query()->create([
        'user_id' => $sponsored->id, 'sponsor_id' => $sponsorMember->getKey(),
        'tier' => 'bronze', 'active' => true,
    ]);

    // The sponsored user's row carries their sponsor's label + admin link id.
    $this->actingAs($admin)->get('/admin/users?q=Sponsored')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('Admin/Users')
            ->has('users', 1)
            ->where('users.0.sponsor.label', 'Referring Ray')
            ->where('users.0.sponsor.userId', $sponsorUser->id));

    // A network root (no sponsor) and a user outside the network both show none.
    $this->actingAs($admin)->get('/admin/users?q=Referring')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->has('users', 1)
            ->where('users.0.sponsor', null));
});

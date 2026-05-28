<?php

use App\Models\User;
use Database\Seeders\FunLabSeeder;
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

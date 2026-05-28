<?php

use App\Models\User;
use Database\Seeders\FunLabSeeder;
use LaravelFunLab\Models\Achievement;
use LaravelFunLab\Models\Prize;
use Tests\TestCase;

uses(TestCase::class);

beforeEach(function () {
    $this->seed(FunLabSeeder::class);
});

function gamificationAdmin(): User
{
    return User::factory()->create(['is_admin' => true]);
}

it('blocks the gamification admin for non-admins', function () {
    $this->actingAs(User::factory()->create(['is_admin' => false]))
        ->get('/admin/gamification')
        ->assertForbidden();
});

it('lists seeded achievements and prizes', function () {
    $this->actingAs(gamificationAdmin())
        ->get('/admin/gamification')
        ->assertOk()
        ->assertSee('first-visit')
        ->assertSee('sandbox-pro');
});

it('creates a new achievement', function () {
    $this->actingAs(gamificationAdmin())
        ->post('/admin/gamification/achievements', [
            'slug' => 'night-owl',
            'name' => 'Night Owl',
            'description' => 'Active after midnight',
            'icon' => 'moon',
            'is_active' => 1,
        ])
        ->assertRedirect(route('admin.gamification.index'));

    $a = Achievement::where('slug', 'night-owl')->firstOrFail();
    expect($a->name)->toBe('Night Owl')->and($a->is_active)->toBeTrue();
});

it('updates an existing achievement', function () {
    $a = Achievement::where('slug', 'first-visit')->firstOrFail();

    $this->actingAs(gamificationAdmin())
        ->put("/admin/gamification/achievements/{$a->id}", [
            'slug' => 'first-visit',
            'name' => 'Renamed Visit',
            'is_active' => 1,
        ])
        ->assertRedirect(route('admin.gamification.index'));

    expect($a->fresh()->name)->toBe('Renamed Visit');
});

it('rejects an invalid achievement slug', function () {
    $this->actingAs(gamificationAdmin())
        ->post('/admin/gamification/achievements', ['slug' => 'Bad Slug', 'name' => 'x'])
        ->assertSessionHasErrors('slug');
});

it('archives an achievement via toggle (keeps the row)', function () {
    $a = Achievement::where('slug', 'first-visit')->firstOrFail();

    $this->actingAs(gamificationAdmin())->post("/admin/gamification/achievements/{$a->id}/toggle")->assertRedirect();

    expect($a->fresh()->is_active)->toBeFalse()
        ->and(Achievement::find($a->id))->not->toBeNull();
});

it('creates a new prize', function () {
    $this->actingAs(gamificationAdmin())
        ->post('/admin/gamification/prizes', [
            'slug' => 'sticker-pack',
            'name' => 'Sticker Pack',
            'type' => 'physical',
            'inventory_quantity' => 50,
            'is_active' => 1,
        ])
        ->assertRedirect(route('admin.gamification.index'));

    $p = Prize::where('slug', 'sticker-pack')->firstOrFail();
    expect($p->type->value)->toBe('physical')->and($p->inventory_quantity)->toBe(50);
});

it('toggles a prize', function () {
    $p = Prize::where('slug', 'sandbox-pro')->firstOrFail();

    $this->actingAs(gamificationAdmin())->post("/admin/gamification/prizes/{$p->id}/toggle")->assertRedirect();

    expect($p->fresh()->is_active)->toBeFalse();
});

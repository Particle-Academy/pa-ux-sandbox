<?php

use App\Models\ShopItem;
use App\Models\User;
use Database\Seeders\ShopSeeder;
use Tests\TestCase;

uses(TestCase::class);

beforeEach(function () {
    $this->seed(ShopSeeder::class);
});

function admin(): User
{
    return User::factory()->create(['is_admin' => true]);
}

it('blocks /admin/shop for non-admins', function () {
    $this->actingAs(User::factory()->create(['is_admin' => false]))
        ->get('/admin/shop')
        ->assertForbidden();
});

it('lists items on /admin/shop for admins', function () {
    $this->actingAs(admin())
        ->get('/admin/shop')
        ->assertOk()
        ->assertSee('Bronze Avatar Frame')
        ->assertSee('Feature Showcase Item (7 days)');
});

it('creates a cosmetic via /admin/shop POST', function () {
    $this->actingAs(admin())
        ->post('/admin/shop', [
            'slug' => 'cosmetic-frame-platinum',
            'name' => 'Platinum Frame',
            'kind' => 'cosmetic',
            'price' => 5000,
            'slot' => 'avatar-frame',
            'value' => 'platinum',
            'active' => 1,
        ])
        ->assertRedirect(route('admin.shop.index'))
        ->assertSessionHas('success');

    $item = ShopItem::where('slug', 'cosmetic-frame-platinum')->firstOrFail();
    expect($item->kind)->toBe('cosmetic')
        ->and($item->price)->toBe(5000)
        ->and($item->metadata)->toBe(['slot' => 'avatar-frame', 'value' => 'platinum']);
});

it('creates a service via /admin/shop POST', function () {
    $this->actingAs(admin())
        ->post('/admin/shop', [
            'slug' => 'service-featured-90d',
            'name' => 'Feature 90 days',
            'kind' => 'service',
            'price' => 8000,
            'service' => 'featured-showcase',
            'duration_days' => 90,
        ])
        ->assertRedirect(route('admin.shop.index'));

    $item = ShopItem::where('slug', 'service-featured-90d')->firstOrFail();
    expect($item->kind)->toBe('service')
        ->and($item->metadata)->toBe(['service' => 'featured-showcase', 'duration_days' => 90]);
});

it('rejects an invalid slug format', function () {
    $this->actingAs(admin())
        ->post('/admin/shop', [
            'slug' => 'Has Spaces',
            'name' => 'Bad',
            'kind' => 'cosmetic',
            'price' => 1,
        ])
        ->assertSessionHasErrors('slug');
});

it('updates an item', function () {
    $item = ShopItem::where('slug', 'cosmetic-frame-bronze')->firstOrFail();

    $this->actingAs(admin())
        ->put("/admin/shop/{$item->id}", [
            'slug' => $item->slug,
            'name' => 'Renamed Bronze',
            'kind' => 'cosmetic',
            'price' => 999,
            'slot' => 'avatar-frame',
            'value' => 'bronze',
            'active' => 1,
        ])
        ->assertRedirect(route('admin.shop.index'));

    $item->refresh();
    expect($item->name)->toBe('Renamed Bronze')->and($item->price)->toBe(999);
});

it('archives via DELETE (flips active=false, keeps row)', function () {
    $item = ShopItem::where('slug', 'cosmetic-frame-bronze')->firstOrFail();

    $this->actingAs(admin())->delete("/admin/shop/{$item->id}")->assertRedirect();

    expect($item->refresh()->active)->toBeFalse();
    expect(ShopItem::find($item->id))->not->toBeNull(); // row preserved
});

it('toggles active state', function () {
    $item = ShopItem::where('slug', 'cosmetic-frame-bronze')->firstOrFail();
    expect($item->active)->toBeTrue();

    $this->actingAs(admin())->post("/admin/shop/{$item->id}/toggle")->assertRedirect();

    expect($item->refresh()->active)->toBeFalse();
});

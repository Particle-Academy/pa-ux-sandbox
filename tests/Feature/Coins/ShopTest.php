<?php

use App\Exceptions\InsufficientFundsException;
use App\Models\ShopItem;
use App\Models\ShowcaseSubmission;
use App\Models\User;
use App\Services\Shop;
use Database\Seeders\FunLabSeeder;
use Database\Seeders\ShopSeeder;
use Tests\TestCase;

uses(TestCase::class);

beforeEach(function () {
    $this->seed(FunLabSeeder::class);
    $this->seed(ShopSeeder::class);
});

it('debits wallet + writes cosmetic_slots on cosmetic purchase', function () {
    $user = User::factory()->create();
    $user->getWallet()->credit(1000, 'seed');

    $item = ShopItem::where('slug', 'cosmetic-frame-bronze')->firstOrFail();
    app(Shop::class)->purchase($user, $item);

    expect($user->refresh()->coinBalance())->toBe(750)
        ->and($user->cosmetic_slots)->toBe(['avatar-frame' => 'bronze']);
});

it('records ShopPurchase frozen at purchase-time price', function () {
    $user = User::factory()->create();
    $user->getWallet()->credit(1000, 'seed');
    $item = ShopItem::where('slug', 'cosmetic-frame-bronze')->firstOrFail();

    $purchase = app(Shop::class)->purchase($user, $item);
    $item->update(['price' => 9999]); // admin changes price later

    expect($purchase->paid_amount)->toBe(250)
        ->and($purchase->shop_item_id)->toBe($item->id)
        ->and($purchase->expires_at)->toBeNull();
});

it('throws InsufficientFundsException when wallet too small', function () {
    $user = User::factory()->create();
    $user->getWallet()->credit(100, 'seed');
    $item = ShopItem::where('slug', 'cosmetic-frame-bronze')->firstOrFail();

    expect(fn () => app(Shop::class)->purchase($user, $item))
        ->toThrow(InsufficientFundsException::class)
        // Effect rollback — slots untouched.
        ->and($user->refresh()->cosmetic_slots)->toBeNull();
});

it('flips featured_until on a featured-showcase purchase', function () {
    $user = User::factory()->create();
    $user->getWallet()->credit(5000, 'seed');
    $submission = ShowcaseSubmission::create([
        'user_id' => $user->id,
        'kind' => 'website',
        'url' => 'https://example.com',
        'title' => 'demo',
        'description' => 'd',
        'status' => 'verified',
    ]);
    $item = ShopItem::where('slug', 'service-featured-showcase-7d')->firstOrFail();

    $purchase = app(Shop::class)->purchase($user, $item, $submission);

    expect($submission->refresh()->featured_until)->not->toBeNull()
        ->and($submission->featured_until->isFuture())->toBeTrue()
        // 7 days +/- a few seconds for the assertion window
        ->and(now()->diffInDays($submission->featured_until))->toBeGreaterThanOrEqual(6)
        ->and($purchase->expires_at)->not->toBeNull();
});

it('stacks featured_until when one is already active', function () {
    $user = User::factory()->create();
    $user->getWallet()->credit(5000, 'seed');
    $submission = ShowcaseSubmission::create([
        'user_id' => $user->id,
        'kind' => 'website',
        'url' => 'https://example.com',
        'title' => 'demo',
        'description' => 'd',
        'status' => 'verified',
        'featured_until' => now()->addDays(3),
    ]);
    $item = ShopItem::where('slug', 'service-featured-showcase-7d')->firstOrFail();

    app(Shop::class)->purchase($user, $item, $submission);

    // Was 3 days, +7 -> ~10 days from now
    expect(now()->diffInDays($submission->refresh()->featured_until))->toBeGreaterThanOrEqual(9);
});

it('rejects buying an inactive item', function () {
    $user = User::factory()->create();
    $user->getWallet()->credit(5000, 'seed');
    $item = ShopItem::where('slug', 'cosmetic-frame-bronze')->firstOrFail();
    $item->update(['active' => false]);

    expect(fn () => app(Shop::class)->purchase($user, $item))->toThrow(RuntimeException::class);
    expect($user->refresh()->coinBalance())->toBe(5000);
});

it('overlays a new cosmetic on top of existing slots', function () {
    $user = User::factory()->create(['cosmetic_slots' => ['name-color' => 'blue']]);
    $user->getWallet()->credit(5000, 'seed');
    $item = ShopItem::where('slug', 'cosmetic-frame-bronze')->firstOrFail();

    app(Shop::class)->purchase($user, $item);

    expect($user->refresh()->cosmetic_slots)->toBe([
        'name-color' => 'blue',
        'avatar-frame' => 'bronze',
    ]);
});

it('GET /shop renders for guests with no balance', function () {
    $this->get('/shop')->assertOk();
});

it('POST /shop/{item}/purchase requires auth', function () {
    $this->post('/shop/cosmetic-frame-bronze/purchase')->assertRedirect('/login');
});

it('POST /shop/{item}/purchase debits the wallet and redirects with flash', function () {
    $user = User::factory()->create();
    $user->getWallet()->credit(1000, 'seed');

    $this->actingAs($user)
        ->post('/shop/cosmetic-frame-bronze/purchase')
        ->assertRedirect()
        ->assertSessionHas('success');

    expect($user->refresh()->coinBalance())->toBe(750);
});

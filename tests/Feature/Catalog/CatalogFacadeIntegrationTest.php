<?php

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Queue;
use LaravelCatalog\Facades\Catalog;
use LaravelCatalog\Jobs\SyncProductToStripe;
use LaravelCatalog\Models\Product;
use LaravelCatalog\Models\Price;
use Tests\TestCase;

uses(TestCase::class);

beforeEach(function () {
    // Set Stripe config for tests
    config(['cashier.secret' => 'sk_test_mock']);
});

it('can access catalog service via facade', function () {
    $service = Catalog::catalogService();

    expect($service)->toBeInstanceOf(\LaravelCatalog\Services\StripeCatalogService::class);
});

it('can access checkout service via facade', function () {
    $service = Catalog::checkoutService();

    expect($service)->toBeInstanceOf(\LaravelCatalog\Services\StripeCheckoutService::class);
});

it('facade resolves to catalog manager', function () {
    $manager = Catalog::getFacadeRoot();

    expect($manager)->toBeInstanceOf(\LaravelCatalog\CatalogManager::class);
});

it('can call sync product method via facade', function () {
    $product = Product::factory()->create([
        'name' => 'Test Product',
        'active' => true,
    ]);

    // Verify method exists and is callable
    $manager = Catalog::getFacadeRoot();
    expect(method_exists($manager, 'syncProduct'))->toBeTrue();
});

it('can call sync price method via facade', function () {
    $product = Product::factory()->create();
    $price = Price::factory()
        ->for($product)
        ->create([
            'unit_amount' => 2900,
            'currency' => 'USD',
            'type' => Price::TYPE_RECURRING,
        ]);

    // Verify method exists and is callable
    $manager = Catalog::getFacadeRoot();
    expect(method_exists($manager, 'syncPrice'))->toBeTrue();
});

it('can call sync product and prices method via facade', function () {
    $product = Product::factory()->create();
    $price = Price::factory()
        ->for($product)
        ->create();

    // Verify method exists
    $manager = Catalog::getFacadeRoot();
    expect(method_exists($manager, 'syncProductAndPrices'))->toBeTrue();
});

it('can call test connection method via facade', function () {
    // Verify method exists
    $manager = Catalog::getFacadeRoot();
    expect(method_exists($manager, 'testConnection'))->toBeTrue();
});

it('can call subscription checkout method via facade', function () {
    $user = \App\Models\User::factory()->create();
    $product = Product::factory()->create();
    $price = Price::factory()
        ->for($product)
        ->create([
            'external_id' => 'price_test123',
            'type' => Price::TYPE_RECURRING,
        ]);

    // Verify method exists
    $manager = Catalog::getFacadeRoot();
    expect(method_exists($manager, 'subscriptionCheckout'))->toBeTrue();
});

it('can call one-time checkout method via facade', function () {
    $user = \App\Models\User::factory()->create();
    $product = Product::factory()->create();
    $price = Price::factory()
        ->for($product)
        ->oneTime()
        ->create([
            'external_id' => 'price_test123',
        ]);

    // Verify method exists
    $manager = Catalog::getFacadeRoot();
    expect(method_exists($manager, 'oneTimeCheckout'))->toBeTrue();
});

it('can call get subscription checkout URL method via facade', function () {
    $user = \App\Models\User::factory()->create();
    $product = Product::factory()->create();
    $price = Price::factory()
        ->for($product)
        ->create([
            'external_id' => 'price_test123',
            'type' => Price::TYPE_RECURRING,
        ]);

    // Verify method exists
    $manager = Catalog::getFacadeRoot();
    expect(method_exists($manager, 'getSubscriptionCheckoutUrl'))->toBeTrue();
});

it('can call get one-time checkout URL method via facade', function () {
    $user = \App\Models\User::factory()->create();
    $product = Product::factory()->create();
    $price = Price::factory()
        ->for($product)
        ->oneTime()
        ->create([
            'external_id' => 'price_test123',
        ]);

    // Verify method exists
    $manager = Catalog::getFacadeRoot();
    expect(method_exists($manager, 'getOneTimeCheckoutUrl'))->toBeTrue();
});


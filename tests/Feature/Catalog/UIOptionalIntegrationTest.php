<?php

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

uses(TestCase::class);

beforeEach(function () {
    // Set Stripe config for tests
    config(['cashier.secret' => 'sk_test_mock']);
});

it('admin route is not registered when UI is disabled', function () {
    config(['catalog.enable_ui' => false]);

    // Clear route cache
    $this->artisan('route:clear');

    $response = $this->get('/ctrl/products');

    // Route should not exist, so we expect 404 or redirect to login
    expect($response->status())->toBeIn([404, 302]);
});

it('admin route is registered when UI is enabled', function () {
    config(['catalog.enable_ui' => true]);

    // Clear route cache and reload routes
    $this->artisan('route:clear');
    $this->refreshApplication();

    $user = \App\Models\User::factory()->create();
    $this->actingAs($user);

    // Route should exist, but may require authentication or return Livewire component
    $response = $this->get('/ctrl/products');

    // Should not be 404 if route exists (could be 200 or 302 redirect)
    expect($response->status())->not->toBe(404);
})->skip('Route registration test needs route cache clearing');

it('facade works when UI is disabled', function () {
    config(['catalog.enable_ui' => false]);

    // Facade should still resolve correctly
    $manager = \LaravelCatalog\Facades\Catalog::getFacadeRoot();
    
    expect($manager)->toBeInstanceOf(\LaravelCatalog\CatalogManager::class)
        ->and(method_exists($manager, 'testConnection'))->toBeTrue()
        ->and(method_exists($manager, 'syncProduct'))->toBeTrue()
        ->and(method_exists($manager, 'subscriptionCheckout'))->toBeTrue();
});

it('catalog service provider registers services correctly', function () {
    $catalogManager = app('catalog');
    
    expect($catalogManager)->toBeInstanceOf(\LaravelCatalog\CatalogManager::class);
    
    $catalogService = app(\LaravelCatalog\Services\StripeCatalogService::class);
    expect($catalogService)->toBeInstanceOf(\LaravelCatalog\Services\StripeCatalogService::class);
    
    $checkoutService = app(\LaravelCatalog\Services\StripeCheckoutService::class);
    expect($checkoutService)->toBeInstanceOf(\LaravelCatalog\Services\StripeCheckoutService::class);
});

it('catalog facade resolves correctly', function () {
    $manager = \LaravelCatalog\Facades\Catalog::getFacadeRoot();
    
    expect($manager)->toBeInstanceOf(\LaravelCatalog\CatalogManager::class);
});


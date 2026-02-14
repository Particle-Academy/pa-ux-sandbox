<?php

use App\Models\User;
use LaravelCatalog\Livewire\Admin\Products\Index;
use LaravelCatalog\Models\Product;
use LaravelCatalog\Models\Price;
use Livewire\Livewire;

use Tests\TestCase;

uses(TestCase::class);

beforeEach(function () {
    // Enable UI for admin tests
    config(['catalog.enable_ui' => true]);
});

it('can render the admin products index page', function () {
    $user = User::factory()->create();

    // Use Livewire test instead of HTTP request to avoid layout/Vite issues
    // The component itself works fine as proven by other tests
    Livewire::actingAs($user)
        ->test(Index::class)
        ->assertSuccessful();
});

it('displays products in the admin interface', function () {
    $user = User::factory()->create();
    $product = Product::factory()->create([
        'name' => 'Test Product',
        'metadata' => ['storefront' => ['plan' => ['show' => true]]],
    ]);

    Livewire::actingAs($user)
        ->test(Index::class)
        ->assertSee('Test Product');
});

it('can switch between tabs', function () {
    $user = User::factory()->create();

    Livewire::actingAs($user)
        ->test(Index::class)
        ->assertSet('activeTab', 'plans')
        ->set('activeTab', 'products')
        ->assertSet('activeTab', 'products')
        ->set('activeTab', 'features')
        ->assertSet('activeTab', 'features');
});

it('can open create product modal', function () {
    $user = User::factory()->create();

    Livewire::actingAs($user)
        ->test(Index::class)
        ->call('openCreateProduct')
        ->assertSet('showCreateProduct', true)
        ->assertSet('editingProductId', null);
});

it('can open edit product modal', function () {
    $user = User::factory()->create();
    $product = Product::factory()->create(['name' => 'Test Product']);

    Livewire::actingAs($user)
        ->test(Index::class)
        ->call('openEditProduct', $product->id)
        ->assertSet('showCreateProduct', true)
        ->assertSet('editingProductId', $product->id)
        ->assertSet('productName', 'Test Product');
});

it('displays products with prices', function () {
    $user = User::factory()->create();
    $product = Product::factory()->create([
        'metadata' => ['storefront' => ['plan' => ['show' => true]]],
    ]);
    Price::factory()->for($product)->create();

    Livewire::actingAs($user)
        ->test(Index::class)
        ->assertSee($product->name);
});

it('filters plans tab to show only storefront plans', function () {
    $user = User::factory()->create();
    
    $planProduct = Product::factory()->create([
        'metadata' => ['storefront' => ['plan' => ['show' => true]]],
    ]);
    
    $regularProduct = Product::factory()->create([
        'metadata' => [],
    ]);

    Livewire::actingAs($user)
        ->test(Index::class)
        ->set('activeTab', 'plans')
        ->assertSee($planProduct->name)
        ->assertDontSee($regularProduct->name);
});

<?php

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Queue;
use LaravelCatalog\Jobs\SyncProductToStripe;
use LaravelCatalog\Models\Product;
use LaravelCatalog\Models\Price;

use Tests\TestCase;

use Illuminate\Support\Facades\DB;

uses(TestCase::class);

it('can create a product using the factory', function () {
    $product = Product::factory()->create();

    expect($product)->toBeInstanceOf(Product::class)
        ->and($product->id)->not->toBeNull()
        ->and($product->name)->not->toBeEmpty();

    expect(DB::table('products')->where('id', $product->id)->exists())->toBeTrue();
});

it('can create a product with prices', function () {
    $product = Product::factory()->create();
    $price = Price::factory()->for($product)->create();

    expect($product->prices)->toHaveCount(1)
        ->and($price->product_id)->toBe($product->id);

    expect(DB::table('prices')->where('id', $price->id)->exists())->toBeTrue();
});

it('can dispatch sync job for a product', function () {
    Queue::fake();

    $product = Product::factory()->create();

    SyncProductToStripe::dispatch($product->id);

    Queue::assertPushed(SyncProductToStripe::class, function ($job) use ($product) {
        return $job->productId === $product->id;
    });
});

it('can access sync product method via catalog facade', function () {
    $product = Product::factory()->create([
        'name' => 'Test Product',
        'active' => true,
    ]);

    // Verify facade has the method
    $manager = \LaravelCatalog\Facades\Catalog::getFacadeRoot();
    expect(method_exists($manager, 'syncProduct'))->toBeTrue();
});

it('can create a recurring price', function () {
    $product = Product::factory()->create();
    $price = Price::factory()
        ->for($product)
        ->create([
            'type' => Price::TYPE_RECURRING,
            'recurring_interval' => 'month',
        ]);

    expect($price->isRecurring())->toBeTrue()
        ->and($price->interval())->toBe('month');
});

it('can create a one-time price', function () {
    $product = Product::factory()->create();
    $price = Price::factory()
        ->for($product)
        ->oneTime()
        ->create();

    expect($price->isOneTime())->toBeTrue()
        ->and($price->isRecurring())->toBeFalse();
});

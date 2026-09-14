<?php

use Database\Factories\Catalog\PriceFactory;
use Database\Factories\Catalog\ProductFactory;
use LaravelCatalog\Models\Price;
use LaravelCatalog\Models\Product;
use Tests\TestCase;

uses(TestCase::class);

/*
 * laravel-catalog's own factories call fake(), which Laravel only defines
 * when fakerphp/faker is installed, and this app does not install it. These
 * are the factories the catalog tests use instead.
 */

it('makes a catalog product', function () {
    $product = ProductFactory::new()->create();

    expect($product)->toBeInstanceOf(Product::class)
        ->and($product->name)->not->toBeEmpty()
        ->and($product->description)->not->toBeEmpty()
        ->and($product->active)->toBeTrue();
});

it('makes a recurring price with its own product', function () {
    $price = PriceFactory::new()->create();

    expect($price)->toBeInstanceOf(Price::class)
        ->and($price->product)->toBeInstanceOf(Product::class)
        ->and($price->unit_amount)->toBeGreaterThanOrEqual(1000)->toBeLessThanOrEqual(50000)
        ->and($price->type)->toBe(Price::TYPE_RECURRING);
});

it('keeps the package factory states', function () {
    expect(PriceFactory::new()->oneTime()->create()->type)->toBe(Price::TYPE_ONE_TIME)
        ->and(PriceFactory::new()->yearly()->create()->recurring_interval)->toBe('year');
});

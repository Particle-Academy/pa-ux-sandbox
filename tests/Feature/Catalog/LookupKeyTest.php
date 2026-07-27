<?php

use Illuminate\Database\UniqueConstraintViolationException;
use Illuminate\Support\Facades\Schema;
use LaravelCatalog\Models\Price;
use LaravelCatalog\Models\Product;
use Tests\TestCase;

uses(TestCase::class);

/**
 * `lookup_key` exists, and works.
 *
 * It did not. The column was in `$fillable` on both models, cast, exposed
 * through a `lookupKey()` accessor and read during Stripe sync — and no
 * migration ever created it, through v0.9.1. Writing threw; reading returned
 * null forever, so every synced product wrote `product_lookup_key => null` into
 * its Stripe metadata without erroring. Reported by GuardCard.net
 * (laravel-catalog#4), fixed in 0.9.2.
 *
 * The test lives here rather than in the package because the package has no
 * test harness, and this app is where its migrations actually run. A schema
 * assertion is the cheap half; the accessor round-trip is the half that would
 * have caught the SILENT failure, which is the one that mattered.
 */
it('has the column on both catalog tables', function () {
    expect(Schema::hasColumn('products', 'lookup_key'))->toBeTrue();
    expect(Schema::hasColumn('prices', 'lookup_key'))->toBeTrue();
});

it('round-trips a product lookup key through the accessor', function () {
    // The silent failure: this used to return null no matter what was stored,
    // and nothing anywhere reported it.
    $product = Product::create(['name' => 'Pro', 'lookup_key' => 'pro-plan']);

    expect($product->fresh()->lookupKey())->toBe('pro-plan');
});

it('round-trips a price lookup key', function () {
    $product = Product::create(['name' => 'Pro']);
    $price = Price::create([
        'product_id' => $product->id,
        'unit_amount' => 2900,
        'currency' => 'USD',
        'lookup_key' => 'pro-monthly',
    ]);

    expect($price->fresh()->lookup_key)->toBe('pro-monthly');
});

it('refuses two products sharing a lookup key', function () {
    // A handle that points at two rows is not a handle, and Stripe enforces the
    // same constraint on its own Price lookup keys — so a conflict surfaces at
    // write time rather than as a sync failure later.
    Product::create(['name' => 'One', 'lookup_key' => 'shared']);

    expect(fn () => Product::create(['name' => 'Two', 'lookup_key' => 'shared']))
        ->toThrow(UniqueConstraintViolationException::class);
});

it('lets the key stay empty, so existing rows need no backfill', function () {
    // Nullable, and NULLs do not collide in a unique index — which is what
    // makes the migration safe to run against an existing 0.9.x install.
    Product::create(['name' => 'A']);
    Product::create(['name' => 'B']);

    expect(Product::whereNull('lookup_key')->count())->toBe(2);
});

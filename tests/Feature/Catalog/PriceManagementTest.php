<?php

use App\Models\User;
use Illuminate\Support\Facades\DB;
use LaravelCatalog\Models\Price;
use LaravelCatalog\Models\Product;
use LaravelCatalog\Services\StripeCheckoutService;

use Tests\TestCase;

uses(TestCase::class);

it('can create multiple prices for a product', function () {
    $product = Product::factory()->create();
    
    $monthlyPrice = Price::factory()
        ->for($product)
        ->create([
            'recurring_interval' => 'month',
            'unit_amount' => 1000,
        ]);
    
    $yearlyPrice = Price::factory()
        ->for($product)
        ->yearly()
        ->create([
            'unit_amount' => 10000,
        ]);

    expect($product->prices)->toHaveCount(2)
        ->and($monthlyPrice->interval())->toBe('month')
        ->and($yearlyPrice->interval())->toBe('year')
        ->and($monthlyPrice->amountCents())->toBe(1000)
        ->and($yearlyPrice->amountCents())->toBe(10000);
});

it('can update price attributes', function () {
    $price = Price::factory()->create([
        'unit_amount' => 1000,
        'active' => true,
    ]);

    $price->update([
        'unit_amount' => 2000,
        'active' => false,
    ]);

    expect($price->fresh()->amountCents())->toBe(2000)
        ->and($price->fresh()->active)->toBeFalse();
});

it('throws exception when creating subscription checkout without Stripe price ID', function () {
    $user = User::factory()->create();
    $price = Price::factory()->create([
        'external_id' => null,
    ]);

    $checkoutService = app(StripeCheckoutService::class);

    expect(fn () => $checkoutService->subscriptionCheckout(
        $user,
        $price,
        'https://example.com/success',
        'https://example.com/cancel'
    ))->toThrow(\InvalidArgumentException::class, 'Price does not have a Stripe price ID');
});

it('throws exception when creating subscription checkout for one-time price', function () {
    $user = User::factory()->create();
    $price = Price::factory()
        ->oneTime()
        ->create([
            'external_id' => 'price_test123',
        ]);

    $checkoutService = app(StripeCheckoutService::class);

    expect(fn () => $checkoutService->subscriptionCheckout(
        $user,
        $price,
        'https://example.com/success',
        'https://example.com/cancel'
    ))->toThrow(\InvalidArgumentException::class, 'Cannot create subscription checkout for a one-time price');
});

it('throws exception when creating one-time checkout for recurring price', function () {
    $user = User::factory()->create();
    $price = Price::factory()->create([
        'external_id' => 'price_test123',
    ]);

    $checkoutService = app(StripeCheckoutService::class);

    expect(fn () => $checkoutService->oneTimeCheckout(
        $user,
        $price,
        1,
        'https://example.com/success',
        'https://example.com/cancel'
    ))->toThrow(\InvalidArgumentException::class, 'Cannot create one-time checkout for a recurring price');
});

it('can create prices with trial periods', function () {
    $price = Price::factory()->create([
        'recurring_trial_period_days' => 14,
    ]);

    expect($price->trialDays())->toBe(14);
});

it('can filter active prices', function () {
    $product = Product::factory()->create();
    
    Price::factory()->for($product)->create(['active' => true]);
    Price::factory()->for($product)->create(['active' => true]);
    Price::factory()->for($product)->create(['active' => false]);

    expect($product->activePrices()->count())->toBe(2);
});

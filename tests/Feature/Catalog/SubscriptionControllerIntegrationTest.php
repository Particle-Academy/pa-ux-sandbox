<?php

use App\Http\Controllers\SubscriptionController;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use LaravelCatalog\Facades\Catalog;
use LaravelCatalog\Models\Product;
use LaravelCatalog\Models\Price;
use Tests\TestCase;

uses(TestCase::class);

beforeEach(function () {
    // Set Stripe config for tests
    config(['cashier.secret' => 'sk_test_mock']);
});

it('subscription controller uses catalog facade', function () {
    $user = User::factory()->create();
    $this->actingAs($user);

    $product = Product::factory()->create();
    $price = Price::factory()
        ->for($product)
        ->create([
            'external_id' => 'price_test123',
            'type' => Price::TYPE_RECURRING,
        ]);

    // Mock the facade
    $checkoutMock = \Mockery::mock(\Laravel\Cashier\Checkout::class);
    $stripeSession = (object) ['url' => 'https://checkout.stripe.com/test'];
    $checkoutMock->shouldReceive('asStripeCheckoutSession')
        ->andReturn($stripeSession);

    Catalog::shouldReceive('subscriptionCheckout')
        ->once()
        ->with(
            \Mockery::on(function ($arg) use ($user) {
                return $arg instanceof \App\Models\User && $arg->id === $user->id;
            }),
            \Mockery::on(function ($arg) use ($price) {
                return $arg instanceof \LaravelCatalog\Models\Price && $arg->id === $price->id;
            }),
            route('subscriptions.success'),
            route('subscriptions.cancel')
        )
        ->andReturn($checkoutMock);

    $response = $this->post(route('subscriptions.create', $price));

    $response->assertRedirect('https://checkout.stripe.com/test');
});

it('subscription controller validates recurring price', function () {
    $user = User::factory()->create();
    $this->actingAs($user);

    $product = Product::factory()->create();
    $price = Price::factory()
        ->for($product)
        ->oneTime()
        ->create();

    $response = $this->post(route('subscriptions.create', $price));

    $response->assertRedirect()
        ->assertSessionHas('error', 'Selected price is not a recurring subscription.');
});

it('subscription controller validates price is synced to stripe', function () {
    $user = User::factory()->create();
    $this->actingAs($user);

    $product = Product::factory()->create();
    $price = Price::factory()
        ->for($product)
        ->create([
            'external_id' => null,
            'type' => Price::TYPE_RECURRING,
        ]);

    $response = $this->post(route('subscriptions.create', $price));

    $response->assertRedirect()
        ->assertSessionHas('error', 'Price has not been synced to Stripe yet.');
});

it('can access subscriptions index', function () {
    $user = User::factory()->create();
    $this->actingAs($user);

    $response = $this->get(route('subscriptions.index'));

    $response->assertOk()
        ->assertViewIs('subscriptions.index');
});

it('can access subscription success page', function () {
    $user = User::factory()->create();
    $this->actingAs($user);

    $response = $this->get(route('subscriptions.success'));

    $response->assertOk()
        ->assertViewIs('subscriptions.success');
});

it('can cancel subscription checkout', function () {
    $user = User::factory()->create();
    $this->actingAs($user);

    $response = $this->get(route('subscriptions.cancel'));

    $response->assertRedirect(route('products.index'))
        ->assertSessionHas('message', 'Subscription checkout was cancelled.');
});


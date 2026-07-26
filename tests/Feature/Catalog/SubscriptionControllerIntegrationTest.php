<?php

use App\Models\User;
use Laravel\Cashier\Checkout;
use LaravelCatalog\Facades\Catalog;
use LaravelCatalog\Models\Price;
use LaravelCatalog\Models\Product;
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
    $checkoutMock = Mockery::mock(Checkout::class);
    $stripeSession = (object) ['url' => 'https://checkout.stripe.com/test'];
    $checkoutMock->shouldReceive('asStripeCheckoutSession')
        ->andReturn($stripeSession);

    Catalog::shouldReceive('subscriptionCheckout')
        ->once()
        ->with(
            Mockery::on(function ($arg) use ($user) {
                return $arg instanceof User && $arg->id === $user->id;
            }),
            Mockery::on(function ($arg) use ($price) {
                return $arg instanceof Price && $arg->id === $price->id;
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

it('renders the Go Pro page for a signed-in user', function () {
    $user = User::factory()->create();
    $this->actingAs($user);

    $this->get(route('subscriptions.index'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('Pro/Index')
            ->has('plans')
            ->has('features')
            ->where('pro.isPro', false)
            ->where('pro.source', null)
        );
});

it('shows the Go Pro page to guests', function () {
    // The pricing IS the pitch. Bouncing a visitor to a login form to read it
    // loses them; only checkout needs an owner.
    $this->get(route('subscriptions.index'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page->component('Pro/Index')->where('pro.isPro', false));
});

it('tells a user who EARNED pro that they already have it', function () {
    // The prize route grants the same features as a subscription. Selling to
    // someone who already qualifies is the fastest way to look broken.
    $user = User::factory()->create(['pro_override' => true]);
    $this->actingAs($user);

    $this->get(route('subscriptions.index'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->where('pro.isPro', true)
            ->where('pro.source', 'manual')
        );
});

it('returns to the Go Pro page after a completed checkout', function () {
    $user = User::factory()->create();
    $this->actingAs($user);

    $this->get(route('subscriptions.success'))
        ->assertRedirect(route('subscriptions.index'))
        ->assertSessionHas('success');
});

it('returns to the Go Pro page after a cancelled checkout', function () {
    $user = User::factory()->create();
    $this->actingAs($user);

    $this->get(route('subscriptions.cancel'))
        ->assertRedirect(route('subscriptions.index'))
        ->assertSessionHas('success', 'Checkout cancelled — nothing was charged.');
});

it('renders the catalog storefront in the site chrome', function () {
    // It used to be a standalone Blade app with its own nav — clicking through
    // from the showcase dropped you into what looked like a different website.
    $this->get(route('products.index'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page->component('Catalog/Storefront')->has('products'));
});

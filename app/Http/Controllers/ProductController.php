<?php

namespace App\Http\Controllers;

use Inertia\Inertia;
use Inertia\Response;
use LaravelCatalog\Models\Price;
use LaravelCatalog\Models\Product;

/**
 * The laravel-catalog demo storefront, preserved at `/catalog-demo` (and
 * `/products`) as a worked example of the package's public side.
 *
 * It renders inside the showcase chrome like every other page. It used to be a
 * standalone Blade app with its own nav bar, left over from when this repo was
 * the package's test harness — clicking through from the showcase dropped you
 * into what looked like a different website.
 */
class ProductController extends Controller
{
    public function index(): Response
    {
        $products = Product::active()
            ->with('activePrices')
            ->orderBy('order')
            ->get()
            ->map(fn (Product $product) => $this->present($product))
            ->values()
            ->all();

        return Inertia::render('Catalog/Storefront', ['products' => $products]);
    }

    public function show(Product $product): Response
    {
        $product->load('activePrices');

        return Inertia::render('Catalog/Product', ['product' => $this->present($product)]);
    }

    /** @return array<string,mixed> */
    private function present(Product $product): array
    {
        return [
            'id' => $product->id,
            'name' => $product->name,
            'description' => $product->description,
            'image' => $product->images[0] ?? null,
            'prices' => $product->activePrices->map(fn (Price $price) => [
                'id' => $price->id,
                'amount' => (int) $price->unit_amount,
                'currency' => $price->currency,
                'recurring' => $price->isRecurring(),
                'interval' => $price->recurring_interval,
                'intervalCount' => (int) ($price->recurring_interval_count ?: 1),
                // Checkout only works once the price exists in Stripe, so the
                // page can say so instead of offering a button that 500s.
                'purchasable' => $price->isRecurring() && $price->stripePriceId() !== null,
            ])->values()->all(),
        ];
    }
}

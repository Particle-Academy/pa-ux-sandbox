<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\ShowcaseSubmission;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;
use Inertia\Response;
use LaravelCatalog\Facades\Catalog;
use LaravelCatalog\Jobs\SyncProductToStripe;
use LaravelCatalog\Models\Price;
use LaravelCatalog\Models\Product;

/**
 * AdminProductsController
 * Created to demonstrate using Catalog facade for product management in a custom admin UI.
 */
class AdminProductsController extends Controller
{
    /**
     * Display a listing of products.
     */
    public function index(): Response
    {
        $products = Product::with(['prices'])
            ->orderBy('order')
            ->orderBy('name')
            ->get()
            ->map(fn (Product $product) => [
                'id' => $product->id,
                'name' => $product->name,
                'description' => $product->description,
                'active' => (bool) $product->active,
                'synced' => $product->external_id !== null,
                'order' => $product->order,
                'prices_count' => $product->prices->count(),
                'prices' => $product->prices->map(fn (Price $price) => [
                    'amount' => (int) $price->unit_amount,
                    'currency' => $price->currency,
                    'type' => $price->type,
                    'interval' => $price->recurring_interval,
                ])->values()->all(),
            ])
            ->values()
            ->all();

        return Inertia::render('Admin/Products', [
            'products' => $products,
            'pending' => ShowcaseSubmission::where('status', 'pending')->count(),
        ]);
    }

    /**
     * Show the form for creating a new product.
     */
    public function create(): Response
    {
        return Inertia::render('Admin/ProductForm', [
            'product' => null,
            'pending' => ShowcaseSubmission::where('status', 'pending')->count(),
        ]);
    }

    /**
     * Store a newly created product.
     */
    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'active' => 'boolean',
            'order' => 'integer|min:0',
        ]);

        $product = Product::create([
            'name' => $validated['name'],
            'description' => $validated['description'] ?? null,
            'active' => $validated['active'] ?? true,
            'order' => $validated['order'] ?? 0,
        ]);

        return redirect()->route('admin.products.index')
            ->with('success', 'Product created successfully.');
    }

    /**
     * Display the specified product.
     */
    public function show(Product $product): Response
    {
        $product->load(['prices']);

        return Inertia::render('Admin/ProductShow', [
            'product' => [
                'id' => $product->id,
                'name' => $product->name,
                'description' => $product->description,
                'active' => (bool) $product->active,
                'order' => (int) $product->order,
                'external_id' => $product->external_id,
                'synced' => $product->external_id !== null,
                'prices' => $product->prices->map(fn (Price $price) => [
                    'id' => $price->id,
                    'amount' => (int) $price->unit_amount,
                    'currency' => $price->currency,
                    'type' => $price->type,
                    'interval' => $price->recurring_interval,
                    'recurring' => $price->isRecurring(),
                    'active' => (bool) $price->active,
                    'external_id' => $price->external_id,
                ])->values()->all(),
            ],
            'pending' => ShowcaseSubmission::where('status', 'pending')->count(),
        ]);
    }

    /**
     * Show the form for editing the specified product.
     */
    public function edit(Product $product): Response
    {
        return Inertia::render('Admin/ProductForm', [
            'product' => [
                'id' => $product->id,
                'name' => $product->name,
                'description' => $product->description,
                'active' => (bool) $product->active,
                'order' => (int) $product->order,
            ],
            'pending' => ShowcaseSubmission::where('status', 'pending')->count(),
        ]);
    }

    /**
     * Update the specified product.
     */
    public function update(Request $request, Product $product): RedirectResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'active' => 'boolean',
            'order' => 'integer|min:0',
        ]);

        $product->update($validated);

        return redirect()->route('admin.products.show', $product)
            ->with('success', 'Product updated successfully.');
    }

    /**
     * Sync product to Stripe using Catalog facade.
     */
    public function sync(Product $product): RedirectResponse
    {
        try {
            Catalog::syncProductAndPrices($product);

            return redirect()->back()
                ->with('success', 'Product synced to Stripe successfully.');
        } catch (\Exception $e) {
            return redirect()->back()
                ->with('error', 'Failed to sync product: '.$e->getMessage());
        }
    }

    /**
     * Queue every synced product for re-sync to Stripe.
     *
     * Why queue? Synchronous syncing of N products against the Stripe API
     * blocks the request thread for the duration of N HTTP calls and surfaces
     * partial-failure state only via flash messages. Dispatching jobs lets
     * the queue retry, gives operators a real audit trail, and keeps the
     * admin response fast.
     */
    public function syncAll(): RedirectResponse
    {
        $products = Product::whereNotNull('external_id')->get();
        $count = $products->count();

        foreach ($products as $product) {
            SyncProductToStripe::dispatch($product);
        }

        Log::info('admin.products.sync_all', [
            'user_id' => Auth::id(),
            'count' => $count,
        ]);

        return redirect()->back()
            ->with('success', "Queued {$count} products for sync to Stripe.");
    }

    /**
     * Remove the specified product from storage.
     */
    public function destroy(Product $product): RedirectResponse
    {
        $product->delete();

        return redirect()->route('admin.products.index')
            ->with('success', 'Product deleted successfully.');
    }
}

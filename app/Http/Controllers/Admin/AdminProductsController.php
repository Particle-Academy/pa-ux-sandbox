<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use LaravelCatalog\Facades\Catalog;
use LaravelCatalog\Models\Product;
use LaravelCatalog\Models\Price;
use LaravelCatalog\Jobs\SyncProductToStripe;

/**
 * AdminProductsController
 * Created to demonstrate using Catalog facade for product management in a custom admin UI.
 */
class AdminProductsController extends Controller
{
    /**
     * Display a listing of products.
     */
    public function index(): \Illuminate\Contracts\View\View
    {
        $products = Product::with(['prices'])
            ->orderBy('order')
            ->orderBy('name')
            ->paginate(20);

        return view('admin.products.index', [
            'products' => $products,
        ]);
    }

    /**
     * Show the form for creating a new product.
     */
    public function create(): \Illuminate\Contracts\View\View
    {
        return view('admin.products.create');
    }

    /**
     * Store a newly created product.
     */
    public function store(Request $request): \Illuminate\Http\RedirectResponse
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
    public function show(Product $product): \Illuminate\Contracts\View\View
    {
        $product->load(['prices']);

        return view('admin.products.show', [
            'product' => $product,
        ]);
    }

    /**
     * Show the form for editing the specified product.
     */
    public function edit(Product $product): \Illuminate\Contracts\View\View
    {
        return view('admin.products.edit', [
            'product' => $product,
        ]);
    }

    /**
     * Update the specified product.
     */
    public function update(Request $request, Product $product): \Illuminate\Http\RedirectResponse
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
    public function sync(Product $product): \Illuminate\Http\RedirectResponse
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
    public function syncAll(): \Illuminate\Http\RedirectResponse
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
    public function destroy(Product $product): \Illuminate\Http\RedirectResponse
    {
        $product->delete();

        return redirect()->route('admin.products.index')
            ->with('success', 'Product deleted successfully.');
    }
}


<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
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
     * Sync all products to Stripe.
     */
    public function syncAll(): \Illuminate\Http\RedirectResponse
    {
        $products = Product::whereNotNull('external_id')->get();
        $synced = 0;
        $errors = [];

        foreach ($products as $product) {
            try {
                Catalog::syncProductAndPrices($product);
                $synced++;
            } catch (\Exception $e) {
                $errors[] = $product->name.': '.$e->getMessage();
            }
        }

        if (empty($errors)) {
            return redirect()->back()
                ->with('success', "Successfully synced {$synced} products to Stripe.");
        }

        return redirect()->back()
            ->with('success', "Synced {$synced} products.")
            ->with('error', 'Some products failed to sync: '.implode(', ', $errors));
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


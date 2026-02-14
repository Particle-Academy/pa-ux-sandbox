<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use LaravelCatalog\Models\Product;

/**
 * ProductController
 * Created to handle storefront product listing and detail pages for testing the Laravel Catalog package.
 */
class ProductController extends Controller
{
    /**
     * Display a listing of active products for the storefront.
     */
    public function index(): \Illuminate\Contracts\View\View
    {
        $products = Product::active()
            ->with(['activePrices'])
            ->orderBy('order')
            ->get();

        return view('products.index', [
            'products' => $products,
        ]);
    }

    /**
     * Display the specified product with its prices.
     */
    public function show(Product $product): \Illuminate\Contracts\View\View
    {
        $product->load(['activePrices']);

        return view('products.show', [
            'product' => $product,
        ]);
    }
}

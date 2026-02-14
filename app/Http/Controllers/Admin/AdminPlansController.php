<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use LaravelCatalog\Facades\Catalog;
use LaravelCatalog\Models\Product;
use LaravelCatalog\Models\Price;

/**
 * AdminPlansController
 * Created to demonstrate using Catalog facade for plan management (recurring products) in a custom admin UI.
 */
class AdminPlansController extends Controller
{
    /**
     * Display a listing of plans (recurring products).
     */
    public function index(): \Illuminate\Contracts\View\View
    {
        // Get products that have recurring prices and are marked for storefront
        $plans = Product::whereHas('prices', function ($query) {
            $query->where('type', Price::TYPE_RECURRING);
        })
        ->whereJsonContains('metadata->storefront->plan->show', true)
        ->with(['prices' => function ($query) {
            $query->where('type', Price::TYPE_RECURRING);
        }])
        ->orderBy('order')
        ->orderBy('name')
        ->paginate(20);

        return view('admin.plans.index', [
            'plans' => $plans,
        ]);
    }

    /**
     * Show the form for creating a new plan.
     */
    public function create(): \Illuminate\Contracts\View\View
    {
        return view('admin.plans.create');
    }

    /**
     * Store a newly created plan.
     */
    public function store(Request $request): \Illuminate\Http\RedirectResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'active' => 'boolean',
            'order' => 'integer|min:0',
            'show_on_storefront' => 'boolean',
            'recommended' => 'boolean',
        ]);

        $metadata = [];
        if ($validated['show_on_storefront'] ?? false) {
            $metadata['storefront']['plan']['show'] = true;
            if ($validated['recommended'] ?? false) {
                $metadata['storefront']['plan']['recommended'] = true;
            }
        }

        $product = Product::create([
            'name' => $validated['name'],
            'description' => $validated['description'] ?? null,
            'active' => $validated['active'] ?? true,
            'order' => $validated['order'] ?? 0,
            'metadata' => $metadata,
        ]);

        return redirect()->route('admin.plans.index')
            ->with('success', 'Plan created successfully.');
    }

    /**
     * Display the specified plan.
     */
    public function show(Product $plan): \Illuminate\Contracts\View\View
    {
        $plan->load(['prices' => function ($query) {
            $query->where('type', Price::TYPE_RECURRING);
        }]);

        return view('admin.plans.show', [
            'plan' => $plan,
        ]);
    }

    /**
     * Show the form for editing the specified plan.
     */
    public function edit(Product $plan): \Illuminate\Contracts\View\View
    {
        return view('admin.plans.edit', [
            'plan' => $plan,
        ]);
    }

    /**
     * Update the specified plan.
     */
    public function update(Request $request, Product $plan): \Illuminate\Http\RedirectResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'active' => 'boolean',
            'order' => 'integer|min:0',
            'show_on_storefront' => 'boolean',
            'recommended' => 'boolean',
        ]);

        $metadata = $plan->metadata ?? [];
        if ($validated['show_on_storefront'] ?? false) {
            $metadata['storefront']['plan']['show'] = true;
            $metadata['storefront']['plan']['recommended'] = ($validated['recommended'] ?? false);
        } else {
            unset($metadata['storefront']['plan']);
        }

        $plan->update([
            'name' => $validated['name'],
            'description' => $validated['description'] ?? null,
            'active' => $validated['active'] ?? true,
            'order' => $validated['order'] ?? 0,
            'metadata' => $metadata,
        ]);

        return redirect()->route('admin.plans.show', $plan)
            ->with('success', 'Plan updated successfully.');
    }

    /**
     * Sync plan to Stripe using Catalog facade.
     */
    public function sync(Product $plan): \Illuminate\Http\RedirectResponse
    {
        try {
            Catalog::syncProductAndPrices($plan);
            
            return redirect()->back()
                ->with('success', 'Plan synced to Stripe successfully.');
        } catch (\Exception $e) {
            return redirect()->back()
                ->with('error', 'Failed to sync plan: '.$e->getMessage());
        }
    }
}


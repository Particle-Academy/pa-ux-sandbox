<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\ShowcaseSubmission;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use LaravelCatalog\Facades\Catalog;
use LaravelCatalog\Models\Price;
use LaravelCatalog\Models\Product;

/**
 * AdminPlansController
 * Created to demonstrate using Catalog facade for plan management (recurring products) in a custom admin UI.
 */
class AdminPlansController extends Controller
{
    /**
     * Display a listing of plans (recurring products).
     */
    public function index(): Response
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
            ->get()
            ->map(function (Product $plan) {
                $metadata = $plan->metadata ?? [];

                return [
                    'id' => $plan->id,
                    'name' => $plan->name,
                    'description' => $plan->description,
                    'active' => (bool) $plan->active,
                    'recommended' => (bool) ($metadata['storefront']['plan']['recommended'] ?? false),
                    'synced' => $plan->external_id !== null,
                    'prices' => $plan->prices->map(fn (Price $price) => [
                        'id' => $price->id,
                        'amount' => (int) $price->unit_amount,
                        'currency' => $price->currency,
                        'interval' => $price->recurring_interval,
                        'interval_count' => $price->recurring_interval_count,
                    ])->values()->all(),
                ];
            })
            ->values()
            ->all();

        return Inertia::render('Admin/Plans', [
            'plans' => $plans,
            'pending' => ShowcaseSubmission::where('status', 'pending')->count(),
        ]);
    }

    /**
     * Show the form for creating a new plan.
     */
    public function create(): Response
    {
        return Inertia::render('Admin/PlanForm', [
            'plan' => null,
            'pending' => ShowcaseSubmission::where('status', 'pending')->count(),
        ]);
    }

    /**
     * Store a newly created plan.
     */
    public function store(Request $request): RedirectResponse
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
    public function show(Product $plan): Response
    {
        $plan->load(['prices' => function ($query) {
            $query->where('type', Price::TYPE_RECURRING);
        }]);

        $metadata = $plan->metadata ?? [];

        return Inertia::render('Admin/PlanShow', [
            'plan' => [
                'id' => $plan->id,
                'name' => $plan->name,
                'description' => $plan->description,
                'active' => (bool) $plan->active,
                'order' => (int) $plan->order,
                'external_id' => $plan->external_id,
                'synced' => $plan->external_id !== null,
                'show_on_storefront' => (bool) ($metadata['storefront']['plan']['show'] ?? false),
                'recommended' => (bool) ($metadata['storefront']['plan']['recommended'] ?? false),
                'prices' => $plan->prices->map(fn (Price $price) => [
                    'id' => $price->id,
                    'amount' => (int) $price->unit_amount,
                    'currency' => $price->currency,
                    'interval' => $price->recurring_interval,
                    'active' => (bool) $price->active,
                    'external_id' => $price->external_id,
                ])->values()->all(),
            ],
            'pending' => ShowcaseSubmission::where('status', 'pending')->count(),
        ]);
    }

    /**
     * Show the form for editing the specified plan.
     */
    public function edit(Product $plan): Response
    {
        $metadata = $plan->metadata ?? [];

        return Inertia::render('Admin/PlanForm', [
            'plan' => [
                'id' => $plan->id,
                'name' => $plan->name,
                'description' => $plan->description,
                'active' => (bool) $plan->active,
                'order' => (int) $plan->order,
                'show_on_storefront' => (bool) ($metadata['storefront']['plan']['show'] ?? false),
                'recommended' => (bool) ($metadata['storefront']['plan']['recommended'] ?? false),
            ],
            'pending' => ShowcaseSubmission::where('status', 'pending')->count(),
        ]);
    }

    /**
     * Update the specified plan.
     */
    public function update(Request $request, Product $plan): RedirectResponse
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
    public function sync(Product $plan): RedirectResponse
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

    /**
     * Delete a plan (a recurring storefront product). Mirrors the products
     * destroy — soft-deletes the underlying Product so it drops off the
     * storefront + admin lists.
     */
    public function destroy(Product $plan): RedirectResponse
    {
        $plan->delete();

        return redirect()->route('admin.plans.index')
            ->with('success', 'Plan deleted successfully.');
    }
}

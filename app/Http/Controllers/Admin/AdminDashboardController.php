<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use LaravelCatalog\Facades\Catalog;
use ParticleAcademy\Fms\Facades\FMS;

/**
 * AdminDashboardController
 * Created to demonstrate using Catalog and FMS facades in a custom admin UI.
 * This shows how applications can build their own admin interface using only the facades.
 */
class AdminDashboardController extends Controller
{
    /**
     * Display the admin dashboard with overview statistics.
     */
    public function index(): \Illuminate\Contracts\View\View
    {
        $stats = [
            'products' => \LaravelCatalog\Models\Product::count(),
            'active_products' => \LaravelCatalog\Models\Product::active()->count(),
            'prices' => \LaravelCatalog\Models\Price::count(),
            'active_prices' => \LaravelCatalog\Models\Price::active()->count(),
            'synced_products' => \LaravelCatalog\Models\Product::whereNotNull('external_id')->count(),
            'stripe_connected' => false,
        ];

        // Test Stripe connection
        try {
            $connectionTest = Catalog::testConnection();
            $stats['stripe_connected'] = $connectionTest['success'] ?? false;
        } catch (\Exception $e) {
            $stats['stripe_connected'] = false;
        }

        // Get enabled features from FMS
        $enabledFeatures = FMS::enabled();

        return view('admin.dashboard', [
            'stats' => $stats,
            'enabledFeatures' => $enabledFeatures,
        ]);
    }
}


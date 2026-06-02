<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Services\GamificationStats;
use Inertia\Inertia;
use Inertia\Response;
use LaravelCatalog\Facades\Catalog;
use LaravelCatalog\Models\Price;
use LaravelCatalog\Models\Product;
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
    public function index(GamificationStats $gamificationStats): Response
    {
        $stats = [
            'products' => Product::count(),
            'active_products' => Product::active()->count(),
            'prices' => Price::count(),
            'active_prices' => Price::active()->count(),
            'synced_products' => Product::whereNotNull('external_id')->count(),
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
        $gamification = $gamificationStats->dashboard();

        return Inertia::render('Admin/Dashboard', [
            'stats' => $stats,
            'enabledFeatures' => array_values($enabledFeatures),
            'gamification' => $gamification,
            'pending' => $gamification['pendingSubmissions'] ?? 0,
        ]);
    }
}

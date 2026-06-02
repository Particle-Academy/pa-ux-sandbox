<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\ShowcaseSubmission;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;
use ParticleAcademy\Fms\Facades\FMS;

/**
 * AdminFeaturesController
 * Created to demonstrate using FMS facade for feature management in a custom admin UI.
 */
class AdminFeaturesController extends Controller
{
    /**
     * Display a listing of features and their status.
     */
    public function index(): Response
    {
        $user = Auth::user();
        $features = config('fms.features', []);

        $featureStatus = [];
        foreach ($features as $key => $definition) {
            $featureStatus[$key] = [
                'definition' => $definition,
                'enabled' => FMS::isEnabled($key, $user),
                'canAccess' => FMS::canAccess($key, $user),
                'remaining' => FMS::remaining($key, $user),
            ];
        }

        return Inertia::render('Admin/Features', [
            'features' => collect($featureStatus)->map(fn ($v, $k) => [
                'key' => $k,
                'name' => $v['definition']['name'] ?? $k,
                'description' => $v['definition']['description'] ?? '',
                'type' => $v['definition']['type'] ?? 'boolean',
                'enabled' => $v['enabled'],
                'remaining' => $v['remaining'],
            ])->values(),
            'pending' => ShowcaseSubmission::where('status', 'pending')->count(),
        ]);
    }

    /**
     * Test feature access for a specific feature.
     */
    public function test(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'feature' => 'required|string',
        ]);

        $user = Auth::user();
        $feature = $validated['feature'];

        $result = [
            'feature' => $feature,
            'enabled' => FMS::isEnabled($feature, $user),
            'canAccess' => FMS::canAccess($feature, $user),
            'remaining' => FMS::remaining($feature, $user),
        ];

        return redirect()->route('admin.features.index')
            ->with('test_result', $result);
    }
}

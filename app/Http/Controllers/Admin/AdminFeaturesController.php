<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use ParticleAcademy\Fms\Facades\FMS;
use Illuminate\Support\Facades\Auth;

/**
 * AdminFeaturesController
 * Created to demonstrate using FMS facade for feature management in a custom admin UI.
 */
class AdminFeaturesController extends Controller
{
    /**
     * Display a listing of features and their status.
     */
    public function index(): \Illuminate\Contracts\View\View
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

        return view('admin.features.index', [
            'featureStatus' => $featureStatus,
            'enabledFeatures' => FMS::enabled($user),
        ]);
    }

    /**
     * Test feature access for a specific feature.
     */
    public function test(Request $request): \Illuminate\Http\RedirectResponse
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


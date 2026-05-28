<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use LaravelFunLab\Models\Achievement;
use LaravelFunLab\Models\Prize;

/**
 * Admin CRUD for the gamification taxonomy that isn't otherwise editable
 * outside the seeder: achievements and prizes. (XP metrics + levels stay
 * seeder-defined — they're structural.) Uses the LFL models' updateOrCreate
 * directly for predictable upserts; archive = is_active=false so existing
 * grants keep their FK.
 */
class AdminGamificationController extends Controller
{
    public function index(): \Illuminate\Contracts\View\View
    {
        return view('admin.gamification.index', [
            'achievements' => Achievement::orderByDesc('is_active')->orderBy('sort_order')->orderBy('name')->get(),
            'prizes' => Prize::orderByDesc('is_active')->orderBy('sort_order')->orderBy('name')->get(),
        ]);
    }

    public function editAchievement(?Achievement $achievement = null): \Illuminate\Contracts\View\View
    {
        return view('admin.gamification.achievement-form', ['achievement' => $achievement]);
    }

    public function saveAchievement(Request $request, ?Achievement $achievement = null): RedirectResponse
    {
        $data = $request->validate([
            'slug' => ['required', 'string', 'max:80', 'regex:/^[a-z0-9\-]+$/',
                $achievement ? "unique:lfl_achievements,slug,{$achievement->id}" : 'unique:lfl_achievements,slug',
            ],
            'name' => 'required|string|max:255',
            'description' => 'nullable|string|max:1000',
            'icon' => 'nullable|string|max:80',
            'is_active' => 'sometimes|boolean',
            'sort_order' => 'sometimes|integer|min:0',
        ]);

        Achievement::updateOrCreate(['slug' => $data['slug']], [
            'name' => $data['name'],
            'description' => $data['description'] ?? null,
            'icon' => $data['icon'] ?? null,
            'is_active' => (bool) ($data['is_active'] ?? true),
            'sort_order' => (int) ($data['sort_order'] ?? 0),
        ]);

        return redirect()->route('admin.gamification.index')->with('success', "Achievement '{$data['slug']}' saved.");
    }

    public function toggleAchievement(Achievement $achievement): RedirectResponse
    {
        $achievement->update(['is_active' => ! $achievement->is_active]);

        return back()->with('success', "Achievement '{$achievement->slug}' ".($achievement->is_active ? 'activated.' : 'archived.'));
    }

    public function editPrize(?Prize $prize = null): \Illuminate\Contracts\View\View
    {
        return view('admin.gamification.prize-form', ['prize' => $prize]);
    }

    public function savePrize(Request $request, ?Prize $prize = null): RedirectResponse
    {
        $data = $request->validate([
            'slug' => ['required', 'string', 'max:80', 'regex:/^[a-z0-9\-]+$/',
                $prize ? "unique:lfl_prizes,slug,{$prize->id}" : 'unique:lfl_prizes,slug',
            ],
            'name' => 'required|string|max:255',
            'description' => 'nullable|string|max:1000',
            'type' => 'required|in:virtual,physical',
            'inventory_quantity' => 'nullable|integer|min:0',
            'is_active' => 'sometimes|boolean',
            'sort_order' => 'sometimes|integer|min:0',
        ]);

        Prize::updateOrCreate(['slug' => $data['slug']], [
            'name' => $data['name'],
            'description' => $data['description'] ?? null,
            'type' => $data['type'],
            'inventory_quantity' => $data['inventory_quantity'] ?? null,
            'is_active' => (bool) ($data['is_active'] ?? true),
            'sort_order' => (int) ($data['sort_order'] ?? 0),
        ]);

        return redirect()->route('admin.gamification.index')->with('success', "Prize '{$data['slug']}' saved.");
    }

    public function togglePrize(Prize $prize): RedirectResponse
    {
        $prize->update(['is_active' => ! $prize->is_active]);

        return back()->with('success', "Prize '{$prize->slug}' ".($prize->is_active ? 'activated.' : 'archived.'));
    }
}

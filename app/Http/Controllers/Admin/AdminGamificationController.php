<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\ShowcaseSubmission;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
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
    public function index(): Response
    {
        $achievements = Achievement::orderByDesc('is_active')->orderBy('sort_order')->orderBy('name')->get()
            ->map(fn (Achievement $a): array => [
                'id' => $a->id,
                'slug' => $a->slug,
                'name' => $a->name,
                'description' => $a->description,
                'icon' => $a->icon,
                'is_active' => (bool) $a->is_active,
                'sort_order' => (int) $a->sort_order,
            ])->all();

        $prizes = Prize::orderByDesc('is_active')->orderBy('sort_order')->orderBy('name')->get()
            ->map(fn (Prize $p): array => [
                'id' => $p->id,
                'slug' => $p->slug,
                'name' => $p->name,
                'description' => $p->description,
                'type' => $p->type->value,
                'cost_in_points' => (int) $p->cost_in_points,
                'inventory_quantity' => $p->inventory_quantity !== null ? (int) $p->inventory_quantity : null,
                'is_active' => (bool) $p->is_active,
                'sort_order' => (int) $p->sort_order,
            ])->all();

        return Inertia::render('Admin/Gamification', [
            'achievements' => $achievements,
            'prizes' => $prizes,
            'pending' => ShowcaseSubmission::where('status', 'pending')->count(),
        ]);
    }

    public function editAchievement(?Achievement $achievement = null): Response
    {
        return Inertia::render('Admin/AchievementForm', [
            'achievement' => $achievement ? [
                'id' => $achievement->id,
                'slug' => $achievement->slug,
                'name' => $achievement->name,
                'description' => $achievement->description,
                'icon' => $achievement->icon,
                'is_active' => (bool) $achievement->is_active,
                'sort_order' => (int) $achievement->sort_order,
            ] : null,
            'pending' => ShowcaseSubmission::where('status', 'pending')->count(),
        ]);
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

    public function editPrize(?Prize $prize = null): Response
    {
        return Inertia::render('Admin/PrizeForm', [
            'prize' => $prize ? [
                'id' => $prize->id,
                'slug' => $prize->slug,
                'name' => $prize->name,
                'description' => $prize->description,
                'type' => $prize->type->value,
                'cost_in_points' => (int) $prize->cost_in_points,
                'inventory_quantity' => $prize->inventory_quantity !== null ? (int) $prize->inventory_quantity : null,
                'is_active' => (bool) $prize->is_active,
                'sort_order' => (int) $prize->sort_order,
            ] : null,
            'pending' => ShowcaseSubmission::where('status', 'pending')->count(),
        ]);
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
            'cost_in_points' => 'required|integer|min:0',
            'inventory_quantity' => 'nullable|integer|min:0',
            'is_active' => 'sometimes|boolean',
            'sort_order' => 'sometimes|integer|min:0',
        ]);

        Prize::updateOrCreate(['slug' => $data['slug']], [
            'name' => $data['name'],
            'description' => $data['description'] ?? null,
            'type' => $data['type'],
            'cost_in_points' => (int) $data['cost_in_points'],
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

<?php

namespace App\Http\Controllers\Showcase;

use App\Http\Controllers\Controller;
use App\Models\DreamArchive;
use App\Support\DreamRegistry;
use Illuminate\Contracts\View\View;

class DreamingController extends Controller
{
    public function index(): View
    {
        $dreams = DreamRegistry::active();
        $tallies = DreamRegistry::tallies();
        $themes = $dreams->pluck('theme')->filter()->unique()->values()->all();

        return view('showcase.dreaming.index', [
            'dreams' => $dreams,
            'tallies' => $tallies,
            'themes' => $themes,
        ]);
    }

    public function archived(): View
    {
        return view('showcase.dreaming.archived', [
            'archives' => DreamArchive::query()->orderByDesc('archived_at')->get(),
        ]);
    }
}

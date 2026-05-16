<?php

namespace App\Http\Controllers\Showcase;

use App\Http\Controllers\Controller;
use App\Models\DreamArchive;
use App\Models\Vote;
use App\Support\DreamRegistry;
use Inertia\Inertia;
use Inertia\Response;

class DreamingController extends Controller
{
    public function index(): Response
    {
        $dreams = DreamRegistry::active();
        $rawTallies = DreamRegistry::tallies();

        // Enrich tallies with the current user's vote per slug.
        $tallies = [];
        foreach ($dreams as $d) {
            $slug = $d['slug'];
            $t = $rawTallies[$slug] ?? ['up' => 0, 'down' => 0];
            $tallies[$slug] = ['up' => $t['up'] ?? 0, 'down' => $t['down'] ?? 0, 'mine' => null];
        }
        if (auth()->check()) {
            $mine = Vote::query()
                ->where('user_id', auth()->id())
                ->where('subject_type', 'dream')
                ->pluck('value', 'subject_slug');
            foreach ($mine as $slug => $value) {
                if (isset($tallies[$slug])) {
                    $tallies[$slug]['mine'] = (int) $value;
                }
            }
        }

        $themes = $dreams->pluck('theme')->filter()->unique()->values()->all();

        return Inertia::render('Dreaming/Index', [
            'dreams' => $dreams->values()->all(),
            'tallies' => $tallies,
            'themes' => $themes,
        ]);
    }

    public function archived(): Response
    {
        return Inertia::render('Dreaming/Archived', [
            'archives' => DreamArchive::query()
                ->orderByDesc('archived_at')
                ->get()
                ->map(fn ($a) => [
                    'id' => $a->id,
                    'slug' => $a->slug,
                    'title' => $a->title,
                    'blurb' => $a->blurb,
                    'pkg' => $a->pkg,
                    'theme' => $a->theme,
                    'up_votes' => $a->up_votes,
                    'down_votes' => $a->down_votes,
                    'reason' => $a->reason,
                    'archived_at' => $a->archived_at?->toIso8601String(),
                ])
                ->all(),
        ]);
    }
}

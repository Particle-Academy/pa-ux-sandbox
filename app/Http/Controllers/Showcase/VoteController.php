<?php

namespace App\Http\Controllers\Showcase;

use App\Http\Controllers\Controller;
use App\Models\Vote;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class VoteController extends Controller
{
    private const ALLOWED_TYPES = ['dream'];

    public function cast(Request $request): JsonResponse
    {
        $data = $request->validate([
            'type' => 'required|string|in:'.implode(',', self::ALLOWED_TYPES),
            'slug' => 'required|string|max:120',
            'value' => 'required|integer|in:-1,0,1',
        ]);

        $userId = (int) $request->user()->id;

        if ($data['value'] === 0) {
            Vote::query()
                ->where('user_id', $userId)
                ->where('subject_type', $data['type'])
                ->where('subject_slug', $data['slug'])
                ->delete();
        } else {
            Vote::query()->updateOrCreate(
                [
                    'user_id' => $userId,
                    'subject_type' => $data['type'],
                    'subject_slug' => $data['slug'],
                ],
                ['value' => $data['value']],
            );

            // dreamer-xp for engaging with the dreaming gallery. Throttled
            // per (user, subject) so toggling a vote can't farm.
            \App\Support\XpAwarder::award(
                user: $request->user(),
                metric: 'dreamer-xp',
                amount: 5,
                reason: "voted on {$data['type']}:{$data['slug']}",
                throttleKey: "vote:{$data['type']}:{$data['slug']}",
                throttleSeconds: 86400,
            );
        }

        return response()->json([
            'ok' => true,
            'tallies' => $this->talliesFor($data['type'], $data['slug']),
        ]);
    }

    public function tallies(Request $request): JsonResponse
    {
        $type = $request->query('type', 'dream');
        $slugs = explode(',', (string) $request->query('slugs', ''));
        $slugs = array_filter(array_map('trim', $slugs));

        $out = [];
        foreach ($slugs as $slug) {
            $out[$slug] = $this->talliesFor($type, $slug);
        }
        return response()->json(['tallies' => $out]);
    }

    /** @return array{up:int,down:int,mine:int|null} */
    private function talliesFor(string $type, string $slug): array
    {
        $up = (int) Vote::query()
            ->where('subject_type', $type)
            ->where('subject_slug', $slug)
            ->where('value', 1)
            ->count();
        $down = (int) Vote::query()
            ->where('subject_type', $type)
            ->where('subject_slug', $slug)
            ->where('value', -1)
            ->count();

        $mine = null;
        if (auth()->check()) {
            $row = Vote::query()
                ->where('user_id', (int) auth()->id())
                ->where('subject_type', $type)
                ->where('subject_slug', $slug)
                ->value('value');
            $mine = $row !== null ? (int) $row : null;
        }

        return ['up' => $up, 'down' => $down, 'mine' => $mine];
    }
}

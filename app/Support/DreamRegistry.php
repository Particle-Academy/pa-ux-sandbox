<?php

namespace App\Support;

use App\Models\DreamArchive;
use App\Models\Vote;
use Illuminate\Support\Collection;

/**
 * The public Dreaming gallery's source of truth for "what dreams exist."
 *
 * On the `dreaming` branch this lives in `resources/js/dreaming/manifest.ts`.
 * On `main` we ship a snapshot at `resources/data/dreams.json` that the
 * dreaming-branch CI regenerates on each push. The PHP layer reads from
 * the JSON snapshot + cross-references the votes table + the
 * `dream_archives` table to decide what to render.
 */
class DreamRegistry
{
    private const ARCHIVE_MIN_VOTES = 3;

    /** @return array<int, array<string, mixed>> */
    public static function all(): array
    {
        $path = resource_path('data/dreams.json');
        if (!is_file($path)) {
            return [];
        }
        $payload = json_decode((string) file_get_contents($path), true);
        return $payload['dreams'] ?? [];
    }

    /** @return Collection<int, array<string, mixed>> */
    public static function active(): Collection
    {
        $archivedSlugs = DreamArchive::query()->pluck('slug')->all();
        return collect(self::all())
            ->reject(fn (array $d) => in_array($d['slug'], $archivedSlugs, true))
            ->values();
    }

    /**
     * Auto-archive any dream whose net votes go negative once total ≥ ARCHIVE_MIN_VOTES.
     * Returns the slugs newly archived.
     *
     * @return array<int, string>
     */
    public static function autoArchive(): array
    {
        $archived = [];
        $tallies = self::tallies(); // [slug => ['up'=>int,'down'=>int]]
        $alreadyArchived = DreamArchive::query()->pluck('slug')->all();

        foreach (self::all() as $dream) {
            $slug = $dream['slug'];
            if (in_array($slug, $alreadyArchived, true)) {
                continue;
            }
            $up = $tallies[$slug]['up'] ?? 0;
            $down = $tallies[$slug]['down'] ?? 0;
            $total = $up + $down;
            if ($total < self::ARCHIVE_MIN_VOTES) {
                continue;
            }
            if ($down <= $up) {
                continue;
            }

            DreamArchive::create([
                'slug' => $slug,
                'title' => $dream['title'] ?? $slug,
                'blurb' => $dream['blurb'] ?? null,
                'pkg' => $dream['pkg'] ?? null,
                'theme' => $dream['theme'] ?? null,
                'up_votes' => $up,
                'down_votes' => $down,
                'reason' => 'auto_negative',
                'archived_at' => now(),
            ]);
            $archived[] = $slug;
        }

        return $archived;
    }

    /** @return array<string, array{up:int,down:int}> */
    public static function tallies(): array
    {
        $rows = Vote::query()
            ->where('subject_type', 'dream')
            ->selectRaw('subject_slug, value, COUNT(*) as c')
            ->groupBy('subject_slug', 'value')
            ->get();

        $out = [];
        foreach ($rows as $row) {
            $slug = $row->subject_slug;
            $out[$slug] = $out[$slug] ?? ['up' => 0, 'down' => 0];
            if ((int) $row->value === 1) {
                $out[$slug]['up'] = (int) $row->c;
            } else {
                $out[$slug]['down'] = (int) $row->c;
            }
        }
        return $out;
    }
}

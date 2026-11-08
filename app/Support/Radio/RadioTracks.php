<?php

declare(strict_types=1);

namespace App\Support\Radio;

use App\Http\Controllers\RadioAudioController;

/**
 * The tracks the showcase radio serves from this server: Thunder in the
 * Garden, owner-approved for public streaming (2026-11-08). Only these three;
 * the files live in resources/radio, outside the web root, and reach a
 * listener only through {@see RadioAudioController}.
 *
 * The client's station list (resources/js/radio/stations.ts) names each by
 * slug; RadioTest fails if the two disagree.
 */
final class RadioTracks
{
    /** @var array<string, string> slug => title (the file name the owner gave it) */
    public const TRACKS = [
        'no-second-life' => 'No Second Life',
        'locked-on' => 'Locked On',
        'run-it-back' => 'Run it Back',
    ];

    /** @return list<string> */
    public static function slugs(): array
    {
        return array_keys(self::TRACKS);
    }

    public static function path(string $slug): ?string
    {
        if (! array_key_exists($slug, self::TRACKS)) {
            return null;
        }

        $path = resource_path("radio/{$slug}.mp3");

        return is_file($path) ? $path : null;
    }
}

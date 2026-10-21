<?php

declare(strict_types=1);

namespace App\Support\Notices;

use App\Support\PackageRegistry;
use Carbon\CarbonImmutable;
use Illuminate\Support\Facades\Cache;
use Throwable;

/**
 * The showcase's "What's new" feed: the groups fancy-whats-new's `load(since)`
 * asks for, newest first.
 *
 * Two sources, both committed files, so a request never touches a registry:
 *
 *   - `resources/notices/releases.json` -- one group per package release (a new
 *     package, or a new version of a listed one). Written by
 *     `php artisan notices:build`, which is the only thing that asks the
 *     registries for publish dates.
 *   - `resources/notices/features.json` -- curated "major feature" notices,
 *     written by hand: `{ id, label, date, cards }`.
 *
 * ## The cursor
 *
 * `<UTC timestamp>~<kind>~<key>`, e.g. `2026-10-21T15:50:30Z~release~react-fancy@5.54.0`.
 * The timestamp is fixed-width, so the cursor sorts as a plain string and
 * "newer than" is a comparison rather than a lookup: a cursor whose group has
 * since been removed still filters correctly, and two groups published in the
 * same second still have a fixed order. fancy-whats-new compares cursors for
 * equality only and stores them as strings, so any string works on its side.
 *
 * Only visible packages are announced: a release of a hidden or unlisted
 * package is dropped here, so the notice never links to a page that 404s.
 */
final class WhatsNewFeed
{
    /** On a first visit fancy-whats-new shows the newest group; it needs only a short list. */
    public const FIRST_VISIT_LIMIT = 10;

    /** Someone who has been away a while gets this many groups at most, newest first. */
    public const MISSED_LIMIT = 30;

    private const CURSOR = '/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z~/';

    private const REGISTRY_LABELS = ['npm' => 'npm', 'composer' => 'Packagist', 'pypi' => 'PyPI'];

    public function __construct(
        private readonly ?string $releasesPath = null,
        private readonly ?string $noticesPath = null,
    ) {}

    /**
     * The groups newer than `$since`, newest first. An unreadable cursor is
     * treated as a first visit (`null`).
     *
     * @return list<array{id: string, label: string, date: string, cards: list<array<string, mixed>>}>
     */
    public function since(?string $since, ?int $limit = null): array
    {
        if ($since !== null && preg_match(self::CURSOR, $since) !== 1) {
            $since = null;
        }

        $groups = $this->all();

        if ($since !== null) {
            $groups = array_values(array_filter($groups, fn (array $g): bool => strcmp($g['id'], $since) > 0));
        }

        return array_slice($groups, 0, $limit ?? ($since === null ? self::FIRST_VISIT_LIMIT : self::MISSED_LIMIT));
    }

    /**
     * Every group, newest first. Cached until either file changes (a deploy).
     *
     * @return list<array{id: string, label: string, date: string, cards: list<array<string, mixed>>}>
     */
    public function all(): array
    {
        $releases = $this->releasesPath ?? resource_path('notices/releases.json');
        $notices = $this->noticesPath ?? resource_path('notices/features.json');

        $key = 'whats-new:'.md5(implode('|', [
            $releases, @filemtime($releases), @filesize($releases),
            $notices, @filemtime($notices), @filesize($notices),
        ]));

        return Cache::remember($key, now()->addDay(), fn (): array => $this->build($releases, $notices));
    }

    /** @return list<array{id: string, label: string, date: string, cards: list<array<string, mixed>>}> */
    private function build(string $releasesPath, string $noticesPath): array
    {
        $packages = collect([...PackageRegistry::all(), ...PackageRegistry::companions()])->keyBy('slug');
        $groups = [];

        foreach ($this->read($releasesPath)['releases'] ?? [] as $release) {
            $pkg = $packages->get($release['slug'] ?? '');
            $at = $this->timestamp($release['published_at'] ?? null);

            if ($pkg === null || $at === null || ! is_string($release['version'] ?? null)) {
                continue;
            }

            $groups[] = $this->releaseGroup($pkg, $release, $at);
        }

        foreach ($this->read($noticesPath) as $notice) {
            $at = $this->timestamp($notice['date'] ?? null);

            if ($at === null || ! is_string($notice['id'] ?? null) || ! is_array($notice['cards'] ?? null)) {
                continue;
            }

            $groups[] = [
                'id' => $at->format('Y-m-d\TH:i:s\Z').'~notice~'.$notice['id'],
                'label' => (string) ($notice['label'] ?? ''),
                'date' => $at->format('M j, Y'),
                'cards' => array_values(array_map($this->card(...), $notice['cards'])),
            ];
        }

        usort($groups, fn (array $a, array $b): int => strcmp($b['id'], $a['id']));

        return $groups;
    }

    /**
     * @param  array<string, mixed>  $pkg
     * @param  array<string, mixed>  $release
     * @return array{id: string, label: string, date: string, cards: list<array<string, mixed>>}
     */
    private function releaseGroup(array $pkg, array $release, CarbonImmutable $at): array
    {
        $first = (bool) ($release['first'] ?? false);
        $version = $release['version'];
        $registry = self::REGISTRY_LABELS[$release['registry'] ?? ''] ?? 'its registry';

        return [
            'id' => $at->format('Y-m-d\TH:i:s\Z').'~release~'.$pkg['slug'].'@'.$version,
            'label' => $first ? 'New package' : 'Release',
            'date' => $at->format('M j, Y'),
            'cards' => [[
                'id' => $pkg['slug'].'@'.$version,
                'title' => $pkg['name'].' '.$version,
                'description' => $first
                    ? (string) ($pkg['tagline'] ?? "New on {$registry}.")
                    : "Version {$version} is on {$registry}.",
                'action' => ['label' => 'View package', 'href' => '/packages/'.$pkg['slug']],
            ]],
        ];
    }

    /**
     * A curated card, passed through with only the fields fancy-whats-new reads.
     *
     * @param  array<string, mixed>  $card
     * @return array<string, mixed>
     */
    private function card(array $card): array
    {
        $out = array_intersect_key($card, array_flip(['id', 'title', 'description', 'image', 'imageDark', 'imageAlt']));

        if (is_string($card['action']['label'] ?? null) && is_string($card['action']['href'] ?? null)) {
            $out['action'] = ['label' => $card['action']['label'], 'href' => $card['action']['href']];
        }

        return $out;
    }

    private function timestamp(mixed $value): ?CarbonImmutable
    {
        if (! is_string($value) || $value === '') {
            return null;
        }

        try {
            return CarbonImmutable::parse($value)->utc();
        } catch (Throwable) {
            return null;
        }
    }

    /** @return array<mixed> */
    private function read(string $path): array
    {
        if (! is_file($path)) {
            return [];
        }

        $data = json_decode((string) file_get_contents($path), true);

        return is_array($data) ? $data : [];
    }
}

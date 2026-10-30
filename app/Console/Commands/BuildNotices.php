<?php

declare(strict_types=1);

namespace App\Console\Commands;

use App\Support\PackageRegistry;
use Carbon\CarbonImmutable;
use Illuminate\Console\Command;
use Illuminate\Http\Client\Pool;
use Illuminate\Http\Client\Response;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Http;
use Throwable;

/**
 * Compile the package releases for the site's "What's new" notice into a
 * committed artifact, resources/notices/releases.json.
 *
 * The app knows which version it installs, but not when any version was
 * published; only the registries know that. This asks them ONCE, here, so the
 * `/whats-new` endpoint never makes a network call. Same arrangement as
 * `registry:build` and `readmes:build`.
 *
 * Run it after dogfooding a release (`WhatsNewArtifactTest` fails until you do),
 * then commit the artifact.
 *
 * What it writes:
 *   - `latest`: every visible package's latest published version, by slug.
 *   - `releases`: each release in the last {@see WINDOW_DAYS} days, newest
 *     first. Prereleases, `0.0.0` bootstrap placeholders and backports (a
 *     version lower than one published before it) are not news and are left
 *     out. `first` marks a package's first real version: a new package.
 *
 * A registry that does not answer FAILS the command and writes nothing. A
 * partial artifact would read as "no releases" for every package it missed.
 */
final class BuildNotices extends Command
{
    protected $signature = 'notices:build
        {--output= : Write here instead of resources/notices/releases.json}
        {--now= : The time the window is measured back from (tests)}
        {--only= : Comma-separated slugs to include (tests)}';

    protected $description = 'Compile package releases (from npm / Packagist / PyPI publish times) into resources/notices/releases.json for the site\'s "What\'s new" notice.';

    private const WINDOW_DAYS = 60;

    public function handle(): int
    {
        $now = CarbonImmutable::parse($this->option('now') ?? 'now')->utc();
        $since = $now->subDays(self::WINDOW_DAYS);
        $only = array_filter(explode(',', (string) $this->option('only')));

        $packages = [];
        foreach ([...PackageRegistry::all(), ...PackageRegistry::companions()] as $pkg) {
            if ($only !== [] && ! in_array($pkg['slug'], $only, true)) {
                continue;
            }

            $source = $this->source($pkg);
            if ($source !== null) {
                $packages[$pkg['slug']] = $source;
            }
        }

        $responses = [];
        foreach (array_chunk($packages, 16, true) as $chunk) {
            $responses += Http::pool(function (Pool $pool) use ($chunk): array {
                $requests = [];
                foreach ($chunk as $slug => [, , $url]) {
                    $requests[] = $pool->as($slug)->timeout(30)->get($url);
                }

                return $requests;
            });
        }

        $latest = [];
        $releases = [];
        $failed = [];

        foreach ($packages as $slug => [$registry, $name]) {
            $response = $responses[$slug] ?? null;

            if (! $response instanceof Response) {
                $failed[] = "{$slug}: no answer";

                continue;
            }
            if ($response->status() === 404) {
                continue;   // not published: nothing to announce
            }
            if (! $response->successful() || ! is_array($response->json())) {
                $failed[] = "{$slug}: {$registry} answered {$response->status()}";

                continue;
            }

            [$newest, $times, $listed] = $this->versions($registry, $name, $response->json());
            if ($newest === null && $listed > 0) {
                // Versions exist but none is a release (prism-acp: alphas only).
                // That is an answer, not a failed lookup: like the 404 above,
                // there is nothing stable to announce yet.
                continue;
            }
            if ($newest === null) {
                $failed[] = "{$slug}: {$registry} gave no latest version";

                continue;
            }

            $latest[$slug] = $newest;
            foreach ($this->news($times) as $version => [$at, $first]) {
                if ($at->greaterThanOrEqualTo($since) && $at->lessThanOrEqualTo($now)) {
                    $releases[] = [
                        'slug' => $slug,
                        'registry' => $registry,
                        'version' => $version,
                        'published_at' => $at->format('Y-m-d\TH:i:s\Z'),
                        'first' => $first,
                    ];
                }
            }
        }

        if ($failed !== []) {
            $this->error('Registry lookups failed; nothing written:');
            foreach ($failed as $line) {
                $this->line('  '.$line);
            }

            return self::FAILURE;
        }

        ksort($latest);
        usort($releases, fn (array $a, array $b): int => [$b['published_at'], $a['slug']] <=> [$a['published_at'], $b['slug']]);

        $path = $this->option('output') ?: resource_path('notices/releases.json');
        File::ensureDirectoryExists(dirname($path));
        File::put($path, json_encode([
            'window_days' => self::WINDOW_DAYS,
            'latest' => $latest,
            'releases' => $releases,
        ], JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES)."\n");

        $this->info(count($packages).' packages asked, '.count($latest).' published, '
            .count($releases).' releases in the last '.self::WINDOW_DAYS." days -> {$path}");
        $this->line('Commit the artifact so the site\'s "What\'s new" notice includes them.');

        return self::SUCCESS;
    }

    /**
     * Where a package publishes, as kit:status decides it: npm, then Packagist, then PyPI.
     *
     * @param  array<string, mixed>  $pkg
     * @return array{0: string, 1: string, 2: string}|null [registry, name, url]
     */
    private function source(array $pkg): ?array
    {
        if (is_string($name = $pkg['npm'] ?? null)) {
            return ['npm', $name, 'https://registry.npmjs.org/'.str_replace('/', '%2F', $name)];
        }
        if (is_string($name = $pkg['composer'] ?? null)) {
            return ['composer', $name, "https://repo.packagist.org/p2/{$name}.json"];
        }
        if (is_string($name = $pkg['pypi'] ?? null)) {
            return ['pypi', $name, "https://pypi.org/pypi/{$name}/json"];
        }

        return null;
    }

    /**
     * The latest version, and every version's publish time.
     *
     * @param  array<string, mixed>  $body
     * @return array{0: ?string, 1: array<string, CarbonImmutable>, 2: int} 2 = versions listed, stable or not
     */
    private function versions(string $registry, string $name, array $body): array
    {
        $raw = [];
        $latest = null;

        if ($registry === 'npm') {
            $latest = $body['dist-tags']['latest'] ?? null;
            foreach ((array) ($body['time'] ?? []) as $version => $at) {
                $raw[(string) $version] = $at;
            }
        } elseif ($registry === 'composer') {
            foreach ((array) ($body['packages'][$name] ?? []) as $release) {
                if (is_array($release) && is_string($release['version'] ?? null)) {
                    $raw[$release['version']] = $release['time'] ?? null;
                }
            }
            $latest = array_key_first(array_filter($raw, fn ($at, $v) => $this->isRelease(ltrim((string) $v, 'v')), ARRAY_FILTER_USE_BOTH));
        } elseif ($registry === 'pypi') {
            $latest = $body['info']['version'] ?? null;
            foreach ((array) ($body['releases'] ?? []) as $version => $files) {
                $raw[(string) $version] = $files[0]['upload_time_iso_8601'] ?? null;
            }
        }

        $times = [];
        foreach ($raw as $version => $at) {
            $version = ltrim((string) $version, 'v');
            if (! $this->isRelease($version) || ! is_string($at)) {
                continue;
            }
            try {
                $times[$version] = CarbonImmutable::parse($at)->utc();
            } catch (Throwable) {
                continue;
            }
        }

        return [is_string($latest) ? ltrim($latest, 'v') : null, $times, count($raw)];
    }

    /**
     * Which versions are news: in publish order, each one higher than every
     * version before it. `first` is the package's first real version.
     *
     * @param  array<string, CarbonImmutable>  $times
     * @return array<string, array{0: CarbonImmutable, 1: bool}>
     */
    private function news(array $times): array
    {
        uasort($times, fn (CarbonImmutable $a, CarbonImmutable $b): int => $a <=> $b);

        $news = [];
        $highest = null;
        foreach ($times as $version => $at) {
            if ($highest !== null && version_compare($version, $highest, '<=')) {
                continue;   // a backport onto an older line
            }
            $news[$version] = [$at, $highest === null];
            $highest = $version;
        }

        return $news;
    }

    /** A plain X.Y.Z release: no prerelease, no dev branch, not the 0.0.0 bootstrap placeholder. */
    private function isRelease(string $version): bool
    {
        return preg_match('/^\d+\.\d+\.\d+$/', $version) === 1 && $version !== '0.0.0';
    }
}

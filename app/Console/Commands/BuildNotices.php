<?php

declare(strict_types=1);

namespace App\Console\Commands;

use App\Support\Notices\ChangelogSummary;
use App\Support\PackageRegistry;
use App\Support\Registry\ReadmeSource;
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
 *     `summary` is the one line {@see ChangelogSummary} derives from that
 *     version's section of the package's own CHANGELOG.md, or null.
 *
 * Changelogs are read from the sibling repos, so this runs in the `.agi`
 * workspace, as `readmes:build` does. With no repos on disk it refuses, because
 * a rebuild there would blank every summary. It prints how many releases got one
 * and why the rest did not, since a repo that is missing here is only a null.
 *
 * A repo that is not in this envelope (the prism-* family lives in another
 * estate, and this workspace never reads another workspace's files) has its
 * CHANGELOG.md fetched from its public GitHub repo at the release tag instead,
 * using the registry's `repo`. A repo on disk is always read from disk first. A
 * failed fetch is a reason, never a failed build. `--no-remote` turns it off.
 *
 * A registry that does not answer FAILS the command and writes nothing. A
 * partial artifact would read as "no releases" for every package it missed.
 */
final class BuildNotices extends Command
{
    protected $signature = 'notices:build
        {--output= : Write here instead of resources/notices/releases.json}
        {--now= : The time the window is measured back from (tests)}
        {--only= : Comma-separated slugs to include (tests)}
        {--repos= : Read changelogs from this directory of repos instead of the siblings (tests)}
        {--no-remote : Never fetch from GitHub (changelog or release); a repo not on disk gets no summary (offline builds)}';

    protected $description = 'Compile package releases (from npm / Packagist / PyPI publish times) into resources/notices/releases.json for the site\'s "What\'s new" notice.';

    private const WINDOW_DAYS = 60;

    /** An `owner/repo` GitHub slug, as `PackageRegistry` records it. */
    private const REPO_SLUG = '#^[A-Za-z0-9-]+/[A-Za-z0-9_.-]+$#';

    private const FROM_CHANGELOG_AT_TAG = 'changelog at tag';

    private const FROM_RELEASE = 'release notes';

    /** How long the cache keeps a summary, and a definite miss (a 404 can become a release). */
    private const CACHE_HIT_DAYS = 30;

    private const CACHE_MISS_DAYS = 1;

    /** Bump when what counts as a summary changes, so cached misses are asked again. */
    private const CACHE_RULES = 3;

    /** How many non-title lines of release notes may hold the summary. */
    private const RELEASE_LINES = 3;

    /**
     * Remote answers for this build, by `owner/repo@version`: each asked once.
     *
     * @var array<string, array{0: ?string, 1: ?string, 2: ?string}>
     */
    private array $fetched = [];

    /** @var array<string, mixed> the gitignored cache, as loaded */
    private array $cache = [];

    /** GitHub said "rate limited": nothing more is fetched this build. */
    private bool $rateLimited = false;

    public function handle(ReadmeSource $readmes): int
    {
        $now = CarbonImmutable::parse($this->option('now') ?? 'now')->utc();
        $since = $now->subDays(self::WINDOW_DAYS);
        $only = array_filter(explode(',', (string) $this->option('only')));

        $repos = $this->option('repos') ?: null;

        $packages = [];
        $records = [];
        foreach ([...PackageRegistry::all(), ...PackageRegistry::companions()] as $pkg) {
            if ($only !== [] && ! in_array($pkg['slug'], $only, true)) {
                continue;
            }

            $source = $this->source($pkg);
            if ($source !== null) {
                $packages[$pkg['slug']] = $source;
                $records[$pkg['slug']] = $pkg;
            }
        }

        $repoDirs = array_map(fn (array $pkg): ?string => $readmes->repoDir($pkg['slug'], $pkg, $repos), $records);

        if (array_filter($repoDirs) === []) {
            $this->error(
                'No package repos found on disk, so every release would lose its summary. '
                .'Run this in the .agi workspace where the sibling repos exist; nothing written.'
            );

            return self::FAILURE;
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
        $missing = [];
        $sources = [];

        // Per build: the command object outlives one run when called in-process.
        $this->fetched = [];
        $this->rateLimited = false;
        $this->loadCache();

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
                    [$summary, $why, $from] = $this->summary($repoDirs[$slug], $records[$slug]['repo'] ?? null, $version);
                    if ($why !== null) {
                        $missing[$why][] = "{$slug}@{$version}";
                    }
                    if ($from !== null) {
                        $sources[$from] = ($sources[$from] ?? 0) + 1;
                    }

                    $releases[] = [
                        'slug' => $slug,
                        'registry' => $registry,
                        'version' => $version,
                        'published_at' => $at->format('Y-m-d\TH:i:s\Z'),
                        'first' => $first,
                        'summary' => $summary,
                    ];
                }
            }
        }

        $this->saveCache();

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
        ], JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR)."\n");

        $this->info(count($packages).' packages asked, '.count($latest).' published, '
            .count($releases).' releases in the last '.self::WINDOW_DAYS." days -> {$path}");
        $this->reportSummaries($releases, $missing, $sources);
        $this->line('Commit the artifact so the site\'s "What\'s new" notice includes them.');

        return self::SUCCESS;
    }

    /**
     * The release's summary, or null and why there is none.
     *
     * Sources, in order: the repo on disk; for a repo that is not, its
     * CHANGELOG.md at the release tag; then the first line of the GitHub Release
     * at that tag. The third element names the source a summary came from.
     *
     * @return array{0: ?string, 1: ?string, 2: ?string} [summary, why it is missing, source]
     */
    private function summary(?string $repoDir, mixed $repo, string $version): array
    {
        if ($repoDir !== null) {
            $path = "{$repoDir}/CHANGELOG.md";
            if (! is_file($path)) {
                return [null, 'no CHANGELOG.md', null];
            }

            [$summary, $why] = $this->fromChangelog((string) file_get_contents($path), $version);

            return [$summary, $why, $summary !== null ? 'local changelog' : null];
        }

        if ($this->option('no-remote') || ! is_string($repo) || preg_match(self::REPO_SLUG, $repo) !== 1 || str_contains($repo, '..')) {
            return [null, 'no repo on disk', null];
        }

        $key = "{$repo}@{$version}";
        if (array_key_exists($key, $this->fetched)) {
            return $this->fetched[$key];
        }
        if (($cached = $this->cached($key)) !== null) {
            return $this->fetched[$key] = $cached;
        }

        $why = [];

        [$markdown, $failure] = $this->remoteChangelog($repo, $version);
        if ($markdown !== null) {
            [$summary, $failure] = $this->fromChangelog($markdown, $version);
            if ($summary !== null) {
                return $this->remember($key, [$summary, null, self::FROM_CHANGELOG_AT_TAG]);
            }
            $failure = "changelog at tag: {$failure}";
        }
        $why[] = $failure;

        [$lines, $failure] = $this->releaseLines($repo, $version);
        if ($lines !== null) {
            foreach ($lines as $line) {
                $summary = ChangelogSummary::forLine($line);
                if ($summary !== null) {
                    return $this->remember($key, [$summary, null, self::FROM_RELEASE]);
                }
            }
            $failure = 'release has no usable first line';
        }
        $why[] = $failure;

        return $this->remember($key, [null, implode('; ', array_unique($why)), null]);
    }

    /**
     * @return array{0: ?string, 1: ?string} [summary, why it is missing]
     */
    private function fromChangelog(string $markdown, string $version): array
    {
        $summary = ChangelogSummary::forVersion($markdown, $version);

        if ($summary !== null) {
            return [$summary, null];
        }

        return [null, ChangelogSummary::hasSection($markdown, $version) ? 'no usable entry' : 'no section for that version'];
    }

    /**
     * The CHANGELOG.md of a repo that is not on disk, from its public GitHub repo
     * at the release tag (`v1.2.3`, then `1.2.3`), or null and why.
     *
     * The text is hostile: it is read no further than
     * {@see ChangelogSummary::MAX_CHANGELOG_BYTES} and only ever parsed into
     * text. Nothing that goes wrong here fails the build.
     *
     * @return array{0: ?string, 1: string} [markdown, why it is missing]
     */
    private function remoteChangelog(string $repo, string $version): array
    {
        foreach (["v{$version}", $version] as $tag) {
            if ($this->rateLimited) {
                return [null, 'rate limited'];
            }

            try {
                $response = Http::withOptions(['stream' => true])
                    ->connectTimeout(5)
                    ->timeout(10)
                    ->get("https://raw.githubusercontent.com/{$repo}/{$tag}/CHANGELOG.md");

                if ($response->status() === 404) {
                    continue;
                }
                if ($this->isRateLimit($response)) {
                    return [null, 'rate limited'];
                }
                if (! $response->successful()) {
                    return [null, 'changelog fetch failed'];
                }

                return [$this->capped($response), ''];
            } catch (Throwable) {
                return [null, 'changelog fetch failed'];
            }
        }

        return [null, 'changelog not found at tag'];
    }

    /**
     * The opening lines of the GitHub Release at tag `v<version>`, or null and
     * why. Prism keeps its notes there and leads them with the summary line; a
     * title line (`prism-acp 0.24.1`) is skipped, and the caller passes over a
     * consumer note ("No breaking changes."), but no further than
     * {@see RELEASE_LINES} lines in: deeper than that is detail, not a summary.
     *
     * Uses `GITHUB_TOKEN` when the environment has one (never printed). A 403 or
     * 429 that is a rate limit stops every GitHub fetch for the rest of the build.
     *
     * @return array{0: ?list<string>, 1: string} [lines, why they are missing]
     */
    private function releaseLines(string $repo, string $version): array
    {
        if ($this->rateLimited) {
            return [null, 'rate limited'];
        }

        try {
            $request = Http::withOptions(['stream' => true])
                ->connectTimeout(5)
                ->timeout(10)
                ->withHeaders(['Accept' => 'application/vnd.github+json', 'X-GitHub-Api-Version' => '2022-11-28']);

            $token = config('services.github.notices_token');
            if (is_string($token) && $token !== '') {
                $request = $request->withToken($token);
            }

            $response = $request->get("https://api.github.com/repos/{$repo}/releases/tags/v{$version}");

            if ($response->status() === 404) {
                return [null, 'no release at tag'];
            }
            if ($this->isRateLimit($response)) {
                return [null, 'rate limited'];
            }
            if (! $response->successful()) {
                return [null, 'release fetch failed'];
            }

            $release = json_decode($this->capped($response), true);
        } catch (Throwable) {
            return [null, 'release fetch failed'];
        }

        $body = is_array($release) ? ($release['body'] ?? null) : null;
        if (! is_string($body)) {
            return [null, is_array($release) ? 'release has no usable first line' : 'release fetch failed'];
        }

        $lines = [];
        foreach (preg_split('/\r\n|\n|\r/', $body) ?: [] as $line) {
            if (trim($line) !== '' && ! ChangelogSummary::isReleaseTitle($line, $version)) {
                $lines[] = $line;
            }
            if (count($lines) === self::RELEASE_LINES) {
                break;
            }
        }

        return $lines === [] ? [null, 'release has no usable first line'] : [$lines, ''];
    }

    /** A rate-limit answer, which marks the rest of the build as rate limited. */
    private function isRateLimit(Response $response): bool
    {
        $limited = $response->status() === 429
            || ($response->status() === 403 && ($response->header('x-ratelimit-remaining') === '0' || $response->header('retry-after') !== ''));

        if ($limited) {
            $this->rateLimited = true;
        }

        return $limited;
    }

    /**
     * A previous build's answer for `owner/repo@version`, from the gitignored
     * cache: a summary for {@see CACHE_HIT_DAYS}, a definite miss for
     * {@see CACHE_MISS_DAYS}. A failed or rate-limited fetch is never cached.
     *
     * @return array{0: ?string, 1: ?string, 2: ?string}|null
     */
    private function cached(string $key): ?array
    {
        $entry = $this->cache[$key] ?? null;
        if (! is_array($entry) || ! is_string($entry['at'] ?? null)) {
            return null;
        }

        try {
            $at = CarbonImmutable::parse($entry['at']);
        } catch (Throwable) {
            return null;
        }

        // A summary is re-checked against today's rules; a miss from older rules
        // might not be a miss now, so it is asked again.
        $version = substr($key, (int) strrpos($key, '@') + 1);
        $summary = $entry['summary'] ?? null;
        if (is_string($summary) && in_array($entry['source'] ?? null, [self::FROM_CHANGELOG_AT_TAG, self::FROM_RELEASE], true)
            && mb_strlen($summary) <= ChangelogSummary::MAX_LENGTH
            && ! ChangelogSummary::isReleaseTitle($summary, $version)
            && ChangelogSummary::forLine($summary) !== null
            && $at->greaterThan(CarbonImmutable::now()->subDays(self::CACHE_HIT_DAYS))) {
            return [$summary, null, $entry['source']];
        }

        if ($summary === null && is_string($entry['why'] ?? null)
            && ($entry['rules'] ?? null) === self::CACHE_RULES
            && $at->greaterThan(CarbonImmutable::now()->subDays(self::CACHE_MISS_DAYS))) {
            return [null, $entry['why'], null];
        }

        return null;
    }

    /**
     * Keep an answer for the rest of this build, and in the cache unless it was a
     * failure that might not happen next time.
     *
     * @param  array{0: ?string, 1: ?string, 2: ?string}  $answer
     * @return array{0: ?string, 1: ?string, 2: ?string}
     */
    private function remember(string $key, array $answer): array
    {
        [$summary, $why, $source] = $answer;

        if ($why === null || (! str_contains($why, 'fetch failed') && ! str_contains($why, 'rate limited'))) {
            $this->cache[$key] = [
                'summary' => $summary,
                'source' => $source,
                'why' => $why,
                'rules' => self::CACHE_RULES,
                'at' => CarbonImmutable::now()->utc()->format('Y-m-d\TH:i:s\Z'),
            ];
        }

        return $this->fetched[$key] = $answer;
    }

    private function loadCache(): void
    {
        $path = (string) config('services.github.notices_cache');
        $this->cache = [];

        if ($this->option('no-remote') || $path === '' || ! is_file($path)) {
            return;
        }

        $decoded = json_decode((string) file_get_contents($path), true);
        $this->cache = is_array($decoded) ? $decoded : [];
    }

    private function saveCache(): void
    {
        $path = (string) config('services.github.notices_cache');

        if ($this->option('no-remote') || $path === '' || $this->cache === []) {
            return;
        }

        ksort($this->cache);
        File::ensureDirectoryExists(dirname($path));
        File::put($path, json_encode($this->cache, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE)."\n");
    }

    /** At most {@see ChangelogSummary::MAX_CHANGELOG_BYTES} of the body: the rest is never read. */
    private function capped(Response $response): string
    {
        $body = $response->toPsrResponse()->getBody();
        $text = '';

        if ($body->isSeekable()) {
            $body->rewind();
        }

        while (! $body->eof() && strlen($text) < ChangelogSummary::MAX_CHANGELOG_BYTES) {
            $chunk = $body->read(ChangelogSummary::MAX_CHANGELOG_BYTES - strlen($text));
            if ($chunk === '') {
                break;
            }
            $text .= $chunk;
        }

        return $text;
    }

    /**
     * @param  list<array<string, mixed>>  $releases
     * @param  array<string, list<string>>  $missing  why => releases
     * @param  array<string, int>  $sources  where the summaries came from
     */
    private function reportSummaries(array $releases, array $missing, array $sources): void
    {
        $with = count(array_filter($releases, fn (array $r): bool => $r['summary'] !== null));

        $this->info("{$with} of ".count($releases).' releases have a summary.');

        if ($sources !== []) {
            ksort($sources);
            $this->line('  from: '.implode(', ', array_map(fn (string $from, int $n): string => "{$from} {$n}", array_keys($sources), $sources)));
        }

        ksort($missing);
        foreach ($missing as $why => $list) {
            $this->warn('  '.$why.' ('.count($list).'): '.implode(', ', $list));
        }
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

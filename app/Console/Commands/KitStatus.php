<?php

declare(strict_types=1);

namespace App\Console\Commands;

use App\Support\PackageRegistry;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Http;

/**
 * Release status for every package in the kit, in one screen.
 *
 * ## Why this exists
 *
 * `fancy-trading` was designed in full and then one of its seven packages was
 * built. The other six were never started, never cancelled, and — this is the
 * part that matters — **never visible anywhere**. A package that does not exist
 * appears in no registry, no repo list and no listing, so nothing could report
 * it. It surfaced months later because someone asked what had happened to it.
 *
 * The same blind spot runs the other way. `PackageRegistry::HIDDEN` once held
 * four slugs on the grounds they were unpublished; every one had shipped, so
 * four live packages were invisible to the site, the docs and the MCP. Hiding
 * was keyed on a CLAIM about a registry, and nothing re-checked the claim.
 *
 * This command re-checks the claim. It reads the same {@see PackageRegistry}
 * the MCP and `/packages` read — there is no second list to drift.
 *
 * ## What it will not do
 *
 * **A failed lookup is never reported as fine.** It is `UNKNOWN` and it exits
 * non-zero, for the same reason `kit:dogfood` fails a lookup rather than
 * counting it as current: a network blip that reads as "published" is worse than
 * no check, because it is a check people trust.
 */
final class KitStatus extends Command
{
    protected $signature = 'kit:status
        {--json : Machine-readable output}
        {--only= : Filter to one state: published|ahead|unpublished|planned|unknown}';

    protected $description = 'Release status for every kit package: published, unpublished updates, unpublished, or planned.';

    private const PUBLISHED = 'published';

    private const AHEAD = 'ahead';

    private const UNPUBLISHED = 'unpublished';

    private const PLANNED = 'planned';

    private const UNKNOWN = 'unknown';

    public function handle(): int
    {
        $rows = [];

        // BOTH lists, and HIDDEN ones INCLUDED -- `everything()` is the featured
        // set plus the companions before the visibility filter runs.
        //
        // Two ways to under-report, and both have happened. Checking only the
        // featured set would cover under half the kit while reporting a clean
        // run. And reading the PUBLIC accessors would drop every hidden slug --
        // which is precisely how a built-but-unpublished package is marked, so
        // the command would go quiet about the exact state it exists to report.
        foreach (PackageRegistry::everything() as $pkg) {
            $rows[] = $this->inspect($pkg);
        }

        foreach (PackageRegistry::planned() as $pkg) {
            $rows[] = [
                'slug' => $pkg['slug'],
                'name' => $pkg['name'],
                'state' => self::PLANNED,
                'published' => null,
                'local' => null,
                'note' => $pkg['why'],
            ];
        }

        usort($rows, fn (array $a, array $b) => [$a['state'], $a['slug']] <=> [$b['state'], $b['slug']]);

        if ($only = $this->option('only')) {
            $rows = array_values(array_filter($rows, fn (array $r) => $r['state'] === $only));
        }

        if ($this->option('json')) {
            $this->line((string) json_encode($rows, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES));
        } else {
            $this->render($rows);
        }

        // Non-zero on anything that needs a person: an unpublished update is a
        // package whose consumers cannot get a fix that exists, and an UNKNOWN
        // is a check that did not happen.
        $needsAttention = array_filter(
            $rows,
            fn (array $r) => in_array($r['state'], [self::AHEAD, self::UNKNOWN], true),
        );

        return $needsAttention === [] ? self::SUCCESS : self::FAILURE;
    }

    /**
     * @param  array<string,mixed>  $pkg
     * @return array<string,mixed>
     */
    private function inspect(array $pkg): array
    {
        $slug = (string) $pkg['slug'];
        [$name, $published] = $this->publishedVersion($pkg);
        $local = $this->localVersion($slug);

        $state = match (true) {
            $name === null => self::UNPUBLISHED,   // nothing to publish to
            $published === self::UNKNOWN => self::UNKNOWN,
            $published === null => self::UNPUBLISHED,
            $local === null => self::PUBLISHED,    // cannot compare; say so in the note
            version_compare($local, $published, '>') => self::AHEAD,
            default => self::PUBLISHED,
        };

        return [
            'slug' => $slug,
            'name' => $name ?? $slug,
            'state' => $state,
            'published' => $published === self::UNKNOWN ? null : $published,
            'local' => $local,
            'note' => $this->note($state, $local, $published),
        ];
    }

    private function note(string $state, ?string $local, ?string $published): string
    {
        return match ($state) {
            self::AHEAD => "local {$local} is ahead of published {$published} — tag and push",
            self::UNPUBLISHED => 'no release on any registry',
            self::UNKNOWN => 'registry lookup FAILED — this is not a pass',
            self::PUBLISHED => $local === null
                ? 'published; local checkout absent so no ahead/behind comparison was made'
                : 'up to date',
            default => '',
        };
    }

    /**
     * The registry this package publishes to, and its latest version there.
     *
     * @param  array<string,mixed>  $pkg
     * @return array{0: ?string, 1: ?string} [name, version|null|'unknown']
     */
    private function publishedVersion(array $pkg): array
    {
        if ($name = $pkg['npm'] ?? null) {
            return [$name, $this->fromNpm($name)];
        }
        if ($name = $pkg['composer'] ?? null) {
            return [$name, $this->fromPackagist($name)];
        }
        if ($name = $pkg['pypi'] ?? null) {
            return [$name, $this->fromPyPI($name)];
        }

        return [null, null];
    }

    /** The version in the local submodule checkout, if the envelope has one. */
    private function localVersion(string $slug): ?string
    {
        foreach (["../{$slug}/package.json", "../{$slug}/composer.json"] as $path) {
            if (! is_file($path)) {
                continue;
            }
            $json = json_decode((string) file_get_contents($path), true);
            if (is_array($json) && isset($json['version']) && is_string($json['version'])) {
                return ltrim($json['version'], 'v');
            }
        }

        // pyproject.toml has no JSON to read; a regex is enough for `version = "x"`.
        $py = "../{$slug}/pyproject.toml";
        if (is_file($py) && preg_match('/^version\s*=\s*"([^"]+)"/m', (string) file_get_contents($py), $m)) {
            return $m[1];
        }

        return null;
    }

    private function fromNpm(string $name): ?string
    {
        return $this->lookup(
            'https://registry.npmjs.org/'.str_replace('/', '%2F', $name),
            fn (array $body) => $body['dist-tags']['latest'] ?? null,
        );
    }

    private function fromPackagist(string $name): ?string
    {
        return $this->lookup(
            "https://repo.packagist.org/p2/{$name}.json",
            fn (array $body) => $body['packages'][$name][0]['version'] ?? null,
        );
    }

    private function fromPyPI(string $name): ?string
    {
        return $this->lookup(
            "https://pypi.org/pypi/{$name}/json",
            fn (array $body) => $body['info']['version'] ?? null,
        );
    }

    /**
     * A 404 means "not published". Anything else that is not a success means
     * "we do not know" — and that is deliberately NOT the same answer.
     */
    private function lookup(string $url, callable $pick): ?string
    {
        try {
            $response = Http::timeout(20)->get($url);

            if ($response->status() === 404) {
                return null;
            }
            if (! $response->successful()) {
                return self::UNKNOWN;
            }

            $version = $pick($response->json() ?? []);

            return is_string($version) ? ltrim($version, 'v') : null;
        } catch (\Throwable) {
            return self::UNKNOWN;
        }
    }

    /** @param list<array<string,mixed>> $rows */
    private function render(array $rows): void
    {
        $label = [
            self::PUBLISHED => '<fg=green>PUBLISHED</>',
            self::AHEAD => '<fg=yellow;options=bold>UNPUBLISHED UPDATE</>',
            self::UNPUBLISHED => '<fg=red>UNPUBLISHED</>',
            self::PLANNED => '<fg=blue>PLANNED</>',
            self::UNKNOWN => '<fg=magenta;options=bold>UNKNOWN</>',
        ];

        $counts = array_count_values(array_column($rows, 'state'));

        $this->newLine();
        foreach ($rows as $r) {
            $this->line(sprintf(
                '  %s  %s  %s',
                str_pad($label[$r['state']] ?? $r['state'], 34),
                str_pad($r['slug'], 30),
                "<fg=gray>{$r['note']}</>",
            ));
        }

        $this->newLine();
        foreach ([self::PUBLISHED, self::AHEAD, self::UNPUBLISHED, self::PLANNED, self::UNKNOWN] as $state) {
            $this->line(sprintf('  %-20s %d', $state, $counts[$state] ?? 0));
        }
        $this->newLine();
    }
}

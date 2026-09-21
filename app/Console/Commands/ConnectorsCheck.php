<?php

namespace App\Console\Commands;

use App\Support\Registry\ConnectorSource;
use Illuminate\Console\Command;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Support\Facades\Http;

/**
 * Verify every package the connector index claims actually resolves.
 *
 * ## Why this exists rather than a pull
 *
 * The index is GENERATED somewhere else and pushed here. That is the right
 * split — the generator is the only thing that can see the provider manifests —
 * but it leaves one failure this repo owns: a version moves, nobody re-sends
 * the file, and the catalogue keeps advertising a version that is no longer
 * current. Nothing goes red, because a stale file parses exactly like a fresh
 * one.
 *
 * A pull cannot fix it. The generator's workspace is private, so nothing here
 * can fetch it, and a fetch that fails open is worse than a stale file because
 * it looks like it succeeded.
 *
 * But the CLAIM is checkable without it. Every version in the file resolves
 * against a public registry, which is exactly what `kit:dogfood` does for
 * first-party packages — and that command exists because the showcase drifted
 * twenty-five packages behind, `holy-sheet` a full major, while every surface
 * reported fine. Staleness has to be a red build rather than something someone
 * remembers.
 *
 * ## The two rules that make it trustworthy
 *
 * 1. **A failed lookup FAILS the check.** It is never counted as current. A
 *    network blip that reads as "published" is worse than no check at all,
 *    because it is a check people trust. `kit:dogfood` states the same rule and
 *    for the same reason.
 * 2. **Ask the per-VERSION endpoint, never the packument.** npm's
 *    `/<name>` and Packagist's `packages/<name>.json` answer 200 for a package
 *    whose requested version does not exist, and PyPI's project page does the
 *    same. Asking the wrong endpoint turns this into a check that a package
 *    exists — which it does — rather than that the claimed version does.
 */
class ConnectorsCheck extends Command
{
    protected $signature = 'connectors:check {--json : Machine-readable output}';

    protected $description = 'Verify every package version in the connector index resolves on its registry';

    public function handle(ConnectorSource $connectors): int
    {
        $rows = [];
        $behind = 0;
        $unknown = 0;

        foreach ($connectors->connectors() as $connector) {
            foreach ((array) ($connector['packages'] ?? []) as $package) {
                if (! is_array($package) || ! is_string($package['name'] ?? null)) {
                    continue;
                }

                $state = $this->resolve(
                    (string) $package['registry'],
                    (string) $package['name'],
                    (string) $package['version'],
                );

                $rows[] = [
                    'service' => (string) $connector['service'],
                    'package' => $package['name'],
                    'version' => $package['version'],
                    'registry' => $package['registry'],
                    'state' => $state,
                ];

                $behind += (int) ($state === 'MISSING');
                $unknown += (int) ($state === 'UNKNOWN');
            }
        }

        if ($this->option('json')) {
            $this->line((string) json_encode([
                'checked' => count($rows),
                'missing' => $behind,
                'unknown' => $unknown,
                'packages' => $rows,
            ], JSON_PRETTY_PRINT));
        } else {
            $this->render($rows, $behind, $unknown);
        }

        $short = $this->completeness($connectors);

        // UNKNOWN fails alongside MISSING. "I could not tell" quietly meaning
        // "fine" is the exact shape this command exists to remove.
        return ($behind + $unknown + count($short)) === 0 ? self::SUCCESS : self::FAILURE;
    }

    /**
     * Whether one package resolves at one version.
     *
     * Returns `UNKNOWN` rather than throwing so that a single unreachable
     * registry does not hide the state of the other fifty-nine packages — but
     * `UNKNOWN` still fails the command.
     */
    private function resolve(string $registry, string $name, string $version): string
    {
        if ($version === '') {
            return 'UNKNOWN';
        }

        try {
            return match ($registry) {
                'npm' => $this->npm($name, $version),
                'pypi' => $this->pypi($name, $version),
                'packagist' => $this->packagist($name, $version),
                default => 'UNKNOWN',
            };
        } catch (ConnectionException) {
            return 'UNKNOWN';
        }
    }

    private function npm(string $name, string $version): string
    {
        // The scope separator must be encoded; the version segment is what
        // makes this a version check rather than a package check.
        $path = str_replace('/', '%2f', $name)."/{$version}";

        return $this->verdict(Http::timeout(20)->get("https://registry.npmjs.org/{$path}")->status());
    }

    private function pypi(string $name, string $version): string
    {
        return $this->verdict(Http::timeout(20)->get("https://pypi.org/pypi/{$name}/{$version}/json")->status());
    }

    /**
     * Packagist has no per-version endpoint, so `p2` is read and the version
     * looked for inside it.
     *
     * `p2/<name>.json` answers 200 for a package carrying no versions at all,
     * so a status check alone would pass a package that has never released.
     * Tags may or may not carry a `v` prefix, and both spellings mean the same
     * release.
     */
    private function packagist(string $name, string $version): string
    {
        $response = Http::timeout(20)->get("https://repo.packagist.org/p2/{$name}.json");

        if ($response->status() === 404) {
            return 'MISSING';
        }

        if (! $response->successful()) {
            return 'UNKNOWN';
        }

        $versions = array_column((array) ($response->json("packages.{$name}") ?? []), 'version');

        return in_array($version, $versions, true) || in_array("v{$version}", $versions, true)
            ? 'OK'
            : 'MISSING';
    }

    /**
     * Is the index SHORT — has a connector been published that it never got?
     *
     * The check above asks whether everything listed resolves. It cannot ask
     * whether the list is complete, so a connector that was never added is
     * invisible to it permanently. That gap is not hypothetical: this file's own
     * history records the index going stale twice, "pointing consumers at
     * pre-fix builds while every check stayed green", and `zoom` shipped on
     * 2026-09-21 and sat unlisted while this command reported all 100 packages
     * fine. It surfaced only because the catalogue's author mentioned the count
     * in a message. Nothing polled, nothing compared.
     *
     * The class docblock rules out PULLING the generator's index, and rightly —
     * its workspace is private. This asks a different question that needs no
     * access to it: **which connectors exist on the public registries?**
     *
     * Enumeration comes from Packagist's vendor listing, which is complete and
     * uncapped. npm's search endpoint is not usable here: it reported a total of
     * 2417 and returned 250, so a candidate could be missing from the answer
     * rather than from the registry.
     *
     * A candidate is a connector only if the whole QUARTET is published —
     * `<slug>-ui` and `<slug>-js` on npm, `<slug>-php` on Packagist, and
     * `fancy-<slug>` on PyPI. That is the shape the catalogue emits, so it needs
     * no guess about naming. It matters: `particle-academy/fancy-flow-php` and
     * `teachers-aid-ui` both look like connectors under any single-suffix rule
     * and are not, and both were checked — neither has the other three.
     *
     * @return list<string> slugs published as connectors but absent from the index
     */
    private function completeness(ConnectorSource $connectors): array
    {
        // Keyed on the Packagist package NAME, not on a slug.
        //
        // The index carries three near-identities per connector — `service`
        // (`amazon_ses`), `slug` (`amazon-ses`), and the package name
        // (`particle-academy/amazon-ses-php`). Comparing a listing against the
        // wrong one reports every multi-word connector as missing, and the two
        // spellings agree for `buffer`, `discord`, `gmail`, `stripe` and a dozen
        // others, so a spot-check passes. Matching the package name against
        // itself removes the question rather than answering it carefully.
        $known = [];

        foreach ($connectors->connectors() as $connector) {
            $name = $connector['packages']['php']['name'] ?? null;

            if (is_string($name) && $name !== '') {
                $known[] = $name;
            }
        }

        try {
            $response = Http::timeout(30)->get('https://packagist.org/packages/list.json', [
                'vendor' => 'particle-academy',
            ]);
        } catch (ConnectionException) {
            $this->error('Could not reach Packagist, so the index could not be checked for completeness.');
            $this->line('That is a FAILURE, not a pass: an unanswered question is not a clean answer.');

            return ['<unreachable>'];
        }

        $names = (array) ($response->json('packageNames') ?? []);

        // A listing that comes back empty means the question was not answered,
        // whatever the status code said. Reporting "nothing missing" from it
        // would be the vacuous pass this whole command exists to refuse.
        if ($names === []) {
            $this->error('Packagist returned no packages for the vendor, which cannot be right.');
            $this->line('Treating an empty listing as "nothing missing" is how a check starts asserting nothing.');

            return ['<empty-listing>'];
        }

        $short = [];

        foreach ($names as $name) {
            if (! is_string($name) || ! str_ends_with($name, '-php') || in_array($name, $known, true)) {
                continue;
            }

            $slug = substr(explode('/', $name, 2)[1] ?? '', 0, -4);

            if ($slug === '') {
                continue;
            }

            $verdict = $this->isConnectorQuartet($slug);

            // `null` is "could not tell", and it must FAIL rather than resolve
            // to "not a connector". Reading an unreachable registry as absence
            // would make a network blip look like a complete index — rule 1 of
            // this command, applied to the question it did not used to ask.
            if ($verdict === null) {
                $this->error("Could not determine whether {$slug} is a published connector.");
                $short[] = $slug.' (unreachable)';

                continue;
            }

            if ($verdict) {
                $short[] = $slug;
            }
        }

        if ($short !== []) {
            $this->newLine();
            $this->error(sprintf(
                '%d connector(s) are published but missing from the index: %s',
                count($short),
                implode(', ', $short),
            ));
            $this->line('The index is SHORT, not wrong — every package it lists still resolves.');
            $this->line('Ask the connector catalogue for a regenerated index and refresh it here.');
        }

        return $short;
    }

    /**
     * Does every package of the connector quartet exist for this slug?
     *
     * Only the three the index does not already imply are asked for; the
     * Packagist half is what produced the candidate.
     *
     * Returns `null` for "could not tell", which the caller FAILS on. Collapsing
     * an unreachable registry into `false` would report a blip as a complete
     * index, and a check that reassures on failure is worse than no check.
     */
    private function isConnectorQuartet(string $slug): ?bool
    {
        $probes = [
            'https://registry.npmjs.org/@particle-academy%2f'.$slug.'-ui',
            'https://registry.npmjs.org/@particle-academy%2f'.$slug.'-js',
            'https://pypi.org/pypi/fancy-'.$slug.'/json',
        ];

        foreach ($probes as $url) {
            try {
                $status = Http::timeout(20)->get($url)->status();
            } catch (ConnectionException) {
                return null;
            }

            if ($status === 404) {
                return false;
            }

            if ($status < 200 || $status >= 300) {
                return null;
            }
        }

        return true;
    }

    /** A 404 is a real answer; anything else unexpected is not an answer at all. */
    private function verdict(int $status): string
    {
        return match (true) {
            $status === 404 => 'MISSING',
            $status >= 200 && $status < 300 => 'OK',
            default => 'UNKNOWN',
        };
    }

    /** @param  list<array<string,mixed>>  $rows */
    private function render(array $rows, int $missing, int $unknown): void
    {
        foreach ($rows as $row) {
            if ($row['state'] === 'OK') {
                continue;
            }

            $this->line(sprintf(
                '  <fg=red>%-8s</> %s@%s (%s)',
                $row['state'],
                $row['package'],
                $row['version'],
                $row['registry'],
            ));
        }

        $checked = count($rows);

        if ($missing + $unknown === 0) {
            $this->info("All {$checked} connector packages resolve at the version the index claims.");

            return;
        }

        $this->newLine();
        $this->error("{$missing} package(s) do not resolve and {$unknown} could not be checked, out of {$checked}.");
        $this->line('An unreachable registry FAILS this check rather than counting as current — a blip that');
        $this->line('reads as "published" is worse than no check, because it is a check people trust.');
        $this->line('Ask the connector catalogue for a regenerated index.');
    }
}

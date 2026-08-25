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

        // UNKNOWN fails alongside MISSING. "I could not tell" quietly meaning
        // "fine" is the exact shape this command exists to remove.
        return ($behind + $unknown) === 0 ? self::SUCCESS : self::FAILURE;
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

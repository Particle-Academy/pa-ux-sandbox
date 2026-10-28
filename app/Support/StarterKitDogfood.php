<?php

declare(strict_types=1);

namespace App\Support;

use App\Support\Registry\PackageVersions;
use Illuminate\Http\Client\StrayRequestException;
use Illuminate\Support\Facades\Http;

/**
 * Does the Laravel starter kit's COMMITTED lockfile carry the latest release of
 * every first-party package?
 *
 * ## Why this exists
 *
 * `laravel new my-app --using=particle-academy/fancy-starter-kit` installs from
 * the kit's committed `package-lock.json` and `composer.lock`. A stale lockfile
 * therefore hands every new user an old release, and nothing reports it: the
 * app builds, the pages render, and the user is simply behind from their first
 * commit. `kit:dogfood` checks what the SHOWCASE installs; nothing checked the
 * kit, and on 2026-10-27 it carried react-fancy 5.65.0 against 5.71.0 on npm --
 * six releases behind a rule that already said "same session".
 *
 * ## What it reads
 *
 * The lockfiles on GitHub `main`, not a local checkout: `main` is what the next
 * tag ships, and a checkout is whatever someone last pulled. Every
 * `@particle-academy/*` entry in the npm lockfile is checked, NESTED copies
 * included -- a second copy under a dependent is code the app runs, and keying
 * by name alone would hide it behind a current top-level copy. From
 * `composer.lock`, every `particle-academy/*` in `packages` and `packages-dev`.
 *
 * ## What it will not do
 *
 * **A failed lookup is never fine.** A lockfile that cannot be fetched or is not
 * the JSON it should be, a registry 5xx, a thrown transport error, and a
 * registry 404 for a locked package are each UNKNOWN and fail the run. So does
 * an npm lockfile naming no first-party package at all: the kit IS react-fancy,
 * fancy-inertia and fancy-query, so that is a broken read, not a clean one.
 * (`composer.lock` with none is legitimate -- the kit requires none today.)
 *
 * raw.githubusercontent.com caches for about five minutes, so a run straight
 * after a push can still see the previous lockfile. The nightly run cannot.
 */
final class StarterKitDogfood
{
    public const REPO = 'Particle-Academy/fancy-starter-kit';

    public const NPM_LOCK_URL = 'https://raw.githubusercontent.com/'.self::REPO.'/main/package-lock.json';

    public const COMPOSER_LOCK_URL = 'https://raw.githubusercontent.com/'.self::REPO.'/main/composer.lock';

    private const NPM_SCOPE = '@particle-academy/';

    private const COMPOSER_VENDOR = 'particle-academy/';

    /** @var list<array{source: string, reason: string}> */
    private array $unknown = [];

    public function __construct(private readonly PackageVersions $versions) {}

    /**
     * @return array{
     *     ok: bool,
     *     checked: array{'package-lock.json': int, 'composer.lock': int},
     *     behind: array<string, array{0: string, 1: string}>,
     *     unknown: list<array{source: string, reason: string}>,
     * }
     */
    public function run(): array
    {
        $this->unknown = [];

        $npm = $this->npmLocked();
        $composer = $this->composerLocked();

        // label => [registry, name, locked version]
        $locked = [...$npm, ...$composer];

        $installed = [];
        $latest = [];
        $answers = [];

        foreach ($locked as $label => [$registry, $name, $version]) {
            $answers[$registry.':'.$name] ??= $this->versions->lookup($registry, $name);
            $answer = $answers[$registry.':'.$name];

            $installed[$label] = $version;
            $latest[$label] = $answer['status'] === 'ok' ? $answer['version'] : null;
        }

        $result = DogfoodCheck::compare($installed, $latest);

        foreach ($result['unchecked'] as $label) {
            [$registry, $name] = $locked[$label];
            $status = $answers[$registry.':'.$name]['status'];

            $this->unknown[] = [
                'source' => $label,
                'reason' => $status === 'missing'
                    ? "{$registry} has no {$name}, yet the kit's lockfile installs it"
                    : "the {$registry} lookup for {$name} failed",
            ];
        }

        return [
            'ok' => $result['behind'] === [] && $this->unknown === [],
            'checked' => ['package-lock.json' => count($npm), 'composer.lock' => count($composer)],
            'behind' => $result['behind'],
            'unknown' => $this->unknown,
        ];
    }

    /**
     * Every first-party entry in the kit's npm lockfile, nested copies included.
     *
     * @return array<string, array{0: string, 1: string, 2: string}>
     */
    private function npmLocked(): array
    {
        $lock = $this->fetch(self::NPM_LOCK_URL, 'package-lock.json');

        if ($lock === null) {
            return [];
        }

        if (! is_array($lock['packages'] ?? null)) {
            $this->unknownFor('package-lock.json', 'it has no `packages` map, so it is not a lockfile this can read');

            return [];
        }

        $out = [];

        foreach ($lock['packages'] as $path => $entry) {
            $at = strrpos((string) $path, 'node_modules/'.self::NPM_SCOPE);

            if ($at === false) {
                continue;
            }

            $name = substr((string) $path, $at + strlen('node_modules/'));
            $parent = rtrim(substr((string) $path, 0, $at), '/');
            $label = $parent === '' ? $name : "{$name} (under {$parent})";
            $version = is_array($entry) ? ($entry['version'] ?? null) : null;

            if (! is_string($version) || $version === '') {
                $this->unknownFor('package-lock.json', "{$label} has no version");

                continue;
            }

            $out[$label] = ['npm', $name, $version];
        }

        if ($out === [] && $this->unknown === []) {
            $this->unknownFor('package-lock.json', 'it names no first-party package, which cannot be right for a kit built on react-fancy');
        }

        return $out;
    }

    /**
     * Every first-party entry in the kit's composer.lock, require-dev included.
     *
     * @return array<string, array{0: string, 1: string, 2: string}>
     */
    private function composerLocked(): array
    {
        $lock = $this->fetch(self::COMPOSER_LOCK_URL, 'composer.lock');

        if ($lock === null) {
            return [];
        }

        if (! is_array($lock['packages'] ?? null)) {
            $this->unknownFor('composer.lock', 'it has no `packages` list, so it is not a lockfile this can read');

            return [];
        }

        $out = [];

        foreach ([...$lock['packages'], ...(array) ($lock['packages-dev'] ?? [])] as $entry) {
            $name = is_array($entry) ? (string) ($entry['name'] ?? '') : '';

            if (! str_starts_with($name, self::COMPOSER_VENDOR)) {
                continue;
            }

            $version = $entry['version'] ?? null;

            if (! is_string($version) || $version === '') {
                $this->unknownFor('composer.lock', "{$name} has no version");

                continue;
            }

            $out[$name] = ['composer', $name, $version];
        }

        return $out;
    }

    /** @return array<mixed>|null null when the file could not be read, already recorded as UNKNOWN */
    private function fetch(string $url, string $source): ?array
    {
        try {
            $response = Http::timeout(20)->get($url);
        } catch (StrayRequestException $e) {
            throw $e;
        } catch (\Throwable $e) {
            $this->unknownFor($source, "fetching {$url} failed: {$e->getMessage()}");

            return null;
        }

        if (! $response->successful()) {
            $this->unknownFor($source, "fetching {$url} answered HTTP {$response->status()}");

            return null;
        }

        $body = json_decode($response->body(), true);

        if (! is_array($body)) {
            $this->unknownFor($source, "{$url} is not JSON");

            return null;
        }

        return $body;
    }

    private function unknownFor(string $source, string $reason): void
    {
        $this->unknown[] = ['source' => $source, 'reason' => $reason];
    }
}

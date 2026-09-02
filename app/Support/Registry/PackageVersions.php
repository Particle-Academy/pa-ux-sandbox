<?php

declare(strict_types=1);

namespace App\Support\Registry;

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Throwable;

/**
 * What a package registry says about a distribution: its latest version, and
 * what that version requires.
 *
 * ## Why this is a service and not another private method
 *
 * `connectors:check`, `kit:dogfood` and `kit:status` each grew their own copy of
 * "ask npm / Packagist / PyPI for a version". Three copies of the same four
 * lines is survivable; a fourth, in a tool that answers upgrade questions for
 * other people's projects, is how they start disagreeing about the one thing
 * that matters here — what a failed lookup means.
 *
 * ## The distinction this class exists to preserve
 *
 * There are THREE answers, not two, and collapsing any pair of them produces a
 * check people should not trust:
 *
 *   * `ok` — the registry answered and here is the version.
 *   * `missing` — the registry answered 404. The package is not published. This
 *     is a real answer and often the correct one for a package that is decided
 *     but unbuilt.
 *   * `unknown` — we could not tell. A timeout, a 500, a malformed body.
 *
 * Reporting `unknown` as `ok` is the dangerous collapse: a network blip that
 * reads as "you are up to date" is worse than having no check at all, because
 * it is a check people trust. Reporting `missing` as `unknown` is milder but
 * still wrong — it sends someone to debug their network over a package that
 * simply has not shipped.
 */
final class PackageVersions
{
    /** How long a successful lookup is trusted. Failures are never cached. */
    private const TTL_SECONDS = 3600;

    private const TIMEOUT_SECONDS = 20;

    /**
     * Ask a registry about one distribution.
     *
     * @param  'npm'|'composer'|'pypi'  $registry
     * @return array{status: 'ok'|'missing'|'unknown', version: ?string, requires: list<string>}
     */
    public function lookup(string $registry, string $name): array
    {
        $key = "fancy:pkgversion:{$registry}:{$name}";

        // Only SUCCESSES are cached. Caching a failure would pin a transient
        // outage in front of every later caller for an hour, and the failure
        // modes here are exactly the ones that resolve themselves.
        if (is_array($cached = Cache::get($key))) {
            return $cached;
        }

        $result = $this->fetch($registry, $name);

        if ($result['status'] === 'ok') {
            Cache::put($key, $result, self::TTL_SECONDS);
        }

        return $result;
    }

    /**
     * @return array{status: 'ok'|'missing'|'unknown', version: ?string, requires: list<string>}
     */
    private function fetch(string $registry, string $name): array
    {
        $url = match ($registry) {
            'npm' => 'https://registry.npmjs.org/'.str_replace('/', '%2F', $name),
            'composer' => "https://repo.packagist.org/p2/{$name}.json",
            'pypi' => "https://pypi.org/pypi/{$name}/json",
            default => null,
        };

        if ($url === null) {
            return $this->unknown();
        }

        try {
            $response = Http::timeout(self::TIMEOUT_SECONDS)->get($url);

            if ($response->status() === 404) {
                return ['status' => 'missing', 'version' => null, 'requires' => []];
            }

            if (! $response->successful()) {
                return $this->unknown();
            }

            $body = $response->json();

            if (! is_array($body)) {
                return $this->unknown();
            }

            return match ($registry) {
                'npm' => $this->fromNpm($body),
                'composer' => $this->fromPackagist($body, $name),
                'pypi' => $this->fromPyPI($body),
            };
        } catch (Throwable) {
            // A thrown transport error is the same class of non-answer as a 500.
            return $this->unknown();
        }
    }

    /** @param array<string, mixed> $body */
    private function fromNpm(array $body): array
    {
        $latest = $body['dist-tags']['latest'] ?? null;
        if (! is_string($latest) || $latest === '') {
            return $this->unknown();
        }

        $release = $body['versions'][$latest] ?? [];
        $release = is_array($release) ? $release : [];

        // Peers count. A first-party sibling declared as a peer is one the
        // consumer must install THEMSELVES — precisely the dependency that goes
        // missing from a manifest and is never noticed.
        $requires = array_merge(
            array_keys(is_array($release['dependencies'] ?? null) ? $release['dependencies'] : []),
            array_keys(is_array($release['peerDependencies'] ?? null) ? $release['peerDependencies'] : []),
        );

        return [
            'status' => 'ok',
            'version' => ltrim($latest, 'v'),
            'requires' => array_values(array_unique(array_filter($requires, 'is_string'))),
        ];
    }

    /** @param array<string, mixed> $body */
    private function fromPackagist(array $body, string $name): array
    {
        // p2 orders newest first.
        $release = $body['packages'][$name][0] ?? null;
        if (! is_array($release) || ! is_string($release['version'] ?? null)) {
            return $this->unknown();
        }

        $requires = is_array($release['require'] ?? null) ? array_keys($release['require']) : [];

        return [
            'status' => 'ok',
            'version' => ltrim($release['version'], 'v'),
            'requires' => array_values(array_filter($requires, 'is_string')),
        ];
    }

    /** @param array<string, mixed> $body */
    private function fromPyPI(array $body): array
    {
        $version = $body['info']['version'] ?? null;
        if (! is_string($version) || $version === '') {
            return $this->unknown();
        }

        // `requires_dist` entries look like "fancy-flow (>=0.1)" or
        // "fancy-flow>=0.1; extra == 'x'" — the name is the leading token.
        $requires = [];
        foreach ((array) ($body['info']['requires_dist'] ?? []) as $spec) {
            if (! is_string($spec)) {
                continue;
            }
            if (preg_match('/^\s*([A-Za-z0-9._-]+)/', $spec, $m) === 1) {
                $requires[] = $m[1];
            }
        }

        return [
            'status' => 'ok',
            'version' => ltrim($version, 'v'),
            'requires' => array_values(array_unique($requires)),
        ];
    }

    /** @return array{status: 'unknown', version: null, requires: list<string>} */
    private function unknown(): array
    {
        return ['status' => 'unknown', 'version' => null, 'requires' => []];
    }
}

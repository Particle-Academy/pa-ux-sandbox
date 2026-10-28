<?php

declare(strict_types=1);

namespace App\Support\Catalog;

use App\Support\PackageRegistry;
use App\Support\Registry\ConnectorSource;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Http\Client\PendingRequest;
use Illuminate\Http\Client\RequestException;
use Illuminate\Http\Client\Response;
use Illuminate\Http\Client\StrayRequestException;
use Illuminate\Support\Facades\Http;

/**
 * Does the catalogue agree with the registries? Every way it can disagree.
 *
 * ## Why this exists
 *
 * The 2026-10-27 catalog audit found ten packages published and registered
 * nowhere -- invisible to /packages, the MCP and `kit:status` -- three of them
 * still described in {@see PackageRegistry::PLANNED} as unstarted, and a planned
 * PyPI name (`charlotte`) that already belonged to an unrelated author. Each was
 * a claim about a registry that nothing re-checked, which is the failure the
 * registry's own comments describe four separate times. `kit:status` reads the
 * registry and asks what it lists; nothing asked the registries what EXISTS.
 * This does, in both directions.
 *
 * ## The checks, each with a denominator
 *
 * - **npm-discovered** -- every live npm package we publish, found by the
 *   MAINTAINER search unioned with the `scope:` search. The scope search alone
 *   missed `@particle-academy/fancy-git-bitbucket` in the audit; the maintainer
 *   query found all 130. Every page is read, and a search hit is confirmed by a
 *   direct lookup before it counts, because the search index lags both ways.
 * - **packagist-discovered** -- Packagist's vendor listing, which is complete.
 * - **pypi-candidates** -- PyPI has no vendor listing, so the candidates are
 *   every PyPI name the Prism manifest, PackageRegistry and our Python repos'
 *   `pyproject.toml` files mention. A published name that is not ours is a
 *   NAME COLLISION, not a missing registration.
 * - **planned-unpublished** -- a PLANNED entry that is already live (or whose
 *   name somebody else owns).
 * - **hidden-reasoned** -- a HIDDEN slug that is live without a reason in
 *   {@see PackageRegistry::HIDDEN_REASONS}.
 * - **registered-resolves** -- a listed package whose registry has no release.
 * - **prism-manifest** -- every public entry in prism-parity's manifest is
 *   registered; every hidden one matches a HIDDEN slug with a reason.
 *
 * Connector packages are registered through `connectors.json`, not here, and
 * count as registered.
 *
 * ## What it will not do
 *
 * **A failed lookup is never fine.** A 5xx, a rate limit, a dropped connection,
 * a 200 that is not JSON, an empty search or listing: each is UNKNOWN and fails
 * the run. A blip that reads as "published" -- or as "nothing missing" -- is
 * worse than no check, because it is a check people trust.
 */
final class CatalogDrift
{
    public const MANIFEST_URL = 'https://raw.githubusercontent.com/Particle-Academy/prism-parity/main/manifest/packages.json';

    /** The npm account that publishes the kit. The search the audit proved complete. */
    public const NPM_MAINTAINER = 'wishborn';

    public const NPM_SCOPE = 'particle-academy';

    public const PACKAGIST_VENDOR = 'particle-academy';

    private const NPM_PAGE = 250;

    private const PUBLISHED = 'published';

    private const ABSENT = 'absent';

    private const UNKNOWN = 'unknown';

    /** @var array<string, array{state: string, ours: ?bool, reason: ?string}> */
    private array $probes = [];

    /** @var list<array{registry: string, name: string, reason: string}> */
    private array $unknown = [];

    /** @var list<string> */
    private readonly array $hidden;

    /** @var array<string, string> */
    private readonly array $hiddenReasons;

    /**
     * @param  list<string>|null  $hidden  defaults to {@see PackageRegistry::HIDDEN}
     * @param  array<string,string>|null  $hiddenReasons  defaults to {@see PackageRegistry::HIDDEN_REASONS}
     */
    public function __construct(
        private readonly ConnectorSource $connectors,
        ?array $hidden = null,
        ?array $hiddenReasons = null,
    ) {
        $this->hidden = $hidden ?? PackageRegistry::HIDDEN;
        $this->hiddenReasons = $hiddenReasons ?? PackageRegistry::HIDDEN_REASONS;
    }

    /**
     * Run every check.
     *
     * @param  string|null  $reposRoot  directory holding our repos, for pyproject names; null skips that source
     * @return array{ok: bool, checks: list<array<string,mixed>>, unknown: list<array<string,string>>}
     */
    public function run(?string $reposRoot): array
    {
        $this->probes = [];
        $this->unknown = [];

        $manifest = $this->manifest();

        $checks = [
            $this->npmDiscovered(),
            $this->packagistDiscovered(),
            $this->pypiCandidates($manifest, $reposRoot),
            $this->plannedUnpublished(),
            $this->hiddenReasoned(),
            $this->registeredResolves(),
            $this->prismManifest($manifest),
        ];

        $findings = array_sum(array_map(fn (array $c) => count($c['findings']), $checks));

        return [
            'ok' => $findings === 0 && $this->unknown === [],
            'checks' => $checks,
            'unknown' => $this->unknown,
        ];
    }

    // ── The checks ──────────────────────────────────────────────────────────

    /** @return array<string,mixed> */
    private function npmDiscovered(): array
    {
        $discovered = [];

        foreach (['maintainer:'.self::NPM_MAINTAINER, 'scope:'.self::NPM_SCOPE] as $query) {
            foreach ($this->npmSearch($query) ?? [] as $name => $repository) {
                $scoped = str_starts_with($name, '@'.self::NPM_SCOPE.'/');
                // An unscoped package is ours only if its repository is. The
                // maintainer search returns everything the account maintains.
                $ourRepo = stripos((string) $repository, 'github.com/particle-academy/') !== false;

                if ($scoped || $ourRepo) {
                    $discovered[$name] = true;
                }
            }
        }

        return $this->discoveryCheck('npm-discovered', 'npm (maintainer + scope search)', 'npm', array_keys($discovered), 'live npm packages discovered');
    }

    /** @return array<string,mixed> */
    private function packagistDiscovered(): array
    {
        $names = [];

        try {
            $response = $this->http()->get('https://packagist.org/packages/list.json', ['vendor' => self::PACKAGIST_VENDOR]);
            $json = $response->successful() ? $response->json() : null;
            $names = is_array($json) ? array_values(array_filter((array) ($json['packageNames'] ?? []), 'is_string')) : [];

            if (! $response->successful()) {
                $this->unknownFor('packagist-list', self::PACKAGIST_VENDOR, 'HTTP '.$response->status());
            } elseif ($names === []) {
                $this->unknownFor('packagist-list', self::PACKAGIST_VENDOR, 'the vendor listing came back empty, which cannot be right');
            }
        } catch (StrayRequestException $e) {
            throw $e;
        } catch (\Throwable $e) {
            $this->unknownFor('packagist-list', self::PACKAGIST_VENDOR, $e->getMessage());
        }

        return $this->discoveryCheck('packagist-discovered', 'Packagist (vendor listing)', 'packagist', $names, 'Packagist packages listed under the vendor');
    }

    /**
     * Shared by the npm and Packagist discovery: each name not known to any of
     * our lists is confirmed by a direct lookup before it is reported.
     *
     * @param  list<string>  $names
     * @return array<string,mixed>
     */
    private function discoveryCheck(string $id, string $label, string $registry, array $names, string $unit): array
    {
        $findings = [];
        $known = $this->knownNames();
        sort($names);

        foreach ($names as $name) {
            if (isset($known[$registry][$name])) {
                continue;
            }

            $probe = $this->probe($registry, $name);

            if ($probe['state'] === self::PUBLISHED) {
                $findings[] = $this->finding('unregistered', $registry, $name, 'published, and in no PackageRegistry list, connectors.json or PLANNED');
            }
        }

        return $this->check($id, $label, count($names), $unit, $findings);
    }

    /**
     * @param  array<int, array<string,mixed>>|null  $manifest
     * @return array<string,mixed>
     */
    private function pypiCandidates(?array $manifest, ?string $reposRoot): array
    {
        $candidates = [];

        foreach ($manifest ?? [] as $entry) {
            if ($entry['registry'] === 'pypi') {
                $candidates[$entry['name']] = true;
            }
        }
        foreach ($this->registered()['pypi'] as $name => $slug) {
            $candidates[$name] = true;
        }
        foreach ($this->pyprojectNames($reposRoot) as $name) {
            $candidates[$name] = true;
        }

        $names = array_keys($candidates);
        sort($names);
        $known = $this->knownNames();
        $findings = [];

        foreach ($names as $name) {
            $probe = $this->probe('pypi', $name);

            if ($probe['state'] !== self::PUBLISHED || isset($known['pypi'][$name])) {
                continue;
            }

            $findings[] = $probe['ours'] === false
                ? $this->finding('name-collision', 'pypi', $name, 'one of our sources names it, and PyPI has it under another publisher: '.$probe['reason'])
                : $this->finding('unregistered', 'pypi', $name, 'published, and in no PackageRegistry list, connectors.json or PLANNED');
        }

        return $this->check('pypi-candidates', 'PyPI (manifest + registry + pyproject names)', count($names), 'PyPI names looked up', $findings);
    }

    /** @return array<string,mixed> */
    private function plannedUnpublished(): array
    {
        $findings = [];
        $checked = 0;

        foreach (PackageRegistry::PLANNED as $slug => $row) {
            foreach ((array) ($row['registries'] ?? []) as $registry => $name) {
                $checked++;
                $probe = $this->probe((string) $registry, (string) $name);

                if ($probe['state'] !== self::PUBLISHED) {
                    continue;
                }

                $findings[] = $probe['ours'] === false
                    ? $this->finding('name-collision', (string) $registry, (string) $name, "PLANNED as {$slug}, but the name already belongs to another publisher ({$probe['reason']}) -- rename the plan", $slug)
                    : $this->finding('planned-but-published', (string) $registry, (string) $name, "PLANNED as {$slug}, but it is live: move it into META and all()/companions() (or, if it is not ours, it is a name collision -- rename the plan)", $slug);
            }
        }

        return $this->check('planned-unpublished', 'PLANNED entries still unpublished', $checked, 'planned registry names looked up', $findings);
    }

    /** @return array<string,mixed> */
    private function hiddenReasoned(): array
    {
        $findings = [];

        foreach ($this->hidden as $slug) {
            $definition = PackageRegistry::definitionFor($slug) ?? [];

            foreach ($this->registryNames($definition) as [$registry, $name]) {
                $probe = $this->probe($registry, $name);

                if ($probe['state'] === self::PUBLISHED && trim((string) ($this->hiddenReasons[$slug] ?? '')) === '') {
                    $findings[] = $this->finding('hidden-published-without-reason', $registry, $name, "HIDDEN as {$slug} but published: un-hide it, or record why in PackageRegistry::HIDDEN_REASONS", $slug);
                }
            }
        }

        return $this->check('hidden-reasoned', 'HIDDEN entries', count($this->hidden), 'hidden slugs', $findings);
    }

    /** @return array<string,mixed> */
    private function registeredResolves(): array
    {
        $findings = [];
        $checked = 0;
        $skipped = [];

        foreach (PackageRegistry::everything() as $pkg) {
            $slug = (string) $pkg['slug'];

            if (in_array($slug, $this->hidden, true)) {
                continue;   // a hidden package is EXPECTED to 404; hiddenReasoned() owns it
            }

            $names = $this->registryNames($pkg);

            if ($names === []) {
                $skipped[] = $slug;

                continue;
            }

            foreach ($names as [$registry, $name]) {
                $checked++;
                $probe = $this->probe($registry, $name);

                if ($probe['state'] === self::ABSENT) {
                    $findings[] = $this->finding('registered-but-404', $registry, $name, "registered as {$slug}, but the registry has no published release", $slug);
                } elseif ($probe['state'] === self::PUBLISHED && $probe['ours'] === false) {
                    $findings[] = $this->finding('name-collision', $registry, $name, "registered as {$slug}, but the registry has it under another publisher: {$probe['reason']}", $slug);
                }
            }
        }

        $check = $this->check('registered-resolves', 'Registered packages resolve', $checked, 'registered registry names looked up', $findings);
        $check['skipped'] = $skipped;

        return $check;
    }

    /**
     * @param  array<int, array<string,mixed>>|null  $manifest
     * @return array<string,mixed>
     */
    private function prismManifest(?array $manifest): array
    {
        $findings = [];
        $registered = $this->registered();

        foreach ($manifest ?? [] as $entry) {
            [$registry, $name, $status, $catalog] = [$entry['registry'], $entry['name'], $entry['status'], $entry['catalog']];

            if ($catalog === null) {
                $this->unknownFor($registry, $name, 'unrecognised manifest `catalog` value; expected public or hidden');

                continue;
            }

            if (in_array($status, ['planned', 'deprecated'], true)) {
                continue;
            }

            // Every remaining entry is confirmed against its registry before it
            // can be drift. The manifest's `status` says what Prism INTENDS --
            // and before the published|planned|deprecated enum it was free text
            // ("in progress", "specified, not started") -- so an entry that has
            // not actually shipped (the prism-conformance trio, prism-ai-mcp-server)
            // is nothing the catalogue could list or hide, whatever it is marked.
            $probe = $this->probe($registry, $name);

            if ($probe['state'] !== self::PUBLISHED) {
                continue;   // not live (absent), or already recorded as UNKNOWN
            }

            // The name answers, but not for us: never adopt it into the catalogue.
            if ($probe['ours'] === false) {
                $findings[] = $this->finding('name-collision', $registry, $name, "the Prism manifest names it, but the registry has it under another publisher: {$probe['reason']}");

                continue;
            }

            $slug = $registered[$registry][$name] ?? null;
            $isHidden = $slug !== null && in_array($slug, $this->hidden, true);

            if ($catalog === 'hidden') {
                if (! $isHidden || trim((string) ($this->hiddenReasons[$slug] ?? '')) === '') {
                    $findings[] = $this->finding('manifest-hidden-unrecorded', $registry, $name, 'the Prism manifest hides it; PackageRegistry needs a matching HIDDEN slug with a HIDDEN_REASONS entry', $slug);
                }

                continue;
            }

            if ($slug === null) {
                $findings[] = $this->finding('manifest-unregistered', $registry, $name, 'public in the Prism manifest, and not in PackageRegistry');
            } elseif ($isHidden) {
                $findings[] = $this->finding('manifest-public-but-hidden', $registry, $name, "public in the Prism manifest, but HIDDEN here as {$slug}", $slug);
            }
        }

        return $this->check('prism-manifest', 'Prism manifest (prism-parity)', count($manifest ?? []), 'manifest entries', $findings);
    }

    // ── Inputs ──────────────────────────────────────────────────────────────

    /**
     * The manifest's `packages` + `satellites`, normalised. Missing `status` is
     * `published`; missing `catalog` is `public`. A `catalog` this cannot read
     * is null, and the caller reports it as UNKNOWN rather than guessing.
     *
     * @return list<array{registry: string, name: string, status: string, catalog: ?string}>|null
     */
    private function manifest(): ?array
    {
        try {
            // Deliberately a bare client: the manifest is public, and a token
            // here would be a credential sent somewhere that does not need it.
            $response = $this->http()->get(self::MANIFEST_URL);
        } catch (StrayRequestException $e) {
            throw $e;
        } catch (\Throwable $e) {
            $this->unknownFor('prism-manifest', self::MANIFEST_URL, $e->getMessage());

            return null;
        }

        $json = $response->successful() ? $this->json($response) : null;

        if (! is_array($json) || ! is_array($json['packages'] ?? null)) {
            $this->unknownFor('prism-manifest', self::MANIFEST_URL, $response->successful() ? 'not a manifest' : 'HTTP '.$response->status());

            return null;
        }

        $entries = [];

        foreach (['packages', 'satellites'] as $section) {
            foreach ((array) ($json[$section] ?? []) as $key => $entry) {
                if (str_starts_with((string) $key, '$') || ! is_array($entry) || ! is_string($entry['name'] ?? null) || ! is_string($entry['registry'] ?? null)) {
                    continue;
                }

                $entries[] = [
                    'registry' => $entry['registry'],
                    'name' => $entry['name'],
                    'status' => is_string($entry['status'] ?? null) ? $entry['status'] : 'published',
                    'catalog' => $this->catalogVisibility($entry['catalog'] ?? null),
                ];
            }
        }

        return $entries;
    }

    private function catalogVisibility(mixed $catalog): ?string
    {
        if ($catalog === null) {
            return 'public';
        }

        $value = is_array($catalog) ? ($catalog['visibility'] ?? $catalog['value'] ?? $catalog['status'] ?? null) : $catalog;

        return in_array($value, ['public', 'hidden'], true) ? $value : null;
    }

    /**
     * Every registry name PackageRegistry lists, as registry => name => slug.
     * HIDDEN rows included: a hidden package is registered, just not shown.
     *
     * @return array<string, array<string, string>>
     */
    private function registered(): array
    {
        $out = ['npm' => [], 'packagist' => [], 'pypi' => []];

        foreach (PackageRegistry::everything() as $pkg) {
            foreach ($this->registryNames($pkg) as [$registry, $name]) {
                $out[$registry][$name] = (string) $pkg['slug'];
            }
        }

        return $out;
    }

    /**
     * Registered + connectors.json + PLANNED: every name a finding would be
     * redundant for. A live PLANNED name is planned-unpublished's to report.
     *
     * @return array<string, array<string, true>>
     */
    private function knownNames(): array
    {
        $known = ['npm' => [], 'packagist' => [], 'pypi' => [], 'crates' => []];

        foreach ($this->registered() as $registry => $names) {
            foreach ($names as $name => $slug) {
                $known[$registry][$name] = true;
            }
        }

        foreach ($this->connectors->connectors() as $connector) {
            foreach ((array) ($connector['packages'] ?? []) as $package) {
                if (is_array($package) && is_string($package['name'] ?? null) && is_string($package['registry'] ?? null)) {
                    $known[$package['registry']][$package['name']] = true;
                }
            }
        }

        foreach (PackageRegistry::PLANNED as $row) {
            foreach ((array) ($row['registries'] ?? []) as $registry => $name) {
                $known[(string) $registry][(string) $name] = true;
            }
        }

        return $known;
    }

    /**
     * @param  array<string,mixed>  $pkg
     * @return list<array{0: string, 1: string}>
     */
    private function registryNames(array $pkg): array
    {
        $names = [];

        foreach (['npm' => 'npm', 'composer' => 'packagist', 'packagist' => 'packagist', 'pypi' => 'pypi'] as $field => $registry) {
            if (is_string($pkg[$field] ?? null) && $pkg[$field] !== '') {
                $names[$registry.':'.$pkg[$field]] = [$registry, $pkg[$field]];
            }
        }

        return array_values($names);
    }

    /**
     * `[project] name = "..."` from each repo's pyproject.toml, at the root or
     * under `python/` (the polyglot layout). Absent outside the envelope -- in
     * CI only the manifest and the registry feed this source, which is why it
     * is one of three.
     *
     * @return list<string>
     */
    private function pyprojectNames(?string $root): array
    {
        if ($root === null || ! is_dir($root)) {
            return [];
        }

        $names = [];

        foreach ([...glob($root.'/*/pyproject.toml') ?: [], ...glob($root.'/*/python/pyproject.toml') ?: []] as $file) {
            $toml = (string) file_get_contents($file);

            if (preg_match('/^\[project\]\s*$(.*?)(?=^\[|\z)/ms', $toml, $section)
                && preg_match('/^name\s*=\s*["\']([^"\']+)["\']/m', $section[1], $m)) {
                $names[] = $m[1];
            }
        }

        return array_values(array_unique($names));
    }

    // ── Lookups ─────────────────────────────────────────────────────────────

    /**
     * Every page of an npm search, as name => repository URL. Null when the
     * question was not answered -- recorded as UNKNOWN.
     *
     * @return array<string, ?string>|null
     */
    private function npmSearch(string $text): ?array
    {
        $found = [];
        $from = 0;

        try {
            do {
                $response = $this->http()->get('https://registry.npmjs.org/-/v1/search', [
                    'text' => $text,
                    'size' => self::NPM_PAGE,
                    'from' => $from,
                ]);
                $json = $response->successful() ? $this->json($response) : null;

                if (! is_array($json) || ! is_array($json['objects'] ?? null)) {
                    $this->unknownFor('npm-search', $text, $response->successful() ? 'not a search result' : 'HTTP '.$response->status());

                    return null;
                }

                $total = (int) ($json['total'] ?? 0);

                foreach ($json['objects'] as $object) {
                    $name = $object['package']['name'] ?? null;

                    if (is_string($name)) {
                        $found[$name] = $object['package']['links']['repository'] ?? null;
                    }
                }

                $from += self::NPM_PAGE;
            } while ($from < $total && $json['objects'] !== []);
        } catch (StrayRequestException $e) {
            throw $e;
        } catch (\Throwable $e) {
            $this->unknownFor('npm-search', $text, $e->getMessage());

            return null;
        }

        if ($found === []) {
            $this->unknownFor('npm-search', $text, 'zero results, which means the question was not answered');

            return null;
        }

        return $found;
    }

    /**
     * One registry name: published, absent, or unknown -- memoised, so a name
     * several checks ask about is fetched once.
     *
     * @return array{state: string, ours: ?bool, reason: ?string}
     */
    private function probe(string $registry, string $name): array
    {
        $key = $registry.':'.$name;

        if (isset($this->probes[$key])) {
            return $this->probes[$key];
        }

        $url = match ($registry) {
            'npm' => 'https://registry.npmjs.org/'.str_replace('/', '%2F', $name),
            'packagist' => "https://repo.packagist.org/p2/{$name}.json",
            'pypi' => 'https://pypi.org/pypi/'.rawurlencode($name).'/json',
            'crates' => 'https://crates.io/api/v1/crates/'.rawurlencode($name),
            default => null,
        };

        if ($url === null) {
            $this->unknownFor($registry, $name, 'no lookup for this registry');

            return $this->probes[$key] = ['state' => self::UNKNOWN, 'ours' => null, 'reason' => null];
        }

        try {
            $response = $this->http()->get($url);
        } catch (StrayRequestException $e) {
            throw $e;
        } catch (\Throwable $e) {
            $this->unknownFor($registry, $name, $e->getMessage());

            return $this->probes[$key] = ['state' => self::UNKNOWN, 'ours' => null, 'reason' => null];
        }

        if ($response->status() === 404) {
            return $this->probes[$key] = ['state' => self::ABSENT, 'ours' => null, 'reason' => null];
        }

        $json = $response->successful() ? $this->json($response) : null;

        if (! is_array($json)) {
            $this->unknownFor($registry, $name, $response->successful() ? 'a 200 that is not JSON' : 'HTTP '.$response->status());

            return $this->probes[$key] = ['state' => self::UNKNOWN, 'ours' => null, 'reason' => null];
        }

        $published = match ($registry) {
            // An unpublished npm package keeps a packument with no dist-tags.
            'npm' => is_string($json['dist-tags']['latest'] ?? null),
            // p2 answers 200 for a package that never tagged a release.
            'packagist' => ($json['packages'][$name] ?? []) !== [],
            'pypi' => is_array($json['info'] ?? null),
            'crates' => is_array($json['crate'] ?? null),
        };

        [$ours, $reason] = $registry === 'pypi' && $published ? $this->pypiOwnership($json['info']) : [null, null];

        return $this->probes[$key] = ['state' => $published ? self::PUBLISHED : self::ABSENT, 'ours' => $ours, 'reason' => $reason];
    }

    /**
     * Whether a PyPI project is ours. PyPI names are first-come and unscoped,
     * so a 200 says only that SOMEBODY published it -- `charlotte` and `prism`
     * both answer 200 and neither is ours.
     *
     * @param  array<string,mixed>  $info
     * @return array{0: bool, 1: string}
     */
    private function pypiOwnership(array $info): array
    {
        // Ownership is read from WHO published it and WHERE its source lives --
        // never from the name. `prism-ai-cli` shares the `prism-ai-` prefix our
        // Prism ports use and belongs to somebody else entirely (author "Your
        // Name <you@prism.ai>", homepage prism.ai).
        $people = array_map(
            fn ($v) => strtolower(trim((string) $v)),
            [$info['author'] ?? null, $info['author_email'] ?? null, $info['maintainer'] ?? null, $info['maintainer_email'] ?? null],
        );
        $byUs = in_array('particle academy', $people, true)
            || collect($people)->contains(fn (string $p) => str_starts_with($p, 'particle academy <') || str_ends_with($p, '@particle.academy') || str_ends_with($p, '@particle.academy>'));

        $urls = array_filter([$info['home_page'] ?? null, ...array_values((array) ($info['project_urls'] ?? []))], 'is_string');
        $fromOurRepo = collect($urls)->contains(fn (string $u) => preg_match('#^https?://(www\.)?github\.com/particle-academy/#i', trim($u)) === 1);

        $ours = $byUs || $fromOurRepo;
        $who = trim((string) ($info['author'] ?? '')) ?: trim((string) ($info['author_email'] ?? '')) ?: 'an unnamed publisher';

        return [$ours, "author {$who}"];
    }

    private function http(): PendingRequest
    {
        return Http::timeout(20)
            ->withUserAgent('fancy-kit-catalog-drift (+https://github.com/Particle-Academy/pa-ux-sandbox)')
            ->acceptJson()
            ->retry(3, 1000, fn (\Throwable $e) => $e instanceof ConnectionException
                || ($e instanceof RequestException && ($e->response->status() === 429 || $e->response->serverError())), throw: false);
    }

    private function json(Response $response): mixed
    {
        try {
            return json_decode($response->body(), true, 512, JSON_THROW_ON_ERROR);
        } catch (\JsonException) {
            return null;
        }
    }

    // ── Report shapes ───────────────────────────────────────────────────────

    /**
     * @param  list<array<string,mixed>>  $findings
     * @return array<string,mixed>
     */
    private function check(string $id, string $label, int $denominator, string $unit, array $findings): array
    {
        return ['id' => $id, 'label' => $label, 'denominator' => $denominator, 'unit' => $unit, 'findings' => $findings];
    }

    /** @return array<string,string> */
    private function finding(string $class, string $registry, string $name, string $detail, ?string $slug = null): array
    {
        $finding = ['class' => $class, 'registry' => $registry, 'name' => $name, 'detail' => $detail];

        return $slug === null ? $finding : $finding + ['slug' => $slug];
    }

    private function unknownFor(string $registry, string $name, string $reason): void
    {
        $this->unknown[] = ['registry' => $registry, 'name' => $name, 'reason' => $reason];
    }
}

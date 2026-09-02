<?php

declare(strict_types=1);

namespace App\Mcp\Tools;

use App\Support\PackageRegistry;
use App\Support\Registry\FirstPartyNodeSource;
use App\Support\Registry\PackageVersions;
use Illuminate\Contracts\JsonSchema\JsonSchema;
use Laravel\Mcp\Request;
use Laravel\Mcp\Response;
use Laravel\Mcp\Server\Attributes\Description;
use Laravel\Mcp\Server\Tool;

/**
 * "Here is what I am using — what should I be on, and what am I missing?"
 *
 * ## Why this exists
 *
 * `npm outdated` already answers half of this, and answers it better. The half
 * it cannot answer is the one that costs people time:
 *
 * **A first-party package that arrived as a transitive dependency is invisible
 * in the consumer's own manifest.** `fancy-diff` pulls `fancy-file-commons`;
 * nothing in the consumer's `package.json` mentions it, so an agent reading
 * that manifest to plan an upgrade never learns it is there — and a shared core
 * left behind while its dependants move is how two copies of it end up in one
 * tree. That failure is silent: the resolver quietly picks an older version, or
 * installs both, and reports success either way.
 *
 * So this tool takes the list the caller HAS, and returns two things: what is
 * behind, and what is missing from the list entirely.
 *
 * ## Why `lang` is required rather than inferred
 *
 * Most server capabilities ship as a matched PHP + Node pair under different
 * names — `holy-sheet` and `holy-sheet-js`, `fancy-features` and
 * `fancy-features-js`. Guessing the ecosystem from a bare slug would hand a
 * Laravel app an npm package it cannot install, which is worse than asking.
 *
 * ## Three things are in scope, and they behave differently
 *
 *  1. **Packages** — resolved against npm / Packagist / PyPI.
 *  2. **prism** — first-party despite being a fork, under our own vendor name.
 *     It spent months in no registry precisely because it did not look like a
 *     Fancy package, so it is named explicitly here.
 *  3. **Marketplace nodes** — NOT packages. A node is vendored source with no
 *     version to bump; what it carries is an ENGINE FLOOR. A graph whose engine
 *     is below it fails at that node with nothing visible beforehand, so the
 *     node's contribution to this answer is the engine it needs.
 */
#[Description('Given the Fancy packages a project is using, return the latest version of each PLUS any first-party dependency missing from the list. Pass `lang` (php | node | python) so the right distribution is resolved — most capabilities ship as a matched PHP+Node pair under different names. Accepts slugs ("react-fancy"), full names ("@particle-academy/react-fancy"), "name@version" to be told what is behind, and fancy-flow marketplace node kinds. Covers prism and the node marketplace. Never reports an unreachable registry as up to date.')]
class CheckVersions extends Tool
{
    /** The caller's `lang` => the registry that answers for it. */
    private const REGISTRIES = [
        'php' => 'composer',
        'node' => 'npm',
        'python' => 'pypi',
    ];

    /** Spellings a caller may reasonably use for each language. */
    private const ALIASES = [
        'php' => 'php', 'laravel' => 'php', 'composer' => 'php',
        'node' => 'node', 'js' => 'node', 'javascript' => 'node', 'ts' => 'node',
        'typescript' => 'node', 'npm' => 'node', 'react' => 'node',
        'python' => 'python', 'py' => 'python', 'pypi' => 'python',
        'fastapi' => 'python', 'django' => 'python',
    ];

    /** The registry key on a package entry that names its distribution. */
    private const DISTRIBUTION_KEY = [
        'composer' => 'composer',
        'npm' => 'npm',
        'pypi' => 'pypi',
    ];

    /**
     * Ceiling on transitive resolution. A first-party graph is nowhere near
     * this, so hitting it means something is wrong — and the response says so
     * rather than silently returning a partial answer.
     */
    private const MAX_LOOKUPS = 80;

    public function __construct(
        private readonly FirstPartyNodeSource $nodes = new FirstPartyNodeSource,
        private readonly PackageVersions $versions = new PackageVersions,
    ) {}

    public function handle(Request $request): Response
    {
        $lang = $this->normalizeLang((string) $request->get('lang', ''));

        if ($lang === null) {
            $given = trim((string) $request->get('lang', ''));

            return Response::json([
                'error' => $given === ''
                    ? 'Pass `lang`: php, node, or python.'
                    : "Unrecognised lang \"{$given}\". Use php, node, or python — a Fancy capability usually ships as a matched PHP+Node pair under different names, so the language decides which distribution to resolve. Guessing would hand you a package you cannot install.",
                'accepted' => array_keys(self::REGISTRIES),
            ]);
        }

        $registry = self::REGISTRIES[$lang];
        $inputs = $this->inputs($request);

        if ($inputs === []) {
            return Response::json([
                'error' => 'Pass `packages`: the Fancy packages you are using. Slugs, full names, or "name@version".',
            ]);
        }

        $using = [];
        $nodes = [];
        $unrecognised = [];
        $listed = [];          // slugs the caller already has — never "missing"
        $required = [];        // slug => list of slugs that require it

        foreach ($inputs as $input) {
            [$name, $have] = $this->splitVersion($input);

            if ($node = $this->findNode($name)) {
                $nodes[] = $this->presentNode($node, $lang);

                continue;
            }

            $pkg = $this->findPackage($name);

            if ($pkg === null) {
                $unrecognised[] = $input;

                continue;
            }

            $listed[$pkg['slug']] = true;
            $using[] = ['pkg' => $pkg, 'input' => $input, 'have' => $have];
        }

        // Node engine floors and the suite packages a node's source imports are
        // dependencies too — a node vendored into a project whose engine is
        // below its floor is exactly the silent failure this tool is for.
        foreach ($nodes as $node) {
            foreach ($node['requires_packages'] as $slug) {
                $required[$slug][] = $node['kind'];
            }
        }

        $lookups = 0;
        $rows = [];

        foreach ($using as $entry) {
            $rows[] = $row = $this->resolve($entry['pkg'], $registry, $entry['input'], $entry['have'], $lang, $lookups);

            foreach ($row['_requires'] as $slug) {
                $required[$slug][] = $entry['pkg']['slug'];
            }
        }

        $add = $this->missing($required, $listed, $registry, $lang, $lookups);

        // The shape is STABLE: `using`, `add`, `nodes` and `not_recognised` are
        // always present, empty or not. Omitting an empty key would make a
        // caller distinguish "nothing to add" from "the tool forgot to answer",
        // and the safe reading of a missing key is the wrong one.
        $payload = [
            'lang' => $lang,
            'registry' => $registry,
            'using' => array_map($this->withoutInternals(...), $rows),
            'add' => $add,
            'nodes' => $nodes,
            'not_recognised' => $unrecognised,
        ];

        if ($unrecognised !== []) {
            $payload['note'] = 'Names under `not_recognised` are not Fancy packages or marketplace nodes. They are listed rather than dropped, because silence would read as "those are fine".';
        }

        if ($lookups >= self::MAX_LOOKUPS) {
            $payload['truncated'] = 'Stopped after '.self::MAX_LOOKUPS.' registry lookups; the dependency list above may be incomplete.';
        }

        return Response::json($payload);
    }

    /**
     * Resolve one package against its registry.
     *
     * @param  array<string, mixed>  $pkg
     * @return array<string, mixed>
     */
    private function resolve(array $pkg, string $registry, string $input, ?string $have, string $lang, int &$lookups): array
    {
        $distribution = $pkg[self::DISTRIBUTION_KEY[$registry]] ?? null;

        // The package exists, just not for this language. Saying nothing here
        // would read as "Fancy has no xlsx writer", which is false and
        // unrecoverable for the caller — so name the stacks that do have it.
        if (! is_string($distribution) || $distribution === '') {
            return [
                'input' => $input,
                'slug' => $pkg['slug'],
                'package' => null,
                'status' => 'no-distribution',
                'latest' => null,
                'available_in' => $this->stacksFor($pkg),
                'detail' => "{$pkg['slug']} publishes nothing for {$lang}.",
                '_requires' => [],
            ];
        }

        if ($lookups >= self::MAX_LOOKUPS) {
            return [
                'input' => $input, 'slug' => $pkg['slug'], 'package' => $distribution,
                'status' => 'unknown', 'latest' => null,
                'detail' => 'Lookup budget exhausted before this package was checked.',
                '_requires' => [],
            ];
        }

        $lookups++;
        $result = $this->versions->lookup($registry, $distribution);

        $status = match ($result['status']) {
            'missing' => 'not-published',
            'unknown' => 'unknown',
            default => $have === null
                ? 'current'
                : (version_compare($this->comparable($have), $this->comparable((string) $result['version']), '<') ? 'outdated' : 'current'),
        };

        // `latest` is always present, and explicitly null when unknown. A key
        // that simply vanishes reads as "not applicable"; an explicit null says
        // "we asked and could not tell", which is the whole point of the
        // `unknown` status. Only the optional keys below are omitted.
        $row = [
            'input' => $input,
            'slug' => $pkg['slug'],
            'package' => $distribution,
            'latest' => $result['version'],
            'status' => $status,
        ];

        if ($have !== null) {
            $row['have'] = $have;
        }

        if ($status === 'outdated') {
            $row['upgrade'] = $this->installCommand($registry, $distribution, $result['version']);
        }

        $detail = match ($status) {
            'unknown' => 'The registry did not answer. This is NOT "you are up to date" — re-run before acting on it.',
            'not-published' => "Not on the registry yet. {$pkg['slug']} may be planned rather than released.",
            default => null,
        };

        if ($detail !== null) {
            $row['detail'] = $detail;
        }

        // Attached after the null-strip so an empty list survives: the caller
        // never sees this key, but `missing()` reads it.
        $row['_requires'] = $this->firstPartyRequires($result['requires'], $registry);

        return $row;
    }

    /**
     * First-party packages that are required but were not listed.
     *
     * @param  array<string, list<string>>  $required
     * @param  array<string, bool>  $listed
     * @return list<array<string, mixed>>
     */
    private function missing(array $required, array $listed, string $registry, string $lang, int &$lookups): array
    {
        $add = [];
        $seen = $listed;
        $queue = array_keys($required);

        while ($queue !== []) {
            $slug = array_shift($queue);

            if (isset($seen[$slug])) {
                continue;
            }
            $seen[$slug] = true;

            $pkg = PackageRegistry::findAny($slug) ?? PackageRegistry::definitionFor($slug);
            if ($pkg === null) {
                continue;
            }

            $row = $this->resolve($pkg, $registry, $slug, null, $lang, $lookups);

            // A dependency with no distribution for this language is not a gap
            // in the caller's manifest — it simply is not installable here.
            if ($row['status'] === 'no-distribution') {
                continue;
            }

            $add[] = array_filter([
                'slug' => $slug,
                'package' => $row['package'],
                'latest' => $row['latest'],
                'status' => $row['status'],
                'required_by' => array_values(array_unique($required[$slug] ?? [])),
                'install' => $row['latest'] === null
                    ? null
                    : $this->installCommand($registry, (string) $row['package'], $row['latest']),
                'why' => 'Pulled in transitively and absent from your list. It resolves today, but a shared core left behind while its dependants move is how a tree ends up with two copies — and nothing reports that.',
            ], fn ($v) => $v !== null);

            // Its own first-party requirements are equally invisible.
            foreach ($row['_requires'] as $next) {
                $required[$next][] = $slug;
                $queue[] = $next;
            }
        }

        return $add;
    }

    /**
     * Distribution names that map back to a first-party package.
     *
     * Membership of PackageRegistry is the test, not a `particle-academy/`
     * prefix — that is what makes `prism` first-party here despite being a fork,
     * and what keeps a third-party dependency out.
     *
     * @param  list<string>  $requires
     * @return list<string>
     */
    private function firstPartyRequires(array $requires, string $registry): array
    {
        $key = self::DISTRIBUTION_KEY[$registry];
        $slugs = [];

        foreach ($requires as $name) {
            foreach (PackageRegistry::everything() as $pkg) {
                if (($pkg[$key] ?? null) === $name) {
                    $slugs[] = $pkg['slug'];
                    break;
                }
            }
        }

        return array_values(array_unique($slugs));
    }

    /** @return array<string, mixed>|null */
    private function findPackage(string $name): ?array
    {
        $name = trim($name);

        foreach (PackageRegistry::everything() as $pkg) {
            if ($pkg['slug'] === $name) {
                return $pkg;
            }
            foreach (self::DISTRIBUTION_KEY as $key) {
                if (($pkg[$key] ?? null) === $name) {
                    return $pkg;
                }
            }
        }

        return PackageRegistry::definitionFor($name);
    }

    /** @return array{manifest: array<string, mixed>}|null */
    private function findNode(string $name): ?array
    {
        $node = $this->nodes->find(FirstPartyNodeSource::slugFor($name));

        if ($node !== null) {
            return $node;
        }

        // A bare kind ("deep_research") is a legitimate alias.
        foreach ($this->nodes->all() as $candidate) {
            $manifest = $candidate['manifest'];
            if (($manifest['kind'] ?? null) === $name || in_array($name, (array) ($manifest['aliases'] ?? []), true)) {
                return $candidate;
            }
        }

        return null;
    }

    /**
     * @param  array{manifest: array<string, mixed>}  $node
     * @return array<string, mixed>
     */
    private function presentNode(array $node, string $lang): array
    {
        $manifest = $node['manifest'];
        $runtime = $lang === 'php' ? 'php' : 'ts';
        $spec = $manifest['runtimes'][$runtime] ?? null;

        $requires = [];
        foreach ((array) ($manifest['fancyDependencies'] ?? []) as $dep) {
            if (! is_array($dep)) {
                continue;
            }
            $name = $dep[$lang === 'php' ? 'composer' : 'npm'] ?? null;
            if (is_string($name) && ($pkg = $this->findPackage($name)) !== null) {
                $requires[] = $pkg['slug'];
            }
        }

        // The engine floor IS the node's version story. Name the package that
        // floor applies to, so the caller can act on it.
        $enginePackage = $lang === 'php' ? 'fancy-flow-php' : 'fancy-flow';

        return array_filter([
            'kind' => $manifest['kind'] ?? null,
            'title' => $manifest['title'] ?? null,
            'vendored' => true,
            'engine' => is_array($spec) ? ($spec['engine'] ?? null) : null,
            'engine_package' => $enginePackage,
            'runtime' => is_array($spec) ? $runtime : null,
            'unsupported_runtime' => is_array($spec)
                ? null
                : "This node declares no {$runtime} runtime, so it cannot run on {$lang}.",
            'requires_packages' => array_values(array_unique($requires)),
            'note' => 'A node is vendored source, not a dependency — there is no version to bump. Re-vendor with `npx fancy-cli@latest add node '.($manifest['kind'] ?? '').'` and make sure '.$enginePackage.' satisfies the engine floor above.',
        ], fn ($v) => $v !== null);
    }

    /** Which stacks a package does publish for. @param array<string, mixed> $pkg */
    private function stacksFor(array $pkg): array
    {
        $stacks = [];
        foreach (['composer' => 'php', 'npm' => 'node', 'pypi' => 'python'] as $key => $stack) {
            if (is_string($pkg[$key] ?? null) && $pkg[$key] !== '') {
                $stacks[$stack] = $pkg[$key];
            }
        }

        return $stacks;
    }

    private function installCommand(string $registry, string $name, ?string $version): string
    {
        $pin = $version === null ? '' : ($registry === 'composer' ? ":^{$version}" : "@{$version}");

        return match ($registry) {
            'composer' => "composer require {$name}{$pin}",
            'npm' => "npm install {$name}{$pin}",
            'pypi' => "pip install {$name}".($version === null ? '' : "=={$version}"),
        };
    }

    /** Split "name@version", tolerating the leading @ of a scoped npm package. */
    private function splitVersion(string $input): array
    {
        $input = trim($input);
        $at = strrpos($input, '@');

        if ($at === false || $at === 0) {
            return [$input, null];
        }

        $version = substr($input, $at + 1);

        // "@particle-academy/react-fancy" has an @ that is not a version marker.
        if ($version === '' || str_contains($version, '/')) {
            return [$input, null];
        }

        return [substr($input, 0, $at), ltrim($version, 'v^~>=< ')];
    }

    /** Reduce a range or prerelease to something version_compare can order. */
    private function comparable(string $version): string
    {
        return preg_match('/(\d+(?:\.\d+)*)/', $version, $m) === 1 ? $m[1] : '0';
    }

    /** @return list<string> */
    private function inputs(Request $request): array
    {
        $raw = $request->get('packages', []);

        if (is_string($raw)) {
            $raw = preg_split('/[\s,]+/', $raw) ?: [];
        }

        return array_values(array_filter(array_map(
            fn ($v) => is_string($v) ? trim($v) : '',
            is_array($raw) ? $raw : [],
        ), fn (string $v) => $v !== ''));
    }

    private function normalizeLang(string $lang): ?string
    {
        return self::ALIASES[strtolower(trim($lang))] ?? null;
    }

    /**
     * Strip bookkeeping keys before a row reaches the caller.
     *
     * @param  array<string, mixed>  $row
     * @return array<string, mixed>
     */
    private function withoutInternals(array $row): array
    {
        unset($row['_requires']);

        return $row;
    }

    public function schema(JsonSchema $schema): array
    {
        return [
            'packages' => $schema->array()
                ->description('The Fancy packages this project uses. Slugs ("react-fancy"), full distribution names ("@particle-academy/react-fancy", "particle-academy/holy-sheet"), or "name@version" to be told whether you are behind. fancy-flow marketplace node kinds are accepted too.')
                ->required(),
            'lang' => $schema->string()
                ->description('The stack this project installs into: "php" (Laravel/Composer), "node" (npm), or "python" (pip). Required — most Fancy capabilities ship as a matched PHP+Node pair under DIFFERENT names, so the language decides which distribution is resolved. Aliases accepted: laravel, js, ts, typescript, py, fastapi, django.')
                ->required(),
        ];
    }
}

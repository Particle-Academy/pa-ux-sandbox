<?php

namespace App\Support\Registry;

use Illuminate\Support\Facades\File;

/**
 * The PUBLISHED vendor connectors, read from the generated index.
 *
 * ## These are packages, and that is the whole distinction
 *
 * Every other node this registry serves is VENDORED: `NodeSource` reads source
 * off disk and `fancy-cli add node` copies it into the consumer's project, so
 * adding a node costs no new dependency. `NodeSource` says it plainly —
 * "there is no package".
 *
 * A connector is the opposite by construction. It ships as a matched set on
 * four registries — `<slug>-ui` and `<slug>-js` on npm, `<slug>-php` on
 * Packagist, `fancy-<slug>` on PyPI — and a consumer installs it. There is no
 * source to copy, and the four artifacts are the delivery mechanism rather than
 * an implementation detail of one.
 *
 * ## Why they are NOT in `/r/nodes/index.json`
 *
 * They cannot be, and the reason is a contract in the published CLI rather than
 * a preference here. `fancy-ui-cli`'s `NodeIndexItem` requires a `url`, and the
 * manifest that url resolves to requires `files` — "a node is vendored, not
 * installed: the files ARE the node". `NodeRegistryController::showFirstParty`
 * says the same from this side, and the build command warns on any node that
 * compiles to zero files.
 *
 * So a package-delivered connector placed in the vendoring index would resolve,
 * download, write nothing, and report success. That is not a hypothetical
 * failure mode — it is the one this registry already documents twice, under the
 * name "installs nothing and says nothing". A catalogue entry whose install
 * verb is wrong is worse than an absent one, because the absent one sends
 * somebody to the docs.
 *
 * Connectors therefore travel on their own surface, carrying install commands
 * instead of a vendoring url. The two-step browse (`list_connector_services`,
 * then one service's operations) is unchanged and is where they surface.
 *
 * ## A kind may have BOTH delivery paths, and that is not a collision
 *
 * Four connector nodes are already vendored here — `stripe-payment-intent`,
 * `stripe-webhook-trigger`, `resend-email-send`, `telegram-updates-trigger` —
 * and their manifest kinds are identical to the ones the published packages
 * declare. Verified against the artifacts, not assumed: the kind in each
 * `<slug>-ui` `dist/index.d.ts` matches the vendored manifest exactly, and our
 * `aliases` match the index's `kindAlias`.
 *
 * That makes them ONE capability reachable two ways — vendor the source, or
 * install the package — rather than two entries that happen to share a name.
 * `deliveryFor()` is what says so, and `ConnectorFacet::services()` must count
 * such a kind once. Counting it twice would inflate every service tally on the
 * catalogue's front door, and nothing downstream would contradict it.
 *
 * ## Why the version numbers matter enough to check
 *
 * The index names an exact version per package, and those versions are a claim
 * about four registries that this repo cannot see. The same claim shape has
 * gone stale here before — `kit:dogfood` exists because the showcase drifted
 * twenty-five packages behind while every surface reported fine, and
 * `PackageRegistry::HIDDEN` hid four packages that had already shipped.
 *
 * `connectors:check` is the answer, and it belongs beside this class rather
 * than inside it: reading the file and verifying the file describe different
 * failures, and folding them together would make an unreachable registry look
 * like a malformed index.
 */
class ConnectorSource
{
    /** @var array<string,mixed>|null */
    private ?array $index = null;

    /** @var list<array<string,mixed>>|null */
    private ?array $entries = null;

    /**
     * @param  string|null  $path  an alternative index, for tests and for the
     *                             verification command, which reads a candidate
     *                             file before it is allowed to become the served
     *                             one. Defaults to the shipped location.
     */
    public function __construct(private readonly ?string $path = null) {}

    /**
     * The generated index, or an empty document when it is absent.
     *
     * Absence is legitimate and not an error: the connector catalogue is
     * published separately from this app, and a checkout predating it has no
     * file. Every caller degrades to "no connectors", which is true.
     *
     * @return array<string,mixed>
     */
    public function index(): array
    {
        if ($this->index !== null) {
            return $this->index;
        }

        $path = $this->path ?? self::path();

        if (! File::exists($path)) {
            return $this->index = ['connectors' => []];
        }

        $decoded = json_decode(File::get($path), true);

        return $this->index = is_array($decoded) ? $decoded : ['connectors' => []];
    }

    /**
     * Every connector in the index, as generated.
     *
     * @return list<array<string,mixed>>
     */
    public function connectors(): array
    {
        return array_values(array_filter(
            (array) ($this->index()['connectors'] ?? []),
            fn ($c) => is_array($c) && is_string($c['service'] ?? null),
        ));
    }

    /**
     * One index entry per OPERATION, in the shape the connector surfaces read.
     *
     * An operation is the unit, not a connector: Stripe publishes one package
     * set and four kinds, and a catalogue that listed the package would be
     * unable to answer "can it refund". The index carries `kind` per operation
     * precisely so this mapping needs no derivation — composing it from
     * `service` + `operation` was measured at 4 correct out of 18, because a
     * kind is built from the node's own `kind` field rather than its operation.
     *
     * @return list<array<string,mixed>>
     */
    public function indexEntries(): array
    {
        if ($this->entries !== null) {
            return $this->entries;
        }

        $entries = [];

        foreach ($this->connectors() as $connector) {
            foreach ((array) ($connector['operations'] ?? []) as $operation) {
                if (! is_array($operation)) {
                    continue;
                }

                $entry = $this->entryFor($connector, $operation);

                if ($entry !== null) {
                    $entries[] = $entry;
                }
            }
        }

        usort($entries, fn (array $a, array $b) => [$a['service'], $a['kind']] <=> [$b['service'], $b['kind']]);

        return $this->entries = $entries;
    }

    /** A connector operation's graph category, from its IFTTT role. */
    private const CATEGORY_FOR_ROLE = [
        'trigger' => 'trigger',
        'action' => 'io',
        'search' => 'data',
    ];

    /**
     * One operation as an index entry, or null when it declares no kind.
     *
     * A missing `kind` is SKIPPED rather than synthesised. The registry is keyed
     * on kind everywhere — `unique('kind')`, `add node <kind>`, every listing —
     * so an invented one would be a new identity that resolves to nothing, and
     * it would sit beside a real entry for the same capability without either
     * looking wrong. Dropping it is visible in the count; guessing is not.
     *
     * @param  array<string,mixed>  $connector
     * @param  array<string,mixed>  $operation
     * @return array<string,mixed>|null
     */
    private function entryFor(array $connector, array $operation): ?array
    {
        $kind = $operation['kind'] ?? null;

        if (! is_string($kind) || $kind === '') {
            return null;
        }

        $role = (string) ($operation['role'] ?? 'action');
        $role = in_array($role, ConnectorFacet::ROLES, true) ? $role : 'action';

        return [
            'kind' => $kind,
            'aliases' => array_values(array_filter(
                [$operation['kindAlias'] ?? null],
                fn ($alias) => is_string($alias) && $alias !== '',
            )),
            'name' => (string) ($connector['packages']['ui']['name'] ?? ''),
            'title' => (string) ($operation['title'] ?? $kind),
            'description' => (string) ($operation['summary'] ?? ''),
            'category' => self::CATEGORY_FOR_ROLE[$role],
            'runtimes' => $this->runtimesFor($connector),

            // Assigned by the registry, never read from the index. These are
            // first-party packages built and released by the suite's own CI,
            // which is the evidence the flag is supposed to represent — a
            // package vouching for itself would mean nothing.
            'verified' => true,

            // The connector facet, so these entries filter and group exactly
            // like the vendored ones do.
            'connector' => true,
            'service' => (string) $connector['service'],
            'serviceTitle' => (string) ($connector['serviceTitle'] ?? $connector['service']),
            'domain' => $this->domainFor((string) ($connector['domain'] ?? '')),
            'role' => $role,

            // What makes this entry installable, in place of a vendoring url.
            'delivery' => 'package',
            'packages' => $this->packagesFor($connector),
            'environments' => array_values((array) ($connector['environments'] ?? [])),
            'sandbox' => (array) ($connector['sandbox'] ?? []),
            'sideEffects' => $operation['sideEffects'] ?? null,
            'docs' => $operation['docs'] ?? $connector['docs'] ?? null,
        ];
    }

    /**
     * The domain, or `other` when the index declares one we do not know.
     *
     * `ConnectorFacet::from()` makes the same choice for manifests and the
     * reasoning carries: a catalogue that refused to list a connector over a
     * grouping label would hide a working package for a cosmetic disagreement.
     *
     * The silent half of that trade is covered elsewhere —
     * `ConnectorDomainParityTest` pins this list against fancy-flow's published
     * `ConnectorDomain`, so a genuine divergence fails a build rather than
     * quietly bucketing.
     */
    private function domainFor(string $domain): string
    {
        return array_key_exists($domain, ConnectorFacet::DOMAINS) ? $domain : 'other';
    }

    /**
     * Runtime ids this connector implements, in the registry's vocabulary.
     *
     * The index names packages by REGISTRY (`js`, `php`, `py`); the node index
     * names runtimes by ENGINE (`ts`, `php`, `py`). They differ on exactly one
     * key, and translating here keeps that difference from leaking into every
     * consumer of the listing.
     *
     * `ui` is deliberately absent. It is the React surface, needed on every
     * backend, and the vendored manifests keep it out of `runtimes` for the
     * same reason: fold them together and a PHP host either loses its palette
     * entry or gains a JS executor it will never run.
     *
     * @param  array<string,mixed>  $connector
     * @return list<string>
     */
    private function runtimesFor(array $connector): array
    {
        $runtimes = [];

        foreach (['js' => 'ts', 'php' => 'php', 'py' => 'py'] as $key => $runtime) {
            if (is_array($connector['packages'][$key] ?? null)) {
                $runtimes[] = $runtime;
            }
        }

        return $runtimes;
    }

    /**
     * The install targets, version included.
     *
     * The version travels because it is the thing that can be wrong. A bare
     * package name always resolves to whatever `latest` happens to be, which
     * reads as current even when the index is months stale — the failure this
     * whole surface is built to avoid. `connectors:check` verifies these against
     * the registries; carrying them is what gives it something to verify.
     *
     * @param  array<string,mixed>  $connector
     * @return array<string,array<string,mixed>>
     */
    private function packagesFor(array $connector): array
    {
        $packages = [];

        foreach ((array) ($connector['packages'] ?? []) as $key => $package) {
            if (! is_array($package) || ! is_string($package['name'] ?? null)) {
                continue;
            }

            $packages[(string) $key] = [
                'name' => $package['name'],
                'version' => (string) ($package['version'] ?? ''),
                'registry' => (string) ($package['registry'] ?? ''),
                'installFirst' => (bool) ($package['installFirst'] ?? false),
            ];
        }

        return $packages;
    }

    /**
     * How a kind reaches a consumer: vendored source, an installed package, or
     * both.
     *
     * Both is the honest answer for the four that pre-date the published
     * catalogue, and saying so is the point of this method. The alternative —
     * letting `unique('kind')` pick whichever source was concatenated first —
     * would drop a real delivery path on the strength of an ordering nobody
     * chose deliberately.
     *
     * @param  list<string>  $vendoredKinds
     */
    public function deliveryFor(string $kind, array $vendoredKinds): string
    {
        $isPackage = in_array($kind, array_column($this->indexEntries(), 'kind'), true);
        $isVendored = in_array($kind, $vendoredKinds, true);

        return match (true) {
            $isPackage && $isVendored => 'both',
            $isPackage => 'package',
            default => 'vendor',
        };
    }

    /** Where the generated index lives, beside the registry it is served from. */
    public static function path(): string
    {
        return resource_path('registry/connectors.json');
    }
}

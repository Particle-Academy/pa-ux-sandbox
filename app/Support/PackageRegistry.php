<?php

namespace App\Support;

/**
 * Registry of Fancy UI packages + their components. Drives /packages,
 * /packages/{slug}, and /packages/{slug}/{component} routes.
 *
 * Future: scan each submodule's src/components/* at build time to keep
 * this in sync automatically. For Phase 1 we hand-curate.
 */
class PackageRegistry
{
    /**
     * Slugs hidden from every public surface — the package grid, /packages,
     * per-package detail pages, the on-site docs, the sitemap, and the compiled
     * registry.json (so the helper MCP / install tooling won't surface them
     * either). Use this for packages that are still in preview and not yet
     * released; their definitions stay below, so re-listing one is just deleting
     * its slug from this list (and re-running `php artisan registry:build`).
     *
     * {@see PackageFamily} honors this too: a family whose members are all
     * hidden shows no card and serves no page, so the listing can never invite
     * someone to `composer require` something that 404s.
     */
    public const HIDDEN = [
        // BUILT, NOT PUBLISHED. Verified against the registry on 2026-08-20:
        // `npm view @particle-academy/fancy-trading-ui` is a 404. Remove this
        // slug in the same change that tags the release, and re-run
        // `php artisan registry:build` -- until then the package must not reach
        // the grid, the docs, the sitemap, registry.json, `npx fancy-cli add`
        // or the MCP, because every one of those is an invitation to install
        // something that does not exist.
        'fancy-trading-ui',

        // The mechanism, and why it is kept even when empty: it is how a
        // built-but-unreleased
        // package stays out of the grid, /packages, the docs, the sitemap and
        // registry.json — and therefore out of `npx fancy-cli add` and the MCP —
        // without deleting its definition.
        //
        // It held four slugs until 2026-08-09 on the grounds that they were
        // "BUILT but UNPUBLISHED — no npm release, no Packagist release, no
        // tag". Every one of them was live by then: fancy-motion 0.1.0,
        // particle-academy/fancy-passkeys v0.2.0 on Packagist,
        // @particle-academy/fancy-passkeys 0.2.0 and fancy-passkeys-ui 0.2.0 on
        // npm. Four shipped packages were invisible to everyone.
        //
        // The lesson, since this list has no expiry: hiding is keyed on a claim
        // about a REGISTRY, and nothing re-checks it. Verify against the
        // registry before adding a slug, and again before believing one.
    ];

    /**
     * Packages that are DECIDED but do not exist yet.
     *
     * ## Why this list exists
     *
     * `fancy-trading` was designed in full — a 1,900-line plan, a seven-package
     * split approved by the owner, measured evidence behind every decision — and
     * then ONE package was built. The other six were not cancelled, deferred or
     * rejected. They were simply never started, and **nothing anywhere said so**,
     * because a package that does not exist appears in no registry, no repo
     * list, and no listing. It was found by someone asking "what happened to the
     * trading UI?" months later.
     *
     * A backlog held only in a plan document is a backlog nobody reads. This
     * list is the one place a decided-but-unbuilt package is visible, and
     * `php artisan kit:status` reports it beside the built ones so the gap is
     * impossible to miss.
     *
     * ## The rule
     *
     * **Add the entry BEFORE the work starts, not when the package ships.** An
     * entry added at publish time records history; an entry added at decision
     * time is what stops the package being lost between the two.
     *
     * Remove a slug from here in the same commit that adds its real entry to
     * {@see META} and {@see all()}. `PackageStatusTest` fails if a slug is in
     * both, because a package that is both planned and built is a list that has
     * stopped being maintained.
     *
     * Planned packages appear on NO public surface — not the grid, not the docs,
     * not `registry.json`, not the MCP. They are a development-status record, and
     * announcing something that cannot be installed is worse than saying nothing.
     *
     * @var array<string, array{name: string, repo: string, why: string}>
     */
    public const PLANNED = [
        'fancy-connector-core-py' => [
            'name' => 'fancy-connector-core',
            'repo' => 'Particle-Academy/fancy-connector-core-py',
            'why' => 'Python twin of the connector runtime -- the third after TS and PHP. Today every generated fancy-<provider> package carries its own urllib + hmac shim, which is the copy-cannot-be-upgraded problem the connector pivot exists to kill, reproduced once per provider. Seed exists: Weaver`s template/embed/py/_fake.py + _runtime.py, already proven byte-identical against the PHP and TS fakers by a suite that spawns all three. BUILT BY WEAVER, per the owner ruling of 2026-08-23 that Weaver owns everything connector-related in every language the kit supports -- do not build a connector runtime in parallel with it. Weaver is also the ONLY consumer: this entry once implied the Impactium chain wanted it, which was wrong (zero Python across all eight of their repos, and they declined), so build it to fit the generator rather than a hypothetical third party. PyPI name verified free 2026-08-23.',
        ],
        'fancy-json-rs' => [
            'name' => 'fancy-json',
            'repo' => 'Particle-Academy/fancy-json-rs',
            'why' => 'A lightweight, zero-dependency JSON parser + serializer in Rust, split out of fancy-flow-rs as its own crate on the owner\'s decision (2026-08-23). Rust has no JSON in its standard library -- the one thing PHP and Python ports get free -- so own it rather than depend on it. BUILT AND GREEN (53 tests); publish AUTHORISED but GATED. The original entry named the Impactium chain as the consumer -- that was WRONG, and the correction is kept rather than deleted because it is the useful part: they verified serde_json in exactly three crates, ALL host-side tooling, none in the deterministic state machine, and f64/f32 absent from the entire chain source, so our exact-integer/float split is a guarantee nobody there can violate. The property that would actually earn adoption is BYTE-DETERMINISM ACROSS TARGETS AND VERSIONS -- two runs must parse and re-serialise identical bytes identically, number formatting and key ordering included, because a non-determinism there is a chain halt rather than a bug. It must be tested AND STATED before the tag, since it constrains the serialiser permanently. Objects already use Vec<(String, Value)> plus a BTreeMap index rather than a HashMap, so the worst hazard -- per-process randomised key order -- is avoided by construction. The owner also holds that Impactium should avoid third-party where we can help it, so the small-audit-surface goal stands ALONGSIDE determinism, not instead of it. no_std + alloc, exact-integer/float split so money-shaped numbers never touch f64. Crate name `fancy-json` verified free on crates.io 2026-08-23 (a UA-less request 403s -- send a User-Agent and keep a known-published control, or every name looks taken).',
        ],
        'fancy-flow-rs' => [
            'name' => 'fancy-flow',
            'repo' => 'Particle-Academy/fancy-flow-rs',
            'why' => 'Rust runtime twin of the fancy-flow engine -- the fourth language after TS, PHP and Python. BUILT AND GREEN (46 tests, 0 ignored, one first-party dependency), asserted against the same fancy-conformance tables so parity is a test result rather than a claim. HELD UNPUBLISHED INDEFINITELY by owner decision 2026-08-23, recorded here so it does not read as work in flight: it was started for a blockchain consumer needing the engine in-process, and that consumer then could not confirm the requirement -- their dynamic-workflow layer is designed but not built. Their words: "There is no committed requirement today, and I do not want a crate tagged against a guess I made." A crates.io name can never be unpublished, so it waits here until a consumer commits. NOT abandoned and NOT to be deleted -- it stays compiling, and its dependency re-points to the published fancy-json once that ships. Crate name `fancy-flow` verified free on crates.io 2026-08-23 (a UA-less request 403s -- send a User-Agent or every name looks taken).',
        ],
        'fancy-trading-php' => [
            'name' => 'particle-academy/fancy-trading-php',
            'repo' => 'Particle-Academy/fancy-trading-php',
            'why' => 'The domain core in PHP, asserted against the same fancy-conformance table as the TS one.',
        ],
        'fancy-trading-py' => [
            'name' => 'fancy-trading',
            'repo' => 'Particle-Academy/fancy-trading-py',
            'why' => 'The domain core in Python. Quants live in Python; it is the runtime they reach for.',
        ],
        'fancy-trading-connect-js' => [
            'name' => '@particle-academy/fancy-trading-connect',
            'repo' => 'Particle-Academy/fancy-trading-connect-js',
            'why' => 'Venue sessions: book sync, private-state reconciliation, the fake/sandbox/live rule, per-venue adapters.',
        ],
        'fancy-trading-connect-php' => [
            'name' => 'particle-academy/fancy-trading-connect-php',
            'repo' => 'Particle-Academy/fancy-trading-connect-php',
            'why' => 'The same, for a Laravel backend.',
        ],
    ];

    /**
     * Every package the kit knows about, HIDDEN included, featured + companion.
     *
     * `kit:status` reads THIS rather than `all()` + `companions()`. Those two
     * apply {@see visible()}, so a slug in {@see HIDDEN} — which is exactly how
     * a BUILT-BUT-UNPUBLISHED package is marked — would have been dropped from
     * the one report that exists to surface it, and the command would have
     * reported a clean run over a package nobody could install.
     *
     * Never a public surface. `all()` and `companions()` remain the public ones.
     *
     * @return array<int, array<string, mixed>>
     */
    public static function everything(): array
    {
        return [...self::allRows(), ...self::companionRows()];
    }

    /** Decided-but-unbuilt packages, for `kit:status`. Never a public surface. */
    public static function planned(): array
    {
        return collect(self::PLANNED)
            ->map(fn (array $row, string $slug) => ['slug' => $slug] + $row)
            ->values()
            ->all();
    }

    /** Whether a slug is hidden from every public surface. */
    public static function isHidden(string $slug): bool
    {
        return in_array($slug, self::HIDDEN, true);
    }

    /**
     * Per-package design classification — the source of truth for the
     * /packages redesign's grouping + visual system. Mirrors the design
     * mockup's `pkgdata.jsx` shape: each slug carries
     *   group     — core | human | companion  (which tier it lists under)
     *   ecosystem — ts | php | polyglot        (drives the install-snippet + eco badge)
     *   kind      — ui | bridge | headless | block  (UI/bridge/block render preview tiles; headless render install-snippet tiles)
     *   accent    — hex                         (the package's signature color: glyph + hero gradient)
     *
     * Groups honor the design (e.g. fancy-seo / fancy-query / fancy-app-update
     * are CORE even though they live in companions() today). Slugs absent from
     * the design mockup use the sensible fallbacks called out in the brief.
     *
     * @var array<string, array{group:string, ecosystem:string, kind:string, accent:string}>
     */
    private const META = [
        // ── Fancy Core ───────────────────────────────────────────────────────
        'react-fancy' => ['group' => 'core', 'ecosystem' => 'ts', 'kind' => 'ui', 'accent' => '#8b5cf6'],
        'fancy-inertia' => ['group' => 'core', 'ecosystem' => 'ts', 'kind' => 'bridge', 'accent' => '#6366f1'],
        'fancy-query' => ['group' => 'core', 'ecosystem' => 'ts', 'kind' => 'headless', 'accent' => '#10b981'],
        'fancy-app-update' => ['group' => 'core', 'ecosystem' => 'ts', 'kind' => 'headless', 'accent' => '#f59e0b'],
        'fancy-seo' => ['group' => 'platform', 'ecosystem' => 'php', 'kind' => 'headless', 'accent' => '#0ea5e9'],

        // ── The Human+ surfaces ──────────────────────────────────────────────
        // agent-integrations lists under Human+ (it carries the "Core of Human+"
        // badge via its core:true flag), per the design mockup.
        'agent-integrations' => ['group' => 'core', 'ecosystem' => 'ts', 'kind' => 'bridge', 'accent' => '#f59e0b'],
        'fancy-whiteboard' => ['group' => 'surfaces', 'ecosystem' => 'ts', 'kind' => 'ui', 'accent' => '#8b5cf6'],
        'fancy-artboard' => ['group' => 'surfaces', 'ecosystem' => 'ts', 'kind' => 'ui', 'accent' => '#6366f1'],
        'fancy-flow' => ['group' => 'surfaces', 'ecosystem' => 'ts', 'kind' => 'ui', 'accent' => '#0ea5e9'],
        'fancy-sheets' => ['group' => 'surfaces', 'ecosystem' => 'ts', 'kind' => 'ui', 'accent' => '#10b981'],
        'fancy-slides' => ['group' => 'surfaces', 'ecosystem' => 'ts', 'kind' => 'ui', 'accent' => '#f43f5e'],
        'fancy-code' => ['group' => 'surfaces', 'ecosystem' => 'ts', 'kind' => 'ui', 'accent' => '#a78bfa'],
        'fancy-term' => ['group' => 'surfaces', 'ecosystem' => 'ts', 'kind' => 'ui', 'accent' => '#22c55e'],
        'fancy-tui' => ['group' => 'surfaces', 'ecosystem' => 'ts', 'kind' => 'ui', 'accent' => '#a78bfa'],
        'fancy-diff' => ['group' => 'surfaces', 'ecosystem' => 'ts', 'kind' => 'ui', 'accent' => '#eab308'],
        'fancy-pixel' => ['group' => 'platform', 'ecosystem' => 'ts', 'kind' => 'ui', 'accent' => '#f97316'],
        'fancy-echarts' => ['group' => 'surfaces', 'ecosystem' => 'ts', 'kind' => 'ui', 'accent' => '#0ea5e9'],
        'fancy-mlm-ui' => ['group' => 'commerce', 'ecosystem' => 'ts', 'kind' => 'ui', 'accent' => '#14b8a6'],
        'fancy-git-ui' => ['group' => 'tooling', 'ecosystem' => 'ts', 'kind' => 'ui', 'accent' => '#f97316'],
        'fancy-screens' => ['group' => 'surfaces', 'ecosystem' => 'ts', 'kind' => 'ui', 'accent' => '#8b5cf6'],
        'fancy-3d' => ['group' => 'surfaces', 'ecosystem' => 'ts', 'kind' => 'ui', 'accent' => '#6366f1'],
        // 3d adapters — not in the design mockup; sensible fallbacks per the brief.
        'fancy-3d-babylon' => ['group' => 'surfaces', 'ecosystem' => 'ts', 'kind' => 'ui', 'accent' => '#6366f1'],
        'fancy-3d-three' => ['group' => 'surfaces', 'ecosystem' => 'ts', 'kind' => 'ui', 'accent' => '#6366f1'],
        'fancy-motion' => ['group' => 'surfaces', 'ecosystem' => 'ts', 'kind' => 'ui', 'accent' => '#f43f5e'],
        'fancy-cms-ui' => ['group' => 'surfaces', 'ecosystem' => 'ts', 'kind' => 'ui', 'accent' => '#0ea5e9'],
        // Vendorable block (npx fancy-cli@latest add) — not a published package.
        'catalog-fms' => ['group' => 'commerce', 'ecosystem' => 'ts', 'kind' => 'block', 'accent' => '#0ea5e9'],

        // ── Everything else, by theme ────────────────────────────────────────
        // react-fancy UI companions — appear in the companion tier but still UI.
        'fancy-x-files-ui' => ['group' => 'platform', 'ecosystem' => 'ts', 'kind' => 'ui', 'accent' => '#8b5cf6'],
        'fancy-brand-icons' => ['group' => 'surfaces', 'ecosystem' => 'ts', 'kind' => 'ui', 'accent' => '#8b5cf6'],
        // Headless TS ports / collectors / tooling.
        'holy-sheet-js' => ['group' => 'documents', 'ecosystem' => 'ts', 'kind' => 'headless', 'accent' => '#16a34a'],
        'dark-slide-js' => ['group' => 'documents', 'ecosystem' => 'ts', 'kind' => 'headless', 'accent' => '#dc2626'],
        'last-word-js' => ['group' => 'documents', 'ecosystem' => 'ts', 'kind' => 'headless', 'accent' => '#2563eb'],
        'fancy-heuristics-js' => ['group' => 'platform', 'ecosystem' => 'ts', 'kind' => 'headless', 'accent' => '#0ea5e9'],
        'fancy-term-host' => ['group' => 'surfaces', 'ecosystem' => 'ts', 'kind' => 'headless', 'accent' => '#10b981'],
        'fancy-file-commons' => ['group' => 'documents', 'ecosystem' => 'ts', 'kind' => 'headless', 'accent' => '#eab308'],
        'fancy-x-files-js' => ['group' => 'platform', 'ecosystem' => 'ts', 'kind' => 'headless', 'accent' => '#64748b'],
        'fancy-auto-common' => ['group' => 'tooling', 'ecosystem' => 'ts', 'kind' => 'headless', 'accent' => '#6366f1'],
        'fancy-pwa' => ['group' => 'platform', 'ecosystem' => 'ts', 'kind' => 'headless', 'accent' => '#0ea5e9'],
        'docs-mcp' => ['group' => 'tooling', 'ecosystem' => 'ts', 'kind' => 'headless', 'accent' => '#0ea5e9'],
        'fancy-cli' => ['group' => 'tooling', 'ecosystem' => 'ts', 'kind' => 'headless', 'accent' => '#a78bfa'],
        // Headless PHP backends + infra.
        'holy-sheet' => ['group' => 'documents', 'ecosystem' => 'php', 'kind' => 'headless', 'accent' => '#10b981'],
        'dark-slide' => ['group' => 'documents', 'ecosystem' => 'php', 'kind' => 'headless', 'accent' => '#8b5cf6'],
        'last-word' => ['group' => 'documents', 'ecosystem' => 'php', 'kind' => 'headless', 'accent' => '#2563eb'],
        'fancy-heuristics' => ['group' => 'platform', 'ecosystem' => 'php', 'kind' => 'headless', 'accent' => '#8b5cf6'],
        'fancy-x-files' => ['group' => 'platform', 'ecosystem' => 'php', 'kind' => 'headless', 'accent' => '#64748b'],
        'fancy-cms' => ['group' => 'surfaces', 'ecosystem' => 'php', 'kind' => 'headless', 'accent' => '#0ea5e9'],
        'laravel-catalog' => ['group' => 'commerce', 'ecosystem' => 'php', 'kind' => 'headless', 'accent' => '#0ea5e9'],
        'laravel-fms' => ['group' => 'commerce', 'ecosystem' => 'php', 'kind' => 'headless', 'accent' => '#f59e0b'],
        'laravel-fun-lab' => ['group' => 'commerce', 'ecosystem' => 'php', 'kind' => 'headless', 'accent' => '#f43f5e'],
        'fancy-mlm' => ['group' => 'commerce', 'ecosystem' => 'php', 'kind' => 'headless', 'accent' => '#14b8a6'],
        'fancy-mlm-js' => ['group' => 'commerce', 'ecosystem' => 'ts', 'kind' => 'headless', 'accent' => '#14b8a6'],
        'fancy-git' => ['group' => 'tooling', 'ecosystem' => 'php', 'kind' => 'headless', 'accent' => '#f97316'],
        'fancy-git-js' => ['group' => 'tooling', 'ecosystem' => 'ts', 'kind' => 'headless', 'accent' => '#f97316'],
        // Previously unclassified — these silently fell through to the fallback
        // and looked like second-class "companions" despite being first-class.
        'fancy-map' => ['group' => 'surfaces', 'ecosystem' => 'ts', 'kind' => 'ui', 'accent' => '#10b981'],
        'fancy-catalog-js' => ['group' => 'commerce', 'ecosystem' => 'ts', 'kind' => 'headless', 'accent' => '#0ea5e9'],
        'fancy-features-js' => ['group' => 'commerce', 'ecosystem' => 'ts', 'kind' => 'headless', 'accent' => '#f59e0b'],
        // Git provider adapters — a PHP + Node mirror per host (brand accents).
        'fancy-git-github-php' => ['group' => 'tooling', 'ecosystem' => 'php', 'kind' => 'headless', 'accent' => '#6e5494'],
        'fancy-git-github-js' => ['group' => 'tooling', 'ecosystem' => 'ts', 'kind' => 'headless', 'accent' => '#6e5494'],
        'fancy-git-gitlab-php' => ['group' => 'tooling', 'ecosystem' => 'php', 'kind' => 'headless', 'accent' => '#fc6d26'],
        'fancy-git-gitlab-js' => ['group' => 'tooling', 'ecosystem' => 'ts', 'kind' => 'headless', 'accent' => '#fc6d26'],
        'fancy-git-bitbucket-php' => ['group' => 'tooling', 'ecosystem' => 'php', 'kind' => 'headless', 'accent' => '#0052cc'],
        'fancy-git-bitbucket-js' => ['group' => 'tooling', 'ecosystem' => 'ts', 'kind' => 'headless', 'accent' => '#0052cc'],
        // Passkeys (WebAuthn) — a PHP + Node backend mirror plus a React UI.
        'fancy-passkeys' => ['group' => 'platform', 'ecosystem' => 'php', 'kind' => 'headless', 'accent' => '#0891b2'],
        'fancy-passkeys-js' => ['group' => 'platform', 'ecosystem' => 'ts', 'kind' => 'headless', 'accent' => '#0891b2'],
        'fancy-passkeys-ui' => ['group' => 'platform', 'ecosystem' => 'ts', 'kind' => 'ui', 'accent' => '#0891b2'],
        // Education — courses, certification, and the authoring agent. A META
        // entry is not optional: a slug missing from here falls through to the
        // fallback bucket and silently reads as a second-class "companion".
        'laravel-courses' => ['group' => 'platform', 'ecosystem' => 'php', 'kind' => 'headless', 'accent' => '#8b5cf6'],
        'classroom' => ['group' => 'platform', 'ecosystem' => 'ts', 'kind' => 'ui', 'accent' => '#8b5cf6'],
        'teachers-aid' => ['group' => 'platform', 'ecosystem' => 'php', 'kind' => 'headless', 'accent' => '#a855f7'],
        'teachers-aid-ui' => ['group' => 'platform', 'ecosystem' => 'ts', 'kind' => 'ui', 'accent' => '#a855f7'],
        'laravel-jobs' => ['group' => 'platform', 'ecosystem' => 'php', 'kind' => 'headless', 'accent' => '#0d9488'],
        'job-board' => ['group' => 'platform', 'ecosystem' => 'ts', 'kind' => 'ui', 'accent' => '#0d9488'],
        // Workflow runtime twin, relay transport, shared document core.
        'fancy-flow-php' => ['group' => 'surfaces', 'ecosystem' => 'php', 'kind' => 'headless', 'accent' => '#0ea5e9'],
        'fancy-cf-relay' => ['group' => 'tooling', 'ecosystem' => 'ts', 'kind' => 'headless', 'accent' => '#f6821f'],
        'fancy-doc-commons' => ['group' => 'documents', 'ecosystem' => 'ts', 'kind' => 'headless', 'accent' => '#2563eb'],
        // The Laravel LLM layer the kit builds on -- a maintained fork.
        'prism' => ['group' => 'platform', 'ecosystem' => 'php', 'kind' => 'headless', 'accent' => '#a855f7'],
        // Polyglot single-file client.
        'mcp-relay-client' => ['group' => 'tooling', 'ecosystem' => 'polyglot', 'kind' => 'headless', 'accent' => '#22c55e'],
        // Cross-language conformance fixtures -- parity as a test result.
        'fancy-conformance' => ['group' => 'tooling', 'ecosystem' => 'polyglot', 'kind' => 'headless', 'accent' => '#14b8a6'],
        // Connector runtime + the installable connector set.
        'fancy-connector-core' => ['group' => 'platform', 'ecosystem' => 'ts', 'kind' => 'headless', 'accent' => '#f97316'],
        'fancy-connectors' => ['group' => 'platform', 'ecosystem' => 'ts', 'kind' => 'headless', 'accent' => '#f97316'],
        // Trading.
        'fancy-trading-js' => ['group' => 'commerce', 'ecosystem' => 'ts', 'kind' => 'headless', 'accent' => '#22c55e'],
        'fancy-trading-ui' => ['group' => 'surfaces', 'ecosystem' => 'ts', 'kind' => 'react', 'accent' => '#22c55e'],
        // Python backends -- each the third runtime of an existing pair.
        'fancy-flow-py' => ['group' => 'surfaces', 'ecosystem' => 'py', 'kind' => 'headless', 'accent' => '#0ea5e9'],
        'fancy-features-py' => ['group' => 'commerce', 'ecosystem' => 'py', 'kind' => 'headless', 'accent' => '#f59e0b'],
        'fancy-catalog-py' => ['group' => 'commerce', 'ecosystem' => 'py', 'kind' => 'headless', 'accent' => '#0ea5e9'],
        'holy-sheet-py' => ['group' => 'documents', 'ecosystem' => 'py', 'kind' => 'headless', 'accent' => '#16a34a'],
        'dark-slide-py' => ['group' => 'documents', 'ecosystem' => 'py', 'kind' => 'headless', 'accent' => '#dc2626'],
        'last-word-py' => ['group' => 'documents', 'ecosystem' => 'py', 'kind' => 'headless', 'accent' => '#2563eb'],
    ];

    /** Fallback classification for any slug missing from {@see META}. */
    private const META_FALLBACK = ['group' => 'tooling', 'ecosystem' => 'ts', 'kind' => 'headless', 'accent' => '#8b5cf6'];

    /**
     * Stamp a package definition with its design classification
     * (group / accent / ecosystem / kind). Hand-set values on the entry win
     * over {@see META}; META wins over {@see META_FALLBACK}.
     *
     * @param  array<string, mixed>  $pkg
     * @return array<string, mixed>
     */
    private static function classify(array $pkg): array
    {
        $meta = self::META[$pkg['slug'] ?? ''] ?? self::META_FALLBACK;

        return $pkg + $meta;
    }

    /** @return array<int, array<string, mixed>> */
    public static function all(): array
    {
        return self::visible(self::allRows());
    }

    /**
     * Every featured package, {@see HIDDEN} INCLUDED.
     *
     * For release tooling only — never a public surface. `kit:status` needs it
     * because hiding and not-existing are different states and the command's
     * whole job is to tell them apart: a built-but-unpublished package is
     * hidden from the grid ON PURPOSE, and reading `all()` there would have
     * dropped it from the one report that exists to surface it.
     *
     * @return array<int, array<string, mixed>>
     */
    private static function allRows(): array
    {
        return array_map(self::classify(...), [
            self::reactFancy(),
            self::fancyWhiteboard(),
            self::fancyArtboard(),
            self::fancyFlow(),
            self::fancySheets(),
            self::fancySlides(),
            self::fancyCode(),
            self::catalogFms(),
            self::fancyTerm(),
            self::fancyTui(),
            self::fancyDiff(),
            self::fancyPixel(),
            self::fancyEcharts(),
            self::fancyMlmUi(),
            self::fancyPasskeysUi(),
            self::laravelCourses(),
            self::classroom(),
            self::teachersAid(),
            self::teachersAidUi(),
            self::laravelJobs(),
            self::jobBoard(),
            self::fancyGitUi(),
            self::fancyXFilesUi(),
            self::fancyScreens(),
            self::fancy3d(),
            self::fancy3dBabylon(),
            self::fancy3dThree(),
            self::fancyMap(),
            self::agentIntegrations(),
            self::fancyInertia(),
            self::fancyPwa(),
            self::fancyMotion(),
            self::fancyCmsUi(),
        ]);
    }

    /**
     * Drop any {@see HIDDEN} (unreleased / preview) packages from a list.
     *
     * @param  array<int, array<string, mixed>>  $packages
     * @return array<int, array<string, mixed>>
     */
    private static function visible(array $packages): array
    {
        return array_values(array_filter(
            $packages,
            static fn (array $p): bool => ! in_array($p['slug'] ?? null, self::HIDDEN, true),
        ));
    }

    /**
     * The no-UI half of the catalog — headless deps developed alongside the
     * Fancy UI kit. holy-sheet + dark-slide are the agentic document writers
     * (xlsx / pptx); the laravel-* trio are composer deps the sandbox develops
     * against. None render a UI surface, so they live in a footnote section on
     * /packages rather than the main component grid; no per-package detail
     * page is generated.
     *
     * @return array<int, array<string, mixed>>
     */
    public static function companions(): array
    {
        return self::visible(self::companionRows());
    }

    /**
     * Every companion package, {@see HIDDEN} included. See {@see allRows()}.
     *
     * @return array<int, array<string, mixed>>
     */
    private static function companionRows(): array
    {
        return array_map(self::classify(...), [
            [
                'slug' => 'holy-sheet',
                'name' => 'particle-academy/holy-sheet',
                'tagline' => 'PHP 8.2+ xlsx writer for agentic document creation. Headless — top-level Agent write/describe/lint API, optional Laravel adapter.',
                'composer' => 'particle-academy/holy-sheet',
                'repo' => 'Particle-Academy/holy-sheet',
                'packagist' => 'particle-academy/holy-sheet',
                'language' => 'PHP',
            ],
            [
                'slug' => 'dark-slide',
                'name' => 'particle-academy/dark-slide',
                'tagline' => 'PHP 8.2+ pptx writer/reader for agentic deck creation — markdown headings, highlighted code, tables, gradients, high-fidelity reader. Sister to holy-sheet.',
                'composer' => 'particle-academy/dark-slide',
                'repo' => 'Particle-Academy/dark-slide',
                'packagist' => 'particle-academy/dark-slide',
                'language' => 'PHP',
            ],
            [
                'slug' => 'last-word',
                'name' => 'particle-academy/last-word',
                'tagline' => 'PHP 8.2+ docx writer/reader for agentic word-processing documents — a JSON Doc model (headings / styled runs / nested lists / tables / code / quotes / images), markdown bridges both ways, and Agent read/write/describe. Sister to holy-sheet (xlsx) and dark-slide (pptx).',
                'composer' => 'particle-academy/last-word',
                'repo' => 'Particle-Academy/last-word',
                'packagist' => 'particle-academy/last-word',
                'language' => 'PHP',
            ],
            [
                'slug' => 'last-word-js',
                'name' => '@particle-academy/last-word',
                'tagline' => 'Node/TS mirror of particle-academy/last-word — zero-dependency, isomorphic docx writer/reader with the same JSON Doc model + markdown bridges, so react-fancy Editor consumers round-trip Word files without a mammoth/turndown/docx converter sandwich. Headless; no UI.',
                'npm' => '@particle-academy/last-word',
                'repo' => 'Particle-Academy/last-word-js',
                'language' => 'TypeScript',
            ],
            [
                'slug' => 'laravel-catalog',
                'name' => 'particle-academy/laravel-catalog',
                'tagline' => 'Stripe catalog (Products + Prices) via a facade API. Used by the sandbox for the demo storefront.',
                'composer' => 'particle-academy/laravel-catalog',
                'repo' => 'Particle-Academy/laravel-catalog',
                'packagist' => 'particle-academy/laravel-catalog',
                'language' => 'PHP',
            ],
            [
                'slug' => 'laravel-fms',
                'name' => 'particle-academy/laravel-fms',
                'tagline' => 'Feature Management System — gate/policy/config/registry-driven feature access. Pairs with laravel-catalog for entitlement-based UI.',
                'composer' => 'particle-academy/laravel-fms',
                'repo' => 'Particle-Academy/laravel-feature-management-system',
                'packagist' => 'particle-academy/laravel-fms',
                'language' => 'PHP',
            ],
            [
                'slug' => 'laravel-fun-lab',
                'name' => 'particle-academy/laravel-fun-lab',
                'tagline' => 'Analytics-driven gamification — XP, achievements, prizes, and leaderboards. Powers the sandbox\'s engagement economy.',
                'composer' => 'particle-academy/laravel-fun-lab',
                'repo' => 'Particle-Academy/laravel-fun-lab',
                'packagist' => 'particle-academy/laravel-fun-lab',
                'language' => 'PHP',
            ],
            [
                'slug' => 'fancy-mlm',
                'name' => 'particle-academy/fancy-mlm',
                'tagline' => 'Framework-agnostic multi-level referral / network-marketing engine — configurable unilevel / binary / matrix downlines, level decay + tier multipliers, dynamic compression. Pure-PHP core with an optional Laravel bridge + fun-lab / catalog / fms integration. Headless; pairs with @particle-academy/fancy-mlm-ui.',
                'composer' => 'particle-academy/fancy-mlm',
                'repo' => 'Particle-Academy/fancy-mlm-php',
                'packagist' => 'particle-academy/fancy-mlm',
                'language' => 'PHP',
            ],
            [
                'slug' => 'fancy-mlm-js',
                'name' => '@particle-academy/fancy-mlm',
                'tagline' => 'Node/TS mirror of particle-academy/fancy-mlm — the same CompensationPlan JSON + unilevel / binary / matrix trees yield identical rewards, isomorphic (browser or Node). Headless; no UI.',
                'npm' => '@particle-academy/fancy-mlm',
                'repo' => 'Particle-Academy/fancy-mlm-js',
                'language' => 'TypeScript',
            ],
            [
                'slug' => 'fancy-passkeys',
                'name' => 'particle-academy/fancy-passkeys',
                'tagline' => 'Passkey (WebAuthn) login for PHP — registration + authentication ceremonies, discoverable (usernameless) credentials, single-use server-side challenges, clone detection via the signature counter, and a Laravel bridge that augments Fortify rather than replacing it. A thin wrapper over web-auth/webauthn-lib: no cryptography of our own. Headless; pairs with @particle-academy/fancy-passkeys-ui.',
                'composer' => 'particle-academy/fancy-passkeys',
                'repo' => 'Particle-Academy/fancy-passkeys-php',
                'packagist' => 'particle-academy/fancy-passkeys',
                'language' => 'PHP',
            ],
            [
                'slug' => 'fancy-passkeys-js',
                'name' => '@particle-academy/fancy-passkeys',
                'tagline' => 'Node/TS mirror of particle-academy/fancy-passkeys — the same four-endpoint wire contract, byte-compatible options payloads (pinned by shared fixtures), and the same challenge / counter / redaction policy, so one React UI works against either backend. Wraps @simplewebauthn/server. Headless; framework-free with a dependency-free HTTP adapter.',
                'npm' => '@particle-academy/fancy-passkeys',
                'repo' => 'Particle-Academy/fancy-passkeys-js',
                'language' => 'TypeScript',
            ],
            [
                'slug' => 'fancy-git',
                'name' => 'particle-academy/fancy-git',
                'tagline' => 'Framework-agnostic PHP Git engine with normalized provider contracts and proposal-first mutations.',
                'composer' => 'particle-academy/fancy-git',
                'repo' => 'Particle-Academy/fancy-git-php',
                'packagist' => 'particle-academy/fancy-git',
                'language' => 'PHP',
            ],
            [
                'slug' => 'fancy-git-js',
                'name' => '@particle-academy/fancy-git',
                'tagline' => 'Node/TypeScript Git engine and normalized GitHub, GitLab, and Bitbucket provider contracts.',
                'npm' => '@particle-academy/fancy-git',
                'repo' => 'Particle-Academy/fancy-git-js',
                'language' => 'TypeScript',
            ],
            // Git provider adapters — one PHP + Node mirror per host, plugged
            // into the fancy-git engine's normalized provider contract.
            [
                'slug' => 'fancy-git-github-php',
                'name' => 'particle-academy/fancy-git-github',
                'tagline' => 'GitHub.com and GitHub Enterprise adapter for particle-academy/fancy-git.',
                'composer' => 'particle-academy/fancy-git-github',
                'repo' => 'Particle-Academy/fancy-git-github-php',
                'packagist' => 'particle-academy/fancy-git-github',
                'language' => 'PHP',
            ],
            [
                'slug' => 'fancy-git-github-js',
                'name' => '@particle-academy/fancy-git-github',
                'tagline' => 'GitHub.com and GitHub Enterprise adapter for @particle-academy/fancy-git.',
                'npm' => '@particle-academy/fancy-git-github',
                'repo' => 'Particle-Academy/fancy-git-github-js',
                'language' => 'TypeScript',
            ],
            [
                'slug' => 'fancy-git-gitlab-php',
                'name' => 'particle-academy/fancy-git-gitlab',
                'tagline' => 'GitLab.com and Self-Managed adapter for particle-academy/fancy-git.',
                'composer' => 'particle-academy/fancy-git-gitlab',
                'repo' => 'Particle-Academy/fancy-git-gitlab-php',
                'packagist' => 'particle-academy/fancy-git-gitlab',
                'language' => 'PHP',
            ],
            [
                'slug' => 'fancy-git-gitlab-js',
                'name' => '@particle-academy/fancy-git-gitlab',
                'tagline' => 'GitLab.com and GitLab Self-Managed adapter for @particle-academy/fancy-git.',
                'npm' => '@particle-academy/fancy-git-gitlab',
                'repo' => 'Particle-Academy/fancy-git-gitlab-js',
                'language' => 'TypeScript',
            ],
            [
                'slug' => 'fancy-git-bitbucket-php',
                'name' => 'particle-academy/fancy-git-bitbucket',
                'tagline' => 'Bitbucket Cloud adapter for particle-academy/fancy-git.',
                'composer' => 'particle-academy/fancy-git-bitbucket',
                'repo' => 'Particle-Academy/fancy-git-bitbucket-php',
                'packagist' => 'particle-academy/fancy-git-bitbucket',
                'language' => 'PHP',
            ],
            [
                'slug' => 'fancy-git-bitbucket-js',
                'name' => '@particle-academy/fancy-git-bitbucket',
                'tagline' => 'Bitbucket Cloud adapter for @particle-academy/fancy-git.',
                'npm' => '@particle-academy/fancy-git-bitbucket',
                'repo' => 'Particle-Academy/fancy-git-bitbucket-js',
                'language' => 'TypeScript',
            ],
            [
                'slug' => 'fancy-flow-php',
                'name' => 'particle-academy/fancy-flow-php',
                'tagline' => 'PHP runtime for fancy-flow workflow graphs — the framework-free twin of @particle-academy/fancy-flow\'s engine. Same WorkflowSchema JSON in, same outputs out; author in <FlowEditor>, run on PHP. Adds a Laravel layer: queued durable runs with resume-from-checkpoint, human approval + user_input pauses, and an agent node. Headless; no UI.',
                'composer' => 'particle-academy/fancy-flow-php',
                'repo' => 'Particle-Academy/fancy-flow-php',
                'packagist' => 'particle-academy/fancy-flow-php',
                'language' => 'PHP',
                'pairs' => ['fancy-flow'],
            ],
            [
                'slug' => 'fancy-cf-relay',
                'name' => '@particle-academy/fancy-cf-relay',
                'tagline' => 'CDN-safe browser relay channel for agent-integrations\' RelayTransport. Adaptive SSE↔long-poll with Cloudflare detection, so the MCP relay survives a Cloudflare/HTTP-3 edge that resets long-lived SSE streams. Zero runtime deps.',
                'npm' => '@particle-academy/fancy-cf-relay',
                'repo' => 'Particle-Academy/fancy-cf-relay',
                'language' => 'TypeScript',
                'pairs' => ['agent-integrations'],
            ],
            [
                'slug' => 'fancy-doc-commons',
                'name' => '@particle-academy/fancy-doc-commons',
                'tagline' => 'Shared pure core for the Fancy document/surface packages — the model an agent or human emits and edits. Flat node-tree + collab-safe fractional ordering, a typed op-spine contract (reduce + invert), an infinite-canvas primitive, and a surface-agnostic staged-write (accept/reject) model. Zero dependencies, no React.',
                'npm' => '@particle-academy/fancy-doc-commons',
                'repo' => 'Particle-Academy/fancy-doc-commons',
                'language' => 'TypeScript',
            ],
            [
                'slug' => 'fancy-heuristics',
                'name' => 'particle-academy/fancy-heuristics',
                'tagline' => 'End-user optimization, not search-engine optimization — human + agent interaction analytics for Laravel: event ingestion, focus heatmaps, and session/actor rollups, plus Fancy Pixel verification. Server side of fancy-pixel / fancy-heuristics-js.',
                'composer' => 'particle-academy/fancy-heuristics',
                'repo' => 'Particle-Academy/fancy-heuristics',
                'packagist' => 'particle-academy/fancy-heuristics',
                'language' => 'PHP',
            ],
            [
                'slug' => 'fancy-cms',
                'name' => 'particle-academy/fancy-cms',
                'tagline' => 'Laravel host + PHP page renderer for the Stages doc model: node tree → HTML with island hydration; backend pair of the fancy-cms-ui editor. Pre-1.0 — the API may still move between minors; issues at github.com/Particle-Academy/fancy-cms/issues.',
                'composer' => 'particle-academy/fancy-cms',
                'repo' => 'Particle-Academy/fancy-cms',
                'packagist' => 'particle-academy/fancy-cms',
                'language' => 'PHP',
            ],
            [
                'slug' => 'fancy-seo',
                'name' => 'particle-academy/fancy-seo',
                'tagline' => 'Server-rendered SEO + crawlability for Laravel + Inertia — per-route meta / Open Graph / Twitter / JSON-LD on the first byte, dynamic sitemap.xml / robots.txt / llms.txt, and per-page Markdown. The PHP baseline that pairs with @particle-academy/fancy-inertia\'s <Seo>.',
                'composer' => 'particle-academy/fancy-seo',
                'repo' => 'Particle-Academy/fancy-seo',
                'packagist' => 'particle-academy/fancy-seo',
                'language' => 'PHP',
                'core' => true,
            ],
            [
                'slug' => 'fancy-x-files',
                'name' => 'particle-academy/fancy-x-files',
                'tagline' => 'Well-known + agent-facing files for Laravel from one declarative registry — robots.txt, security.txt (RFC 9116), humans.txt, llms.txt, sitemap.xml, AGENTS — with a protect() guard that keeps private paths Disallowed for EVERY bot group (no per-bot leak).',
                'composer' => 'particle-academy/fancy-x-files',
                'repo' => 'Particle-Academy/fancy-x-files',
                'packagist' => 'particle-academy/fancy-x-files',
                'language' => 'PHP',
            ],
            [
                'slug' => 'fancy-x-files-js',
                'name' => '@particle-academy/fancy-x-files',
                'tagline' => 'Node/TS port of fancy-x-files — the same robots / security.txt / humans / llms / sitemap model, builders, and validators, isomorphic (browser or Node). Headless; no UI.',
                'npm' => '@particle-academy/fancy-x-files',
                'repo' => 'Particle-Academy/fancy-x-files-js',
                'language' => 'TypeScript',
            ],
            [
                'slug' => 'fancy-auto-common',
                'name' => '@particle-academy/fancy-auto-common',
                'tagline' => 'Shared Human+ primitives — AgentActivity events, presence, undo stacks, and effect helpers. Low-level plumbing reused across the kit; usually installed transitively.',
                'npm' => '@particle-academy/fancy-auto-common',
                'repo' => 'Particle-Academy/fancy-auto-common',
                'language' => 'TypeScript',
            ],
            [
                'slug' => 'fancy-brand-icons',
                'name' => '@particle-academy/fancy-brand-icons',
                'tagline' => 'Brand-icon addendum for react-fancy — your logos + curated CC0 third-party marks (GitHub, X, Slack, Stripe, …) layered on top of any active icon set, so bare <Icon name="github"/> resolves the brand mark. Zero runtime deps; tree-shakeable.',
                'npm' => '@particle-academy/fancy-brand-icons',
                'repo' => 'Particle-Academy/fancy-brand-icons',
                'language' => 'TypeScript',
            ],
            [
                'slug' => 'mcp-relay-client',
                'name' => 'mcp-relay-client',
                'tagline' => 'Super-lite, single-file MCP client (bash / Python / TS / Go) for connecting an agent to a session-based relay — drive any agent-integrations-hosted app (e.g. the Agent Playground) from your terminal. Download one file, or run the zero-install npx CLI; point it at a session URL.',
                'npm' => 'mcp-relay-client',
                'repo' => 'Particle-Academy/mcp-relay-client',
                'download' => 'curl -O https://raw.githubusercontent.com/Particle-Academy/mcp-relay-client/main/connect.sh',
                'language' => 'Polyglot (bash / Python / TS / Go)',
            ],
            // Headless TS packages — no UI surface, so they live here, not in the grid.
            [
                'slug' => 'fancy-query',
                'name' => '@particle-academy/fancy-query',
                'tagline' => 'Server-state for Inertia + Echo — a thin TanStack Query wrapper with Inertia hydration and Echo-driven cache invalidation. Hooks only, no UI.',
                'npm' => '@particle-academy/fancy-query',
                'repo' => 'Particle-Academy/fancy-query',
                'language' => 'TypeScript',
                'core' => true,
            ],
            [
                'slug' => 'dark-slide-js',
                'name' => '@particle-academy/dark-slide',
                'tagline' => 'Node/TS port of dark-slide — pptx writer/reader for agentic decks, isomorphic (browser or Node). Headless Agent API; no UI.',
                'npm' => '@particle-academy/dark-slide',
                'repo' => 'Particle-Academy/dark-slide-js',
                'language' => 'TypeScript',
            ],
            [
                'slug' => 'holy-sheet-js',
                'name' => '@particle-academy/holy-sheet',
                'tagline' => 'Node/TS port of holy-sheet — xlsx writer/reader + formula linter, isomorphic. Headless Agent API; no UI.',
                'npm' => '@particle-academy/holy-sheet',
                'repo' => 'Particle-Academy/holy-sheet-js',
                'language' => 'TypeScript',
            ],
            [
                'slug' => 'fancy-app-update',
                'name' => '@particle-academy/fancy-app-update',
                'tagline' => 'Framework-agnostic "a new version is available — refresh" detector for any React app — custom API, version compare, or zero-config ETag polling. No Inertia/PHP; self-contained prompt. fancy-inertia adds an Inertia-409 default on top.',
                'npm' => '@particle-academy/fancy-app-update',
                'repo' => 'Particle-Academy/fancy-app-update',
                'language' => 'TypeScript',
                'core' => true,
            ],
            [
                'slug' => 'fancy-term-host',
                'name' => '@particle-academy/fancy-term-host',
                'tagline' => 'Headless Node terminal backend for fancy-term — owns the PTYs (node-pty peer) and the T1/T2/T3 persistence engine (snapshot+replay, retained PTYs, detached pty-host) behind four injected ports. No UI.',
                'npm' => '@particle-academy/fancy-term-host',
                'repo' => 'Particle-Academy/fancy-term-host',
                'language' => 'TypeScript',
            ],
            [
                'slug' => 'fancy-file-commons',
                'name' => '@particle-academy/fancy-file-commons',
                'tagline' => 'Shared pure core for the file-focused packages (editors / viewers / writers / diff surfaces) — the structured diff engine + model, git unified-diff parser, merge resolution, per-line gutter annotations, path helpers, and filename→language. Zero deps, no React; fancy-diff re-exports it and the fancy-code diff gutter runs on it.',
                'npm' => '@particle-academy/fancy-file-commons',
                'repo' => 'Particle-Academy/fancy-file-commons',
                'language' => 'TypeScript',
            ],
            // Showcase analytics: a headless browser collector (the verification
            // badge that pairs with it — fancy-pixel — renders UI, so it lives in
            // the main grid, not here).
            [
                'slug' => 'fancy-heuristics-js',
                'name' => '@particle-academy/fancy-heuristics-js',
                'tagline' => 'Browser collector for Fancy Heuristics — clicks, scroll, time-on-page, and mouse-movement focus heatmaps for humans and agents; sendBeacon batching. Headless.',
                'npm' => '@particle-academy/fancy-heuristics-js',
                'repo' => 'Particle-Academy/fancy-heuristics-js',
                'language' => 'TypeScript',
            ],
            [
                'slug' => 'fancy-features-js',
                'name' => '@particle-academy/fancy-features',
                'tagline' => 'Node/TS port of laravel-fms — headless, framework-agnostic feature management: gate / registry / config / group strategies + metered quotas. Owns the FeatureSource contract @particle-academy/fancy-catalog plugs into. No UI.',
                'npm' => '@particle-academy/fancy-features',
                'repo' => 'Particle-Academy/fancy-features-js',
                'language' => 'TypeScript',
            ],
            [
                'slug' => 'fancy-catalog-js',
                'name' => '@particle-academy/fancy-catalog',
                'tagline' => 'Node/TS port of laravel-catalog — headless Stripe catalog (products / prices / plans + checkout), adapter-based with an injected Stripe client. Composes with @particle-academy/fancy-features for entitlements via its ./features bridge. No UI.',
                'npm' => '@particle-academy/fancy-catalog',
                'repo' => 'Particle-Academy/fancy-catalog-js',
                'language' => 'TypeScript',
            ],
            // Tooling — MCP docs server + the source-vendoring CLI. No app-facing
            // UI; they're how you discover and pull the rest of the suite.
            [
                'slug' => 'docs-mcp',
                'name' => '@particle-academy/docs-mcp',
                'tagline' => 'MCP docs server — serves the Fancy UI documentation to agents over MCP, so an assistant can answer questions and pull usage straight from the source.',
                'npm' => '@particle-academy/docs-mcp',
                'repo' => 'Particle-Academy/docs-mcp',
                'language' => 'TypeScript',
            ],
            [
                'slug' => 'fancy-cli',
                'name' => 'fancy-cli',
                'tagline' => 'Source-vendoring CLI — `npx fancy-cli@latest add <component>` copies component source from the registry into your project (the shadcn-style own-the-source path).',
                'npm' => 'fancy-cli',
                'repo' => 'Particle-Academy/fancy-ui-cli',
                'language' => 'TypeScript',
            ],
            [
                'slug' => 'fancy-conformance',
                'name' => '@particle-academy/fancy-conformance',
                'tagline' => 'Shared cross-language fixture tables, so parity between a PHP twin and its Node/Python siblings is a TEST RESULT rather than a claim in a README.',
                'npm' => '@particle-academy/fancy-conformance',
                'repo' => 'Particle-Academy/fancy-conformance',
                'language' => 'Polyglot',
            ],
            [
                'slug' => 'fancy-connector-core',
                'name' => '@particle-academy/fancy-connector-core',
                'tagline' => 'The connector runtime: typed delivery, failure classification (unreachable / refused / ambiguous / rejected), retries, and sandbox-vs-live selection. Every connector is built on it.',
                'npm' => '@particle-academy/fancy-connector-core',
                'repo' => 'Particle-Academy/fancy-connector-core',
                'language' => 'TypeScript',
            ],
            [
                'slug' => 'fancy-connectors',
                'name' => '@particle-academy/fancy-connectors',
                'tagline' => 'Installable connectors for third-party APIs -- triggers, actions, sandbox endpoints where a provider offers one, and a faker for every connector regardless.',
                'npm' => '@particle-academy/fancy-connectors',
                'repo' => 'Particle-Academy/fancy-connectors',
                'language' => 'TypeScript',
            ],
            [
                'slug' => 'fancy-trading-js',
                'name' => '@particle-academy/fancy-trading',
                'tagline' => 'Plumbing for stock / futures / crypto / event trading apps -- market data, order and position models, and chart surfaces. Deliberately unopinionated about how you build a strategy.',
                'npm' => '@particle-academy/fancy-trading',
                'repo' => 'Particle-Academy/fancy-trading-js',
                'language' => 'TypeScript',
            ],
            [
                'slug' => 'fancy-trading-ui',
                'name' => '@particle-academy/fancy-trading-ui',
                'tagline' => 'Trading surfaces -- order ticket, price ladder/DOM, book, depth, tape, blotter, positions, watchlist, alerts, and a session-aware chart on lightweight-charts. Controlled, agent-bridgeable, and built around a safety floor a prop cannot switch off.',
                'npm' => '@particle-academy/fancy-trading-ui',
                'repo' => 'Particle-Academy/fancy-trading-ui',
                'language' => 'TypeScript',
            ],
            [
                'slug' => 'fancy-flow-py',
                'name' => 'fancy-flow',
                'tagline' => 'Python runtime twin of the fancy-flow engine -- the same graph, the same node kinds, durable and queued runs. Pairs with fancy-flow (TS) and fancy-flow-php.',
                'pypi' => 'fancy-flow',
                'repo' => 'Particle-Academy/fancy-flow-py',
                'language' => 'Python',
            ],
            [
                'slug' => 'fancy-features-py',
                'name' => 'fancy-features',
                'tagline' => 'Python twin of laravel-fms -- feature flags and metered-resource gating, framework-free. Same FeatureSource contract as the PHP and Node siblings.',
                'pypi' => 'fancy-features',
                'repo' => 'Particle-Academy/fancy-features-py',
                'language' => 'Python',
            ],
            [
                'slug' => 'fancy-catalog-py',
                'name' => 'fancy-catalog',
                'tagline' => 'Python twin of laravel-catalog -- Stripe products, prices, plans and checkout, framework-free.',
                'pypi' => 'fancy-catalog',
                'repo' => 'Particle-Academy/fancy-catalog-py',
                'language' => 'Python',
            ],
            [
                'slug' => 'holy-sheet-py',
                'name' => 'fancy-holy-sheet',
                'tagline' => 'Python port of holy-sheet -- xlsx writer/reader for agentic documents. Headless; no UI.',
                'pypi' => 'fancy-holy-sheet',
                'repo' => 'Particle-Academy/holy-sheet-py',
                'language' => 'Python',
            ],
            [
                'slug' => 'dark-slide-py',
                'name' => 'fancy-dark-slide',
                'tagline' => 'Python port of dark-slide -- pptx writer/reader for agentic documents. Headless; no UI.',
                'pypi' => 'fancy-dark-slide',
                'repo' => 'Particle-Academy/dark-slide-py',
                'language' => 'Python',
            ],
            [
                'slug' => 'last-word-py',
                'name' => 'fancy-last-word',
                'tagline' => 'Python port of last-word -- docx writer/reader for agentic documents, with markdown bridges. Headless; no UI.',
                'pypi' => 'fancy-last-word',
                'repo' => 'Particle-Academy/last-word-py',
                'language' => 'Python',
            ],
            // A MAINTAINED FORK, not a package we authored -- and registered
            // for exactly that reason. It was published, consumed and released
            // for months while appearing in no registry of ours: `kit:status`
            // could not see it, `/packages` did not list it, the MCP did not
            // serve it. Nothing tracked the package, so nothing tracked what
            // the package depended on, and a provider inside it was found to
            // be five weeks from a vendor deprecation that no surface here
            // could have surfaced.
            //
            // That is the same blind spot as `fancy-trading` (six approved
            // packages never started, nothing said so) and `HIDDEN` (four
            // shipped packages hidden by a stale claim). Registration is what
            // makes a package's releases visible to a check rather than to
            // somebody's memory.
            [
                'slug' => 'prism',
                'name' => 'particle-academy/prism',
                'tagline' => 'Maintained fork of prism-php/prism -- the Laravel LLM integration layer the kit builds on. Unified text / structured / streaming across providers, with the telemetry that makes per-run AI spend attributable. fancy-flow-php\'s PrismLlmClient adapter targets it, and credentials resolve at call time rather than from env, so DB-backed provider rows and queue workers are first-class.',
                'composer' => 'particle-academy/prism',
                'repo' => 'Particle-Academy/prism',
                'packagist' => 'particle-academy/prism',
                'language' => 'PHP',
            ],
        ]);
    }

    public static function find(string $slug): ?array
    {
        foreach (self::all() as $pkg) {
            if ($pkg['slug'] === $slug) {
                return $pkg;
            }
        }

        return null;
    }

    /**
     * Like {@see find()}, but also searches the companion (headless / no-UI)
     * packages — so registry/MCP lookups resolve install metadata for
     * holy-sheet, dark-slide, the Laravel infra packages, and the JS ports.
     *
     * @return array<string, mixed>|null
     */
    public static function findAny(string $slug): ?array
    {
        return self::find($slug) ?? collect(self::companions())->firstWhere('slug', $slug);
    }

    /**
     * The definition behind a slug, {@see HIDDEN} INCLUDED.
     *
     * NOT a lookup for any public surface — `find()` and `findAny()` remain
     * that, and both stay filtered, because `findAny()` is what
     * `PackagesController`, `UseCaseController` and the install-instructions MCP
     * tool call. Widening it would put a hidden package on the page, in the
     * docs and in an install command, which is the whole thing hiding prevents.
     *
     * This exists for the opposite check: a slug may only be hidden if there is
     * a definition to come BACK to, so that publishing is a one-line deletion
     * rather than an archaeology exercise. `PackageFamilyTest` asserts it, and
     * could only ever pass while HIDDEN was empty until this existed.
     *
     * @return array<string, mixed>|null
     */
    public static function definitionFor(string $slug): ?array
    {
        return collect(self::everything())->firstWhere('slug', $slug);
    }

    /** @return array<string, mixed> */
    private static function reactFancy(): array
    {
        return [
            'slug' => 'react-fancy',
            'name' => 'react-fancy',
            'tagline' => 'Tailwind v4 + React component library — about 70 primitives.',
            'npm' => '@particle-academy/react-fancy',
            'repo' => 'Particle-Academy/react-fancy',
            'language' => 'TypeScript',
            'core' => true,
            'components' => self::componentsForReactFancy(),
        ];
    }

    /** @return array<int, array{slug:string,name:string,blurb:string}> */
    /**
     * react-fancy components that support the view/edit field mode (inline
     * editing): inside a `<Form mode="view">` (or with `mode="view"`) they render
     * a clean read-only display — text for inputs, a ContentRenderer for the
     * Editor — and become editable on demand. Surfaced as a badge on the grid.
     *
     * @var list<string>
     */
    private const INLINE_EDIT_COMPONENTS = [
        'inputs', 'autocomplete', 'color-picker', 'otp-input', 'time-picker', 'editor',
    ];

    private static function componentsForReactFancy(): array
    {
        // Mirrors packages/react-fancy/src/components/ — hand-listed for Phase 1.
        return array_map(fn (array $r) => $r + [
            'blurb' => '',
            'inlineEdit' => in_array($r['slug'], self::INLINE_EDIT_COMPONENTS, true),
        ], [
            ['slug' => 'accordion', 'name' => 'Accordion'],
            ['slug' => 'accordion-panel', 'name' => 'AccordionPanel'],
            ['slug' => 'button', 'name' => 'Button', 'blurb' => 'The workhorse button — colors, states, icons, emoji, avatar, badge, loading. (formerly Action)'],
            ['slug' => 'autocomplete', 'name' => 'Autocomplete'],
            ['slug' => 'avatar', 'name' => 'Avatar'],
            ['slug' => 'badge', 'name' => 'Badge'],
            ['slug' => 'brand', 'name' => 'Brand'],
            ['slug' => 'breadcrumbs', 'name' => 'Breadcrumbs'],
            ['slug' => 'calendar', 'name' => 'Calendar'],
            ['slug' => 'callout', 'name' => 'Callout'],
            ['slug' => 'card', 'name' => 'Card'],
            ['slug' => 'carousel', 'name' => 'Carousel'],
            ['slug' => 'chart', 'name' => 'Chart'],
            ['slug' => 'chat-drawer', 'name' => 'ChatDrawer'],
            ['slug' => 'code-view', 'name' => 'CodeView', 'blurb' => 'Lightweight syntax-highlighted source view (HTML highlighted; fills height). Powers the Editor Source toggle.'],
            ['slug' => 'color-picker', 'name' => 'ColorPicker'],
            ['slug' => 'command', 'name' => 'Command'],
            ['slug' => 'composer', 'name' => 'Composer'],
            ['slug' => 'container', 'name' => 'Container', 'blurb' => 'Page shell with a max width and consistent gutters.'],
            ['slug' => 'content-renderer', 'name' => 'ContentRenderer'],
            ['slug' => 'context-menu', 'name' => 'ContextMenu'],
            ['slug' => 'dropdown', 'name' => 'Dropdown'],
            ['slug' => 'editor', 'name' => 'Editor'],
            ['slug' => 'emoji', 'name' => 'Emoji'],
            ['slug' => 'emoji-select', 'name' => 'EmojiSelect'],
            ['slug' => 'eyebrow', 'name' => 'Eyebrow', 'blurb' => 'Small uppercase kicker above a heading.'],
            ['slug' => 'faux-client', 'name' => 'FauxClient', 'blurb' => 'Browser / device / window chrome rendering real, interactive UI inside (with scale-to-fit).'],
            ['slug' => 'file-browser', 'name' => 'FileBrowser', 'blurb' => 'Remote-capable file/folder browser + directory picker — lazy async provider or streamed JSON snapshots, controlled selection, breadcrumb + editable path, ARIA tree keyboard nav.'],
            ['slug' => 'file-upload', 'name' => 'FileUpload'],
            ['slug' => 'grid', 'name' => 'Grid', 'blurb' => 'Modular responsive grid.'],
            ['slug' => 'heading', 'name' => 'Heading'],
            ['slug' => 'icon', 'name' => 'Icon'],
            ['slug' => 'index-list', 'name' => 'IndexList', 'blurb' => 'Numbered index list for directories and tables of contents.'],
            ['slug' => 'input-tag', 'name' => 'InputTag'],
            ['slug' => 'inputs', 'name' => 'Inputs'],
            ['slug' => 'json-editor', 'name' => 'JsonEditor', 'blurb' => 'Key/value editing for nested JSON, where a keyMap imposes a declared data type on chosen paths — driving both how a value displays and which input edits it.'],
            ['slug' => 'kanban', 'name' => 'Kanban'],
            ['slug' => 'kbd', 'name' => 'Kbd', 'blurb' => 'Keyboard key rendering for shortcuts.'],
            ['slug' => 'magic-wand', 'name' => 'MagicWand'],
            ['slug' => 'marquee', 'name' => 'Marquee', 'blurb' => 'Auto-scrolling ticker strip — seamless wrap, px/s speed, opposing directions, fade edges, reduced-motion safe.'],
            // Media viewers (react-fancy 4.9.0)
            ['slug' => 'media-viewer', 'name' => 'MediaViewer', 'blurb' => 'Picks the right viewer (image / video / audio / PDF) from a mime or src; download fallback. Exports resolveMediaType.'],
            ['slug' => 'image-viewer', 'name' => 'ImageViewer', 'blurb' => 'Fit-to-container image with zoom / pan and a transparency checkerboard.'],
            ['slug' => 'pull-quote', 'name' => 'PullQuote', 'blurb' => 'Editorial pull quote with optional attribution.'],
            ['slug' => 'section', 'name' => 'Section', 'blurb' => 'Vertical section rhythm with optional divider.'],
            ['slug' => 'stat', 'name' => 'Stat', 'blurb' => 'Single metric with label, value and delta.'],
            ['slug' => 'stat-list', 'name' => 'StatList', 'blurb' => 'Row of Stat items.'],
            ['slug' => 'video-viewer', 'name' => 'VideoViewer', 'blurb' => 'Native video controls with poster and fit.'],
            ['slug' => 'audio-viewer', 'name' => 'AudioViewer', 'blurb' => 'Themed card around the native audio player.'],
            ['slug' => 'pdf-viewer', 'name' => 'PdfViewer', 'blurb' => 'Inline PDF via <object> / <iframe> with a download fallback.'],
            ['slug' => 'drawer', 'name' => 'Drawer', 'blurb' => 'Panel that slides in from any edge — viewport-level, or attached inside a Card or layout pane.'],
            ['slug' => 'menu', 'name' => 'Menu'],
            ['slug' => 'mobile-menu', 'name' => 'MobileMenu'],
            ['slug' => 'modal', 'name' => 'Modal'],
            ['slug' => 'mood-meter', 'name' => 'MoodMeter'],
            ['slug' => 'navbar', 'name' => 'Navbar'],
            ['slug' => 'otp-input', 'name' => 'OtpInput'],
            ['slug' => 'pagination', 'name' => 'Pagination'],
            ['slug' => 'pillbox', 'name' => 'Pillbox'],
            ['slug' => 'popover', 'name' => 'Popover'],
            ['slug' => 'portal', 'name' => 'Portal'],
            ['slug' => 'profile', 'name' => 'Profile'],
            ['slug' => 'progress', 'name' => 'Progress'],
            ['slug' => 'prompt-input', 'name' => 'PromptInput'],
            ['slug' => 'reason-tag', 'name' => 'ReasonTag'],
            ['slug' => 'separator', 'name' => 'Separator'],
            ['slug' => 'sidebar', 'name' => 'Sidebar'],
            ['slug' => 'skeleton', 'name' => 'Skeleton'],
            ['slug' => 'sticky-note', 'name' => 'StickyNote'],
            ['slug' => 'table', 'name' => 'Table'],
            ['slug' => 'tabs', 'name' => 'Tabs'],
            ['slug' => 'text', 'name' => 'Text'],
            ['slug' => 'time-grid', 'name' => 'TimeGrid'],
            ['slug' => 'timeline', 'name' => 'Timeline'],
            ['slug' => 'time-picker', 'name' => 'TimePicker'],
            ['slug' => 'toast', 'name' => 'Toast'],
            ['slug' => 'tooltip', 'name' => 'Tooltip'],
            ['slug' => 'tree-nav', 'name' => 'TreeNav'],
        ]);
    }

    /** @return array<string, mixed> */
    private static function fancyMap(): array
    {
        return [
            'slug' => 'fancy-map',
            'name' => 'fancy-map',
            'tagline' => 'Engine-agnostic Map — one <Map> API over OpenStreetMap (Leaflet) + Google Maps, live position tracking, and a Human+ MCP bridge for cohabited human/agent maps.',
            'npm' => '@particle-academy/fancy-map',
            'repo' => 'Particle-Academy/fancy-map',
            'language' => 'TypeScript',
            'components' => [
                ['slug' => 'map', 'name' => 'Map', 'blurb' => 'Controlled map surface — view/markers/selection, live tracking (follow + useGeolocationTrack), stable data-map-marker-id handles, SSR-safe. Swap providers (leafletProvider / googleProvider) with one prop.'],
            ],
        ];
    }

    /** @return array<string, mixed> */
    private static function fancyWhiteboard(): array
    {
        return [
            'slug' => 'fancy-whiteboard',
            'name' => 'fancy-whiteboard',
            'tagline' => 'Transport-agnostic collaborative board — sticky notes, freeform pen, connectors, presence cursors.',
            'npm' => '@particle-academy/fancy-whiteboard',
            'repo' => 'Particle-Academy/fancy-whiteboard',
            'language' => 'TypeScript',
            'components' => [
                ['slug' => 'board', 'name' => 'Board', 'blurb' => 'Root canvas component.'],
                ['slug' => 'sticky-note', 'name' => 'StickyNote', 'blurb' => 'Sticky note item type.'],
                ['slug' => 'cursor-layer', 'name' => 'CursorLayer', 'blurb' => 'Multi-user cursor presence.'],
                ['slug' => 'connector', 'name' => 'Connector', 'blurb' => 'Edge between items.'],
                ['slug' => 'shape', 'name' => 'Shape', 'blurb' => 'Geometric shapes.'],
                ['slug' => 'drawing', 'name' => 'Drawing', 'blurb' => 'Freeform pen strokes.'],
            ],
        ];
    }

    /** @return array<string, mixed> */
    private static function fancyDiff(): array
    {
        return [
            'slug' => 'fancy-diff',
            'name' => 'fancy-diff',
            'tagline' => 'Human+ side-by-side document diff with hunk acceptance — a client-side, zero-dep diff engine or a git unified-diff datasource.',
            'npm' => '@particle-academy/fancy-diff',
            'repo' => 'Particle-Academy/fancy-diff',
            'language' => 'TypeScript',
            'components' => [
                ['slug' => 'fancy-diff', 'name' => 'FancyDiff', 'blurb' => 'Controlled split / inline diff viewer; per-hunk accept/reject with a merged result, render-prop customization, and a git unified-diff datasource.'],
            ],
        ];
    }

    /** @return array<string, mixed> */
    private static function fancyPixel(): array
    {
        return [
            'slug' => 'fancy-pixel',
            'name' => 'fancy-pixel',
            'tagline' => 'Embeddable Showcase verification badge + liveness/collection beacon — Badge / Mark / Beacon styles, placed or floating, Shadow-DOM isolated. Drops in via a <script> tag or mountPixel().',
            'npm' => '@particle-academy/fancy-pixel',
            'repo' => 'Particle-Academy/fancy-pixel',
            'language' => 'TypeScript',
            'components' => [
                ['slug' => 'pixel', 'name' => 'FancyPixel', 'blurb' => 'Embeddable verification badge + collection beacon — Badge / Mark / Beacon styles, placed or floating, rendered into an open Shadow DOM with a stable data-fancy-badge handle.'],
            ],
        ];
    }

    /** @return array<string, mixed> */
    private static function fancyArtboard(): array
    {
        return [
            'slug' => 'fancy-artboard',
            'name' => 'fancy-artboard',
            'tagline' => 'Figma-style design canvas for Human+ UX — a pan/zoom board of image / HTML / live-JSX frames grouped into sections, with focus mode, drag-reorder, sticky notes, and PNG/HTML export.',
            'npm' => '@particle-academy/fancy-artboard',
            'repo' => 'Particle-Academy/fancy-artboard',
            'language' => 'TypeScript',
            'components' => [
                ['slug' => 'artboard', 'name' => 'ArtBoard', 'blurb' => 'Controlled pan/zoom canvas root.'],
                ['slug' => 'art-piece', 'name' => 'ArtPiece', 'blurb' => 'A design frame — image / HTML / live JSX.'],
                ['slug' => 'artboard-section', 'name' => 'ArtBoard.Section', 'blurb' => 'Titled group of pieces.'],
                ['slug' => 'artboard-note', 'name' => 'ArtBoard.Note', 'blurb' => 'Sticky note placed in the canvas world.'],
            ],
        ];
    }

    /** @return array<string, mixed> */
    private static function fancyFlow(): array
    {
        return [
            'slug' => 'fancy-flow',
            'name' => 'fancy-flow',
            'tagline' => 'Headless workflow engine + an optional React Flow editor — six node kits, topological executor, and a FlowRunnerUx flow→UX bridge. The editor designs graphs; `/engine` runs them with zero React on a server, worker, or CLI (PHP twin: fancy-flow-php).',
            'npm' => '@particle-academy/fancy-flow',
            'repo' => 'Particle-Academy/fancy-flow',
            'language' => 'TypeScript',
            'showcase' => '/flow',
            'components' => [
                ['slug' => 'flow-editor', 'name' => 'FlowEditor', 'blurb' => 'Main editor canvas.'],
                // Blurbs render as PLAIN TEXT on the package page — no markdown.
                // Backticks here show up as backticks.
                ['slug' => 'flow-viewer', 'name' => 'FlowViewer', 'blurb' => 'A workflow, read-only — by construction, not by a prop. The canvas variant draws the graph; the list variant renders nodes as rows for docs, narrow columns and print, where a pan-zoom surface cannot go. Pass statuses and the same component shows what a run did.'],
                ['slug' => 'use-flow-state', 'name' => 'useFlowState', 'blurb' => 'Controlled state hook.'],
                ['slug' => 'use-flow-run', 'name' => 'useFlowRun', 'blurb' => 'Executor hook.'],
                ['slug' => 'run-flow', 'name' => 'runFlow', 'blurb' => 'Headless topological runner — /engine, zero React.'],
                ['slug' => 'flow-runner-ux', 'name' => 'FlowRunnerUx', 'blurb' => 'Flow-driven UX bridge — host effects become flow nodes (/ux).'],
            ],
        ];
    }

    /** @return array<string, mixed> */
    private static function fancySheets(): array
    {
        return [
            'slug' => 'fancy-sheets',
            'name' => 'fancy-sheets',
            'tagline' => 'Full spreadsheet with formulas, multi-sheet workbooks, clipboard, CSV import/export.',
            'npm' => '@particle-academy/fancy-sheets',
            'repo' => 'Particle-Academy/fancy-sheets',
            'language' => 'TypeScript',
            'components' => [
                ['slug' => 'sheet-workbook', 'name' => 'SheetWorkbook', 'blurb' => 'Root workbook component.'],
                ['slug' => 'create-empty-workbook', 'name' => 'createEmptyWorkbook', 'blurb' => 'Workbook factory.'],
            ],
        ];
    }

    /** @return array<string, mixed> */
    private static function fancySlides(): array
    {
        return [
            'slug' => 'fancy-slides',
            'name' => 'fancy-slides',
            'tagline' => 'Presentation editor + web viewer — Google-Slides-style deck authoring with JSON-friendly schema, full keyboard viewer, and an agent bridge.',
            'npm' => '@particle-academy/fancy-slides',
            'repo' => 'Particle-Academy/fancy-slides',
            'language' => 'TypeScript',
            'components' => [
                ['slug' => 'slide-viewer', 'name' => 'SlideViewer', 'blurb' => 'Read-only full-screen viewer with keyboard nav.'],
                ['slug' => 'presenter-view', 'name' => 'PresenterView', 'blurb' => 'Speaker-only side view — current slide + next slide + notes + clock + timer.'],
                ['slug' => 'slide', 'name' => 'Slide', 'blurb' => 'Single-slide renderer — shared by viewer + editor + thumbnails.'],
                ['slug' => 'deck-editor', 'name' => 'DeckEditor', 'blurb' => 'Full editor — rail + canvas + inspector + toolbar.'],
                ['slug' => 'text-element', 'name' => 'TextElement', 'blurb' => 'Slide text element renderer.'],
                ['slug' => 'image-element', 'name' => 'ImageElement', 'blurb' => 'Slide image element renderer.'],
                ['slug' => 'shape-element', 'name' => 'ShapeElement', 'blurb' => 'SVG shape primitives — rect / ellipse / line / arrow / triangle.'],
            ],
        ];
    }

    /** @return array<string, mixed> */
    private static function fancyCode(): array
    {
        return [
            'slug' => 'fancy-code',
            'name' => 'fancy-code',
            'tagline' => 'Lightweight embedded code editor — custom engine, no Monaco / CodeMirror / Shiki.',
            'npm' => '@particle-academy/fancy-code',
            'repo' => 'Particle-Academy/fancy-code',
            'language' => 'TypeScript',
            'components' => [
                ['slug' => 'code-editor', 'name' => 'CodeEditor', 'blurb' => 'Editor surface — controlled value, language + theme registries, and a diffBase gutter with live change marks (added / modified / deleted).'],
                ['slug' => 'markdown-editor', 'name' => 'MarkdownEditor', 'blurb' => 'Markdown editor + live preview.'],
                ['slug' => 'file-viewer', 'name' => 'FileViewer', 'blurb' => 'Unified file viewer — CodeEditor for text, react-fancy MediaViewer for image / video / audio / PDF; resolveFileKind decides.'],
            ],
        ];
    }

    /**
     * Catalog + FMS — a vendorable React UI block (`npx fancy-cli@latest add
     * catalog-fms`) + the Shop-n-Sub starter kit. Not a published npm/Composer
     * package: the components are authored in this showcase and shipped through
     * the fancy-ui registry, so the entry carries `cli` (the add command) and
     * `kit` / `pairs` instead of `npm` / `repo`. `kind: block` renders the
     * component grid + the block landing in Packages/Show.
     *
     * @return array<string, mixed>
     */
    private static function catalogFms(): array
    {
        return [
            'slug' => 'catalog-fms',
            'name' => 'Catalog + FMS',
            'tagline' => 'Storefront + admin UI for subscriptions and metered features — pricing tables, a plan-comparison matrix, feature gating, and a plan/perks editor. Vendor the React block, or grab the Shop-n-Sub starter kit.',
            'language' => 'TypeScript',
            'cli' => 'npx fancy-cli@latest add catalog-fms',
            'kit' => 'shop-n-sub',
            'pairs' => ['laravel-catalog', 'laravel-fms', 'fancy-catalog-js', 'fancy-features-js'],
            'components' => [
                ['slug' => 'pricing-table', 'name' => 'PricingTable', 'blurb' => 'Plan cards with a controlled billing-interval toggle + checkout CTA.'],
                ['slug' => 'feature-matrix', 'name' => 'FeatureMatrix', 'blurb' => 'Plan × feature comparison — boolean check / resource limit.'],
                ['slug' => 'feature-gate', 'name' => 'FeatureGate', 'blurb' => 'Gate content behind an FMS entitlement (access + quota) with an upgrade prompt.'],
                ['slug' => 'plan-features-editor', 'name' => 'PlanFeaturesEditor', 'blurb' => 'Admin editor to attach features + set per-plan limits.'],
            ],
        ];
    }

    private static function fancyTerm(): array
    {
        return [
            'slug' => 'fancy-term',
            'name' => 'fancy-term',
            'tagline' => 'Human+ Terminal — a controlled, themeable <Terminal> over xterm.js with hooks and an MCP-bridgeable surface agents read + drive.',
            'npm' => '@particle-academy/fancy-term',
            'repo' => 'Particle-Academy/fancy-term',
            'language' => 'TypeScript',
            'components' => [
                ['slug' => 'terminal', 'name' => 'Terminal', 'blurb' => 'Controlled xterm.js terminal — agent-bridgeable.'],
            ],
        ];
    }

    /** @return array<string, mixed> */
    private static function fancyTui(): array
    {
        return [
            'slug' => 'fancy-tui',
            'name' => 'fancy-tui',
            'tagline' => 'Ink components for Human+ terminal apps — consistent layout, controlled inputs, scrollback-safe conversations, and durable push + inbox MCP workflows.',
            'npm' => '@particle-academy/fancy-tui',
            'repo' => 'Particle-Academy/fancy-tui',
            'language' => 'TypeScript',
            'showcase' => '/fancy-tui',
            'registry_prefix' => 'tui-',
            'pairs' => ['agent-integrations', 'fancy-term'],
            'components' => [
                ['slug' => 'fancy-tui-provider', 'name' => 'FancyTuiProvider', 'blurb' => 'Theme, terminal capabilities, and resize-aware viewport context.'],
                ['slug' => 'screen', 'name' => 'Screen', 'blurb' => 'Full-width root terminal layout.'],
                ['slug' => 'box', 'name' => 'Box', 'blurb' => 'Typed Ink/Yoga box primitive.'],
                ['slug' => 'stack', 'name' => 'Stack', 'blurb' => 'Token-spaced vertical layout.'],
                ['slug' => 'row', 'name' => 'Row', 'blurb' => 'Token-spaced horizontal layout.'],
                ['slug' => 'column', 'name' => 'Column', 'blurb' => 'Semantic vertical column.'],
                ['slug' => 'spacer', 'name' => 'Spacer', 'blurb' => 'Flexible Yoga spacer.'],
                ['slug' => 'separator', 'name' => 'Separator', 'blurb' => 'Horizontal or vertical labeled rule.'],
                ['slug' => 'panel', 'name' => 'Panel', 'blurb' => 'Bordered region with focus and tone states.'],
                ['slug' => 'card', 'name' => 'Card', 'blurb' => 'Compound header, body, and footer surface.'],
                ['slug' => 'header', 'name' => 'Header', 'blurb' => 'Application title, subtitle, and status.'],
                ['slug' => 'status-bar', 'name' => 'StatusBar', 'blurb' => 'Left, center, and right status regions.'],
                ['slug' => 'responsive', 'name' => 'Responsive', 'blurb' => 'Terminal-width-aware conditional layout.'],
                ['slug' => 'sidebar', 'name' => 'Sidebar', 'blurb' => 'Compact controlled navigation rail.'],
                ['slug' => 'text', 'name' => 'Text', 'blurb' => 'Theme-aware terminal text.'],
                ['slug' => 'heading', 'name' => 'Heading', 'blurb' => 'Semantic terminal heading levels.'],
                ['slug' => 'key-hint', 'name' => 'KeyHint', 'blurb' => 'Keyboard shortcut label.'],
                ['slug' => 'badge', 'name' => 'Badge', 'blurb' => 'Compact semantic status badge.'],
                ['slug' => 'callout', 'name' => 'Callout', 'blurb' => 'Toned informational panel.'],
                ['slug' => 'spinner', 'name' => 'Spinner', 'blurb' => 'Animated activity indicator.'],
                ['slug' => 'progress', 'name' => 'Progress', 'blurb' => 'Determinate text-mode progress bar.'],
                ['slug' => 'activity-indicator', 'name' => 'ActivityIndicator', 'blurb' => 'Idle, pending, success, and failure marker.'],
                ['slug' => 'timeline', 'name' => 'Timeline', 'blurb' => 'Vertical event and activity history.'],
                ['slug' => 'button', 'name' => 'Button', 'blurb' => 'Stable-handle terminal action.'],
                ['slug' => 'form', 'name' => 'Form', 'blurb' => 'Token-spaced form shell.'],
                ['slug' => 'field', 'name' => 'Field', 'blurb' => 'Label, description, error, and input composition.'],
                ['slug' => 'input', 'name' => 'Input', 'blurb' => 'Controlled single-line input.'],
                ['slug' => 'multiline-input', 'name' => 'MultilineInput', 'blurb' => 'Grapheme-aware buffer, cursor, selection, and enhanced keyboard support.'],
                ['slug' => 'checkbox', 'name' => 'Checkbox', 'blurb' => 'Controlled boolean choice.'],
                ['slug' => 'checkbox-group', 'name' => 'CheckboxGroup', 'blurb' => 'Controlled multiple-choice list.'],
                ['slug' => 'radio-group', 'name' => 'RadioGroup', 'blurb' => 'Controlled exclusive-choice list.'],
                ['slug' => 'switch', 'name' => 'Switch', 'blurb' => 'Controlled on/off setting.'],
                ['slug' => 'multi-switch', 'name' => 'MultiSwitch', 'blurb' => 'Segmented terminal option switch.'],
                ['slug' => 'select', 'name' => 'Select', 'blurb' => 'Controlled selection list.'],
                ['slug' => 'autocomplete', 'name' => 'Autocomplete', 'blurb' => 'Query-filtered selection.'],
                ['slug' => 'pillbox', 'name' => 'Pillbox', 'blurb' => 'Controlled removable-value list.'],
                ['slug' => 'slider', 'name' => 'Slider', 'blurb' => 'Keyboard-adjustable numeric control.'],
                ['slug' => 'tabs', 'name' => 'Tabs', 'blurb' => 'Controlled terminal tab navigation.'],
                ['slug' => 'accordion', 'name' => 'Accordion', 'blurb' => 'Controlled expandable sections.'],
                ['slug' => 'menu', 'name' => 'Menu', 'blurb' => 'Stable-handle action menu.'],
                ['slug' => 'modal', 'name' => 'Modal', 'blurb' => 'Opaque centered overlay, with an inline fallback.'],
                ['slug' => 'drawer', 'name' => 'Drawer', 'blurb' => 'Edge-anchored panel — any side, attachable to a region.'],
                ['slug' => 'command', 'name' => 'Command', 'blurb' => 'Searchable command palette.'],
                ['slug' => 'table', 'name' => 'Table', 'blurb' => 'Typed table with stable row identities.'],
                ['slug' => 'tree-nav', 'name' => 'TreeNav', 'blurb' => 'Controlled hierarchy navigation.'],
                ['slug' => 'file-browser', 'name' => 'FileBrowser', 'blurb' => 'Controlled path and file selection.'],
                ['slug' => 'markdown', 'name' => 'Markdown', 'blurb' => 'ANSI Markdown for headings, lists, emphasis, and code.'],
                ['slug' => 'code-view', 'name' => 'CodeView', 'blurb' => 'Syntax-highlighted terminal code.'],
                ['slug' => 'message-list', 'name' => 'MessageList', 'blurb' => 'Scrollback-safe committed messages using Ink Static.'],
                ['slug' => 'live-region', 'name' => 'LiveRegion', 'blurb' => 'Mutable activity below committed scrollback.'],
                ['slug' => 'tool-call', 'name' => 'ToolCall', 'blurb' => 'Agent tool status and detail row.'],
                ['slug' => 'composer', 'name' => 'Composer', 'blurb' => 'Multiline prompt with Enter submit and Alt+Enter newline.'],
            ],
        ];
    }

    /** @return array<string, mixed> */
    private static function fancyEcharts(): array
    {
        return [
            'slug' => 'fancy-echarts',
            'name' => 'fancy-echarts',
            'tagline' => 'Typed React wrapper around Apache ECharts — every chart type from a single <EChart> component, lazy module registration, four built-in themes.',
            'npm' => '@particle-academy/fancy-echarts',
            'repo' => 'Particle-Academy/fancy-echarts',
            'language' => 'TypeScript',
            'components' => [
                ['slug' => 'echart', 'name' => 'EChart', 'blurb' => 'Generic chart wrapper.'],
                ['slug' => 'echart-3d', 'name' => 'EChart3D', 'blurb' => '3D chart wrapper (globe / surface / scatter3D).'],
                ['slug' => 'echart-graphic', 'name' => 'EChartGraphic', 'blurb' => 'Imperative graphic layer for annotations.'],
            ],
        ];
    }

    /** @return array<string, mixed> */
    /** @return array<string,mixed> */
    private static function laravelCourses(): array
    {
        return [
            'slug' => 'laravel-courses',
            'name' => 'laravel-courses',
            'tagline' => 'Curriculums, courses, modules, lessons, tests, enrollments, attempts and certificates for Laravel. API-only — the host owns the user model and the UI. Writes are deny-by-default behind AuthorizesCourseAdmin; reading the catalogue and verifying a certificate stay public.',
            'composer' => 'particle-academy/laravel-courses',
            'repo' => 'Particle-Academy/laravel-courses',
            'language' => 'PHP',
            'pairs' => ['classroom', 'teachers-aid'],
        ];
    }

    /** @return array<string,mixed> */
    private static function classroom(): array
    {
        return [
            'slug' => 'classroom',
            'name' => 'classroom',
            'tagline' => 'The learner surface for laravel-courses: browse a curriculum, work through a course, sit a graded test, collect a certificate. This is what the Fancy UI Curriculum at /learn runs on.',
            'npm' => '@particle-academy/classroom',
            'repo' => 'Particle-Academy/classroom',
            'language' => 'TypeScript',
            'pairs' => ['laravel-courses'],
            'components' => [
                ['slug' => 'curriculum-overview', 'name' => 'CurriculumOverview', 'blurb' => 'A curriculum and its courses, with per-course progress and enrollment state.'],
                ['slug' => 'course-player', 'name' => 'CoursePlayer', 'blurb' => 'The course itself — modules, lessons, progress, what is next, and the graded test.'],
                ['slug' => 'lesson-view', 'name' => 'LessonView', 'blurb' => 'One lesson: text, video or mixed, with a mark-complete action.'],
                ['slug' => 'test-runner', 'name' => 'TestRunner', 'blurb' => 'An attempt end to end — questions, confirm-before-submit, and the result. Renders an ungraded attempt as awaiting grading rather than a failure.'],
                ['slug' => 'question-renderer', 'name' => 'QuestionRenderer', 'blurb' => 'One question of any of the four types: multiple choice, multiple select, true/false, short answer.'],
                ['slug' => 'certificate-view', 'name' => 'CertificateView', 'blurb' => 'An issued certificate and its verification code. Deliberately literal-coloured so it looks the same on every theme.'],
            ],
        ];
    }

    /** @return array<string,mixed> */
    private static function teachersAid(): array
    {
        return [
            'slug' => 'teachers-aid',
            'name' => 'teachers-aid',
            'tagline' => 'The TAC authoring agent: reads course material and PROPOSES curriculum, course and test changes. Propose-then-apply is structural — the tools hold no repository or connection, so there is no code path from a tool call to a write, and a prompt injection inside an uploaded handbook still cannot change anything. LLM-library agnostic behind one ChatDriver seam.',
            'composer' => 'particle-academy/teachers-aid',
            'repo' => 'Particle-Academy/teachers-aid',
            'language' => 'PHP',
            'pairs' => ['teachers-aid-ui', 'laravel-courses'],
        ];
    }

    /** @return array<string,mixed> */
    private static function teachersAidUi(): array
    {
        return [
            'slug' => 'teachers-aid-ui',
            'name' => 'teachers-aid-ui',
            'tagline' => 'The React surface for the TAC authoring agent — chat transcript, a composer with file drop for handbooks and decks, and the plan-review approval surface where a human turns a proposal into a change. Transport-agnostic: no router, no HTTP client.',
            'npm' => '@particle-academy/teachers-aid-ui',
            'repo' => 'Particle-Academy/teachers-aid-ui',
            'language' => 'TypeScript',
            'pairs' => ['teachers-aid'],
            'components' => [
                ['slug' => 'teachers-aid-chat', 'name' => 'TeachersAidChat', 'blurb' => 'The whole surface — transcript, composer and plan review in one.'],
                ['slug' => 'chat-transcript', 'name' => 'ChatTranscript', 'blurb' => 'The conversation. Agent output renders sanitised, because a reply is model output and an uploaded file can talk a model into emitting markup.'],
                ['slug' => 'message-composer', 'name' => 'MessageComposer', 'blurb' => 'Input with file drop — handbooks, decks, question banks.'],
                ['slug' => 'plan-review', 'name' => 'PlanReview', 'blurb' => 'The trust boundary made visible: per-operation accept/reject on a proposed change plan. Never auto-applies.'],
            ],
        ];
    }

    /** @return array<string,mixed> */
    private static function laravelJobs(): array
    {
        return [
            'slug' => 'laravel-jobs',
            'name' => 'laravel-jobs',
            'tagline' => 'Job postings and applications for Laravel. The host owns the user and employer models; two deny-by-default contracts mean removing a binding switches the feature off rather than opening it up. Publish denials carry a code and meta so your own UI can react.',
            'composer' => 'particle-academy/laravel-jobs',
            'repo' => 'Particle-Academy/laravel-jobs',
            'language' => 'PHP',
            'pairs' => ['job-board'],
        ];
    }

    /** @return array<string,mixed> */
    private static function jobBoard(): array
    {
        return [
            'slug' => 'job-board',
            'name' => 'job-board',
            'tagline' => 'The React surface for laravel-jobs — a public board, employer posting management, and candidate applications. The UI is never the authorization: the backend gates deny-by-default, so assume every action a component renders will also be attempted directly against the API.',
            'npm' => '@particle-academy/job-board',
            'repo' => 'Particle-Academy/job-board',
            'language' => 'TypeScript',
            'pairs' => ['laravel-jobs'],
            'components' => [
                ['slug' => 'job-board', 'name' => 'JobBoard', 'blurb' => 'The public list, with filters.'],
                ['slug' => 'job-detail', 'name' => 'JobDetail', 'blurb' => 'A single posting.'],
                ['slug' => 'apply-form', 'name' => 'ApplyForm', 'blurb' => 'A candidate application. Anonymous applications are supported by the backend.'],
                ['slug' => 'job-posting-form', 'name' => 'JobPostingForm', 'blurb' => 'Create or edit a posting, employer side.'],
                ['slug' => 'employer-job-list', 'name' => 'EmployerJobList', 'blurb' => 'An employer\'s own postings and their draft / published / closed status.'],
                ['slug' => 'application-list', 'name' => 'ApplicationList', 'blurb' => 'Applications against a posting, through the six-state status flow.'],
            ],
        ];
    }

    /** @return array<string,mixed> */
    private static function fancyMlmUi(): array
    {
        return [
            'slug' => 'fancy-mlm-ui',
            'name' => 'fancy-mlm-ui',
            'tagline' => 'React surfaces for the fancy-mlm referral engine — a controlled DownlineTree (unilevel / binary / matrix), a CommissionStatement ledger, and RankProgress toward the next tier. Pairs with particle-academy/fancy-mlm (PHP) or @particle-academy/fancy-mlm (Node).',
            'npm' => '@particle-academy/fancy-mlm-ui',
            'repo' => 'Particle-Academy/fancy-mlm-ui',
            'language' => 'TypeScript',
            'pairs' => ['fancy-mlm', 'fancy-mlm-js'],
            'components' => [
                ['slug' => 'downline-tree', 'name' => 'DownlineTree', 'blurb' => 'Controlled network tree — collapsible nodes, per-member tier/volume, selection + onChange. Renders unilevel, binary, and matrix shapes from a flat member list.'],
                ['slug' => 'commission-statement', 'name' => 'CommissionStatement', 'blurb' => 'Per-period earnings ledger — level, source member, tier multiplier, and amount per row, with a paid/pending status and totals.'],
                ['slug' => 'rank-progress', 'name' => 'RankProgress', 'blurb' => 'Progress toward the next rank/tier — current volume vs threshold, with the requirement gap.'],
            ],
        ];
    }

    /** @return array<string, mixed> */
    private static function fancyPasskeysUi(): array
    {
        return [
            'slug' => 'fancy-passkeys-ui',
            'name' => 'fancy-passkeys-ui',
            'tagline' => 'React surfaces for passkey (WebAuthn) sign-in and passkey management, plus a React-free /client subpath carrying the browser half of both ceremonies. Controlled, JSON-serializable, agent-bridgeable — and deliberately not agent-completable: no prop, export or MCP tool finishes a ceremony, because that needs a gesture and a biometric only the human has. Pairs with particle-academy/fancy-passkeys (PHP) or @particle-academy/fancy-passkeys (Node).',
            'npm' => '@particle-academy/fancy-passkeys-ui',
            'repo' => 'Particle-Academy/fancy-passkeys-ui',
            'language' => 'TypeScript',
            'pairs' => ['fancy-passkeys', 'fancy-passkeys-js'],
            'components' => [
                ['slug' => 'passkey-sign-in', 'name' => 'PasskeySignIn', 'blurb' => 'Controlled sign-in surface — discoverable (usernameless) by default, username-first with conditional-UI autofill on request. A dismissed prompt reads as "cancelled", not as an error.'],
                ['slug' => 'passkey-manager', 'name' => 'PasskeyManager', 'blurb' => 'Controlled list of a user\'s passkeys with rename and revoke. Rows are handled by credential ID, revoke stages for human confirmation, and the last-passkey lockout is spelled out rather than implied.'],
                ['slug' => 'passkey-status', 'name' => 'PasskeyStatus', 'blurb' => 'Read-only "can this browser do passkeys?" indicator — support, a built-in authenticator, and autofill sign-in.'],
            ],
        ];
    }

    /** @return array<string, mixed> */
    private static function fancyGitUi(): array
    {
        return [
            'slug' => 'fancy-git-ui',
            'name' => 'fancy-git-ui',
            'tagline' => 'Controlled Human+ React surfaces for repositories, working trees, diffs, commits, branches, and pull/merge requests.',
            'npm' => '@particle-academy/fancy-git-ui',
            'repo' => 'Particle-Academy/fancy-git-ui',
            'language' => 'TypeScript',
            'pairs' => ['fancy-git', 'fancy-git-js'],
            'components' => [
                ['slug' => 'repository-browser', 'name' => 'RepositoryBrowser', 'blurb' => 'Controlled file and directory browser with stable path handles.'],
                ['slug' => 'working-tree', 'name' => 'WorkingTree', 'blurb' => 'Staged, unstaged, and untracked changes with stage/unstage intents.'],
                ['slug' => 'commit-history', 'name' => 'CommitHistory', 'blurb' => 'Pageable controlled commit history and selection.'],
                ['slug' => 'diff-viewer', 'name' => 'DiffViewer', 'blurb' => 'Unified/split Git diff surface with stable file and hunk handles.'],
                ['slug' => 'branch-picker', 'name' => 'BranchPicker', 'blurb' => 'Local/remote branch selection and proposal-first checkout.'],
                ['slug' => 'review-list', 'name' => 'ReviewList', 'blurb' => 'Provider-neutral pull/merge request list.'],
                ['slug' => 'commit-composer', 'name' => 'CommitComposer', 'blurb' => 'Controlled commit proposal form.'],
                ['slug' => 'create-review-form', 'name' => 'CreateReviewForm', 'blurb' => 'Controlled pull/merge request proposal form.'],
            ],
        ];
    }

    /** @return array<string, mixed> */
    private static function fancyXFilesUi(): array
    {
        return [
            'slug' => 'fancy-x-files-ui',
            'name' => 'fancy-x-files-ui',
            'tagline' => 'react-fancy editor suite for the well-known + agent-facing files — controlled, JSON-friendly editors for robots.txt / security.txt / llms.txt / humans.txt / sitemap.xml / AGENTS, each with a live preview, plus a combined XFilesManager. Pairs with particle-academy/fancy-x-files (PHP) / @particle-academy/fancy-x-files (Node).',
            'npm' => '@particle-academy/fancy-x-files-ui',
            'repo' => 'Particle-Academy/fancy-x-files-ui',
            'language' => 'TypeScript',
            'pairs' => ['fancy-x-files', 'fancy-x-files-js'],
            'components' => [
                ['slug' => 'robots-editor', 'name' => 'RobotsEditor', 'blurb' => 'Controlled robots.txt rule builder — per-group Allow/Disallow, sitemaps, and protected paths pinned Disallow everywhere (the protect() safety rail).'],
                ['slug' => 'security-txt-editor', 'name' => 'SecurityTxtEditor', 'blurb' => 'RFC 9116 security.txt editor — required Contact + a future Expires, with inline validation.'],
                ['slug' => 'llms-txt-editor', 'name' => 'LlmsTxtEditor', 'blurb' => 'llms.txt editor — title / summary / details + repeatable link sections.'],
                ['slug' => 'humans-txt-editor', 'name' => 'HumansTxtEditor', 'blurb' => 'humans.txt editor — team credits, thanks, and site colophon.'],
                ['slug' => 'sitemap-editor', 'name' => 'SitemapEditor', 'blurb' => 'sitemap.xml editor — a flat list of URL entries with lastmod / changefreq / priority.'],
                ['slug' => 'agents-editor', 'name' => 'AgentsEditor', 'blurb' => '/AGENTS register editor — per-agent allow/deny policy + scope.'],
                ['slug' => 'x-file-preview', 'name' => 'XFilePreview', 'blurb' => 'Read-only render of the real text/XML a well-known file becomes on disk — what-you-see-is-what-ships.'],
                ['slug' => 'x-files-manager', 'name' => 'XFilesManager', 'blurb' => 'The compound surface — a tab per file kind wiring each editor next to its live preview over one aggregate model.'],
            ],
        ];
    }

    /** @return array<string, mixed> */
    private static function fancyScreens(): array
    {
        return [
            'slug' => 'fancy-screens',
            'name' => 'fancy-screens',
            'tagline' => 'Multi-screen application shell with cross-screen agent presence.',
            'npm' => '@particle-academy/fancy-screens',
            'repo' => 'Particle-Academy/fancy-screens',
            'language' => 'TypeScript',
            'components' => [
                ['slug' => 'screen-system', 'name' => 'ScreenSystem', 'blurb' => 'Root provider.'],
                ['slug' => 'screen', 'name' => 'Screen', 'blurb' => 'Individual screen container.'],
            ],
        ];
    }

    /** @return array<string, mixed> */
    private static function fancy3d(): array
    {
        return [
            'slug' => 'fancy-3d',
            'name' => 'fancy-3d',
            'tagline' => 'Engine-agnostic 3D core — Scene types, the <Canvas> surface, and a DOM/CSS-3D renderer. WebGL engines (Babylon, three.js, …) ship as sibling fancy-3d-* packages.',
            'npm' => '@particle-academy/fancy-3d',
            'repo' => 'Particle-Academy/fancy-3d',
            'language' => 'TypeScript',
            'components' => [
                ['slug' => 'canvas', 'name' => 'Canvas', 'blurb' => 'Engine-pluggable pan/zoom surface; DOM renderer built in.'],
                ['slug' => 'scene', 'name' => 'Scene types', 'blurb' => 'Engine-agnostic JSON shape (nodes, edges, widget specs).'],
            ],
        ];
    }

    /** @return array<string, mixed> */
    private static function fancy3dBabylon(): array
    {
        return [
            'slug' => 'fancy-3d-babylon',
            'name' => 'fancy-3d-babylon',
            'tagline' => 'Babylon.js adapter for fancy-3d — WebGL renderer + the React components (Stage, Monitor, Card3D, Screen) that mount onto a Babylon Scene.',
            'npm' => '@particle-academy/fancy-3d-babylon',
            'repo' => 'Particle-Academy/fancy-3d-babylon',
            'language' => 'TypeScript',
            'components' => [
                ['slug' => 'engine', 'name' => 'babylonEngine', 'blurb' => 'CanvasEngine adapter — pass to <Canvas engine={babylonEngine}/>.'],
                ['slug' => 'stage', 'name' => 'Stage', 'blurb' => 'Babylon scene root (camera + lighting + JSON scene graph).'],
                ['slug' => 'monitor', 'name' => 'Monitor', 'blurb' => 'In-scene HTML overlay rendered as a WebGL texture.'],
                ['slug' => 'card-3d', 'name' => 'Card3D', 'blurb' => '3D-native Card primitive positioned in scene space.'],
            ],
        ];
    }

    /** @return array<string, mixed> */
    private static function fancy3dThree(): array
    {
        return [
            'slug' => 'fancy-3d-three',
            'name' => 'fancy-3d-three',
            'tagline' => 'three.js adapter for fancy-3d — WebGL renderer + the React components (Stage, Monitor, Card3D) that mount onto a three.js Scene. Mirrors fancy-3d-babylon, three.js underneath.',
            'npm' => '@particle-academy/fancy-3d-three',
            'repo' => 'Particle-Academy/fancy-3d-three',
            'language' => 'TypeScript',
            'components' => [
                ['slug' => 'engine', 'name' => 'threeEngine', 'blurb' => 'CanvasEngine adapter — pass to <Canvas engine={threeEngine}/>.'],
                ['slug' => 'stage', 'name' => 'Stage', 'blurb' => 'three.js scene root (camera + lighting + JSON scene graph).'],
                ['slug' => 'monitor', 'name' => 'Monitor', 'blurb' => 'In-scene HTML overlay projected via CSS matrix3d homography.'],
                ['slug' => 'card-3d', 'name' => 'Card3D', 'blurb' => '3D-native Card primitive positioned in scene space.'],
            ],
        ];
    }

    /** @return array<string, mixed> */
    private static function agentIntegrations(): array
    {
        return [
            'slug' => 'agent-integrations',
            'name' => 'agent-integrations',
            'tagline' => 'MCP-driven agent presence — micro-MCP server, bridges, presence layer, share relay.',
            'npm' => '@particle-academy/agent-integrations',
            'repo' => 'Particle-Academy/agent-integrations',
            'language' => 'TypeScript',
            'core' => true,
            'components' => [
                ['slug' => 'micro-mcp-server', 'name' => 'MicroMcpServer', 'blurb' => 'In-page MCP server.'],
                ['slug' => 'agent-panel', 'name' => 'AgentPanel', 'blurb' => 'Per-agent control panel.'],
                ['slug' => 'agent-cursor', 'name' => 'AgentCursor', 'blurb' => 'In-canvas agent cursor.'],
                ['slug' => 'shared-whiteboard', 'name' => 'SharedWhiteboard', 'blurb' => 'Whiteboard + bridges + share.'],
                ['slug' => 'share-controls', 'name' => 'ShareControls', 'blurb' => 'Start/stop relay sessions.'],
            ],
        ];
    }

    /** @return array<string, mixed> */
    private static function fancyInertia(): array
    {
        return [
            'slug' => 'fancy-inertia',
            'name' => 'fancy-inertia',
            'tagline' => 'Inertia.js bridge — schema-driven pages, useFancyForm(), SSR boundaries. Works with ANY Inertia backend (zero Laravel/PHP runtime deps), not just Laravel.',
            'npm' => '@particle-academy/fancy-inertia',
            'repo' => 'Particle-Academy/fancy-inertia',
            'language' => 'TypeScript',
            'core' => true,
            'components' => [
                ['slug' => 'fancy-app-root', 'name' => 'FancyAppRoot', 'blurb' => 'Inertia app root.'],
                ['slug' => 'use-fancy-form', 'name' => 'useFancyForm', 'blurb' => 'Form hook.'],
            ],
        ];
    }

    /** @return array<string, mixed> */
    private static function fancyPwa(): array
    {
        return [
            'slug' => 'fancy-pwa',
            'name' => 'fancy-pwa',
            'tagline' => 'Installable + offline PWA layer — manifest, lean service worker, install/offline/update hooks, and a fancyPwa() Vite plugin. Framework-agnostic, SSR-safe.',
            'npm' => '@particle-academy/fancy-pwa',
            'repo' => 'Particle-Academy/fancy-pwa',
            'language' => 'TypeScript',
            'components' => [
                ['slug' => 'pwa', 'name' => 'PWA layer', 'blurb' => 'SW-free hooks + banners (useOnline / OfflineBanner / InstallBanner / useInstallPrompt) plus the fancyPwa() Vite plugin and /sw toolkit.'],
            ],
        ];
    }

    /** @return array<string, mixed> */
    private static function fancyMotion(): array
    {
        return [
            'slug' => 'fancy-motion',
            'name' => 'fancy-motion',
            'tagline' => 'Timeline / animation primitives — a headless keyframe engine plus a React MotionStage + TimelineDock for scrubbing and orchestrating motion. (preview — 0.0.x)',
            'npm' => '@particle-academy/fancy-motion',
            'repo' => 'Particle-Academy/fancy-motion',
            'language' => 'TypeScript',
            'components' => [
                ['slug' => 'motion-stage', 'name' => 'MotionStage', 'blurb' => 'React stage that plays a timeline against its children.'],
                ['slug' => 'timeline-dock', 'name' => 'TimelineDock', 'blurb' => 'Scrub/play dock for authoring + previewing a timeline.'],
            ],
        ];
    }

    /** @return array<string, mixed> */
    private static function fancyCmsUi(): array
    {
        return [
            'slug' => 'fancy-cms-ui',
            'name' => 'fancy-cms-ui',
            'tagline' => 'WYSIWYG CMS editor (React) for the Stages doc model: three-pane layers / canvas / inspector editing where every mutation is one PageOp through a pure reducer, plus the CmsPage / CmsRegion renderers with $bind data fields that name their live source. Pairs with the particle-academy/fancy-cms PHP renderer. Pre-1.0 — the API may still move between minors; issues at github.com/Particle-Academy/fancy-cms-ui/issues.',
            'npm' => '@particle-academy/fancy-cms-ui',
            'repo' => 'Particle-Academy/fancy-cms-ui',
            'language' => 'TypeScript',
            'pairs' => ['fancy-cms'],
            'components' => [
                ['slug' => 'cms-editor', 'name' => 'Editor', 'blurb' => 'The WYSIWYG editor surface — canvas + layers + inspector over a Stages node tree.'],
                ['slug' => 'cms-page', 'name' => 'CmsPage', 'blurb' => 'Renders a published Stages document as a page.'],
                ['slug' => 'cms-region', 'name' => 'CmsRegion', 'blurb' => 'An editable / per-surface region within a CMS page.'],
            ],
        ];
    }
}

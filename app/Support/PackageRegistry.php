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
     */
    public const HIDDEN = ['fancy-motion'];

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
        // Vendorable block (npx fancy-cli add) — not a published package.
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
        // Workflow runtime twin, relay transport, shared document core.
        'fancy-flow-php' => ['group' => 'surfaces', 'ecosystem' => 'php', 'kind' => 'headless', 'accent' => '#0ea5e9'],
        'fancy-cf-relay' => ['group' => 'tooling', 'ecosystem' => 'ts', 'kind' => 'headless', 'accent' => '#f6821f'],
        'fancy-doc-commons' => ['group' => 'documents', 'ecosystem' => 'ts', 'kind' => 'headless', 'accent' => '#2563eb'],
        // Polyglot single-file client.
        'mcp-relay-client' => ['group' => 'tooling', 'ecosystem' => 'polyglot', 'kind' => 'headless', 'accent' => '#22c55e'],
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
        return self::visible(array_map(self::classify(...), [
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
        ]));
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
        return self::visible(array_map(self::classify(...), [
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
                'tagline' => 'EARLY-RELEASE BETA — Laravel host + PHP page renderer for the Stages doc model: node tree → HTML with island hydration; backend pair of the fancy-cms-ui editor (still in preview). Expect rough edges and breaking 0.x changes — please report anything you hit at github.com/Particle-Academy/fancy-cms/issues.',
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
                'tagline' => 'Source-vendoring CLI — `npx fancy-cli add <component>` copies component source from the registry into your project (the shadcn-style own-the-source path).',
                'npm' => 'fancy-cli',
                'repo' => 'Particle-Academy/fancy-ui-cli',
                'language' => 'TypeScript',
            ],
        ]));
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

    /** @return array<string, mixed> */
    private static function reactFancy(): array
    {
        return [
            'slug' => 'react-fancy',
            'name' => 'react-fancy',
            'tagline' => 'Tailwind v4 + React component library — about 50 primitives.',
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
            ['slug' => 'content-renderer', 'name' => 'ContentRenderer'],
            ['slug' => 'context-menu', 'name' => 'ContextMenu'],
            ['slug' => 'dropdown', 'name' => 'Dropdown'],
            ['slug' => 'editor', 'name' => 'Editor'],
            ['slug' => 'emoji', 'name' => 'Emoji'],
            ['slug' => 'emoji-select', 'name' => 'EmojiSelect'],
            ['slug' => 'faux-client', 'name' => 'FauxClient', 'blurb' => 'Browser / device / window chrome rendering real, interactive UI inside (with scale-to-fit).'],
            ['slug' => 'file-browser', 'name' => 'FileBrowser', 'blurb' => 'Remote-capable file/folder browser + directory picker — lazy async provider or streamed JSON snapshots, controlled selection, breadcrumb + editable path, ARIA tree keyboard nav.'],
            ['slug' => 'file-upload', 'name' => 'FileUpload'],
            ['slug' => 'heading', 'name' => 'Heading'],
            ['slug' => 'icon', 'name' => 'Icon'],
            ['slug' => 'input-tag', 'name' => 'InputTag'],
            ['slug' => 'inputs', 'name' => 'Inputs'],
            ['slug' => 'kanban', 'name' => 'Kanban'],
            ['slug' => 'magic-wand', 'name' => 'MagicWand'],
            ['slug' => 'marquee', 'name' => 'Marquee', 'blurb' => 'Auto-scrolling ticker strip — seamless wrap, px/s speed, opposing directions, fade edges, reduced-motion safe.'],
            // Media viewers (react-fancy 4.9.0)
            ['slug' => 'media-viewer', 'name' => 'MediaViewer', 'blurb' => 'Picks the right viewer (image / video / audio / PDF) from a mime or src; download fallback. Exports resolveMediaType.'],
            ['slug' => 'image-viewer', 'name' => 'ImageViewer', 'blurb' => 'Fit-to-container image with zoom / pan and a transparency checkerboard.'],
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
            'components' => [
                ['slug' => 'flow-editor', 'name' => 'FlowEditor', 'blurb' => 'Main editor canvas.'],
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
     * Catalog + FMS — a vendorable React UI block (`npx fancy-cli add
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
            'cli' => 'npx fancy-cli add catalog-fms',
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
            'tagline' => 'EARLY-RELEASE BETA — WYSIWYG CMS editor (React) for the Stages doc model: three-pane layers / canvas / inspector editing where every mutation is one PageOp through a pure reducer, plus the CmsPage / CmsRegion renderers with $bind data fields; pairs with the particle-academy/fancy-cms PHP renderer. Expect rough edges and breaking 0.x changes — please report anything you hit at github.com/Particle-Academy/fancy-cms-ui/issues.',
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

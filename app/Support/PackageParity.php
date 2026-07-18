<?php

declare(strict_types=1);

namespace App\Support;

/**
 * Parity groups — one capability offered in more than one language.
 *
 * Several Fancy packages ship as language mirrors of the same headless
 * capability (a PHP package + its Node/TS twin today; more languages are
 * planned). Rather than list each twin as its own tile, the /packages listing
 * folds a group into ONE logical card and /packages/{slug} renders ONE page
 * documenting every language variant.
 *
 * This is the single source of truth for those groupings. It drives BOTH the
 * showcase listing/parity page AND the MCP start_project mirror strategy (via
 * {@see mcpPairs()}), so the two never drift. Each group's `slug` is its page
 * route key (the canonical member's slug, so existing links keep working);
 * every member slug resolves to that page. `members` is ordered and extensible
 * — add a row when a new language mirror ships.
 *
 * Member facts (name, install id, repo, tagline) are NOT duplicated here; they
 * are pulled from {@see PackageRegistry} by slug so the registry stays the one
 * place package metadata lives.
 */
final class PackageParity
{
    /**
     * @var array<int, array{slug: string, name: string, capability: string, tagline: string, members: array<int, array{language: string, slug: string}>}>
     */
    private const GROUPS = [
        [
            'slug' => 'holy-sheet',
            'name' => 'Holy Sheet',
            'capability' => 'xlsx writer/reader (+ formula engine)',
            'tagline' => 'Headless xlsx spreadsheet writer/reader with a formula engine — one Agent write / describe / lint API, mirrored across languages.',
            'members' => [
                ['language' => 'PHP', 'slug' => 'holy-sheet'],
                ['language' => 'Node / TypeScript', 'slug' => 'holy-sheet-js'],
            ],
        ],
        [
            'slug' => 'dark-slide',
            'name' => 'Dark Slide',
            'capability' => 'pptx writer/reader',
            'tagline' => 'Headless pptx deck writer/reader — markdown headings, highlighted code, tables, gradients, and a high-fidelity reader.',
            'members' => [
                ['language' => 'PHP', 'slug' => 'dark-slide'],
                ['language' => 'Node / TypeScript', 'slug' => 'dark-slide-js'],
            ],
        ],
        [
            'slug' => 'last-word',
            'name' => 'Last Word',
            'capability' => 'docx writer/reader (+ markdown bridges)',
            'tagline' => 'Headless docx writer/reader on one JSON Doc model — headings, styled runs, lists, tables, code — with markdown bridges both ways.',
            'members' => [
                ['language' => 'PHP', 'slug' => 'last-word'],
                ['language' => 'Node / TypeScript', 'slug' => 'last-word-js'],
            ],
        ],
        [
            'slug' => 'laravel-catalog',
            'name' => 'Fancy Catalog',
            'capability' => 'Stripe catalog (products / prices / plans / checkout)',
            'tagline' => 'Headless Stripe catalog — products / prices / plans + checkout — adapter-based with an injected Stripe client.',
            'members' => [
                ['language' => 'PHP', 'slug' => 'laravel-catalog'],
                ['language' => 'Node / TypeScript', 'slug' => 'fancy-catalog-js'],
            ],
        ],
        [
            'slug' => 'laravel-fms',
            'name' => 'Fancy Features',
            'capability' => 'Feature management (gates, quotas, metered features)',
            'tagline' => 'Headless feature management — gate / registry / config / group strategies plus metered quotas. Owns the FeatureSource contract catalog plugs into.',
            'members' => [
                ['language' => 'PHP', 'slug' => 'laravel-fms'],
                ['language' => 'Node / TypeScript', 'slug' => 'fancy-features-js'],
            ],
        ],
        [
            'slug' => 'fancy-mlm',
            'name' => 'Fancy MLM',
            'capability' => 'Multi-level referral / network-marketing engine (unilevel / binary / matrix)',
            'tagline' => 'Headless multi-level referral engine — unilevel / binary / matrix downlines from one CompensationPlan JSON, identical rewards across languages.',
            'members' => [
                ['language' => 'PHP', 'slug' => 'fancy-mlm'],
                ['language' => 'Node / TypeScript', 'slug' => 'fancy-mlm-js'],
            ],
        ],
        [
            'slug' => 'fancy-git',
            'name' => 'Fancy Git',
            'capability' => 'Local Git + GitHub / GitLab / Bitbucket collaboration',
            'tagline' => 'Headless Git engine with normalized GitHub / GitLab / Bitbucket provider contracts and proposal-first mutations.',
            'members' => [
                ['language' => 'PHP', 'slug' => 'fancy-git'],
                ['language' => 'Node / TypeScript', 'slug' => 'fancy-git-js'],
            ],
        ],
        [
            'slug' => 'fancy-heuristics',
            'name' => 'Fancy Heuristics',
            'capability' => 'Interaction analytics (EUO)',
            'tagline' => 'End-user (not search-engine) optimization — human + agent interaction analytics: event ingestion, focus heatmaps, and session / actor rollups (server + browser collector).',
            'members' => [
                ['language' => 'PHP', 'slug' => 'fancy-heuristics'],
                ['language' => 'Node / TypeScript', 'slug' => 'fancy-heuristics-js'],
            ],
        ],
        [
            'slug' => 'fancy-x-files',
            'name' => 'Fancy X-Files',
            'capability' => 'Well-known files (robots / security / llms / sitemap / AGENTS)',
            'tagline' => 'Well-known + agent-facing files from one declarative registry — robots / security.txt / humans / llms / sitemap / AGENTS — with a leak-safe protect() guard.',
            'members' => [
                ['language' => 'PHP', 'slug' => 'fancy-x-files'],
                ['language' => 'Node / TypeScript', 'slug' => 'fancy-x-files-js'],
            ],
        ],
    ];

    /**
     * Every slug that belongs to a parity group (canonical + mirrors) — the set
     * the flat listing drops before injecting one card per group.
     *
     * @return list<string>
     */
    public static function memberSlugs(): array
    {
        $slugs = [];
        foreach (self::GROUPS as $group) {
            foreach ($group['members'] as $member) {
                $slugs[] = $member['slug'];
            }
        }

        return $slugs;
    }

    /**
     * The parity group whose canonical slug OR any member slug is $slug, or null.
     *
     * @return array{slug: string, name: string, capability: string, tagline: string, members: array<int, array{language: string, slug: string}>}|null
     */
    public static function find(string $slug): ?array
    {
        foreach (self::GROUPS as $group) {
            if ($group['slug'] === $slug) {
                return $group;
            }
            foreach ($group['members'] as $member) {
                if ($member['slug'] === $slug) {
                    return $group;
                }
            }
        }

        return null;
    }

    /** The canonical page slug for a member slug, or null when it is in no group. */
    public static function canonicalFor(string $slug): ?string
    {
        return self::find($slug)['slug'] ?? null;
    }

    /**
     * Ordered language labels for a group (e.g. ['PHP', 'Node / TypeScript']).
     *
     * @return list<string>
     */
    public static function languagesFor(string $slug): array
    {
        $group = self::find($slug);

        return $group === null
            ? []
            : array_map(static fn (array $member): string => $member['language'], $group['members']);
    }

    /**
     * All parity groups.
     *
     * @return array<int, array{slug: string, name: string, capability: string, tagline: string, members: array<int, array{language: string, slug: string}>}>
     */
    public static function groups(): array
    {
        return self::GROUPS;
    }

    /**
     * The parity groups as capability → per-language package-id pairs for the
     * MCP start_project "mirror strategy". Package ids (composer / npm) are
     * pulled from {@see PackageRegistry} so ids stay defined in one place; a
     * language with no mirror yet is null. Callers may append language-baseline
     * (single-language) entries the listing does not treat as a parity group.
     *
     * @return array<int, array{capability: string, php: ?string, node: ?string}>
     */
    public static function mcpPairs(): array
    {
        return array_map(static function (array $group): array {
            $ids = ['php' => null, 'node' => null];
            foreach ($group['members'] as $member) {
                $record = PackageRegistry::findAny($member['slug']) ?? [];
                $column = str_starts_with($member['language'], 'PHP') ? 'php' : 'node';
                $ids[$column] = $record['composer'] ?? $record['npm'] ?? null;
            }

            return ['capability' => $group['capability'], 'php' => $ids['php'], 'node' => $ids['node']];
        }, self::GROUPS);
    }
}

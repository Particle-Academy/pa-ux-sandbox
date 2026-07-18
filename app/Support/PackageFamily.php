<?php

declare(strict_types=1);

namespace App\Support;

/**
 * Package families — related packages that ship as one product.
 *
 * A capability rarely ships as a single package: it has a PHP core and a Node
 * mirror, a React UI companion, per-host provider adapters, a headless backend.
 * Listing each as its own tile buries the product. So a family lists as ONE
 * card and gets ONE page at /packages/family/{slug} — its OWN path, because a
 * family slug is usually also a member's package slug (fancy-3d, fancy-flow, …)
 * and must never shadow that package's page.
 *
 * Members live in ordered, labelled `sections` (Engine / React UI / GitHub
 * provider / …). A section that represents the SAME capability offered in more
 * than one language also carries a `capability` string, which is what
 * {@see mcpPairs()} feeds to the MCP start_project mirror strategy — so the
 * listing and the MCP agent guidance stay derived from this one table.
 *
 * `group`/`kind` place the family card in the listing (`group` is a THEME —
 * core / surfaces / documents / commerce / platform / tooling — so a family
 * headlined by a UI surface lands in Surfaces with a preview tile). Member facts
 * — name, install id, repo — are NOT duplicated here; they come from
 * {@see PackageRegistry} by slug.
 */
final class PackageFamily
{
    /** Language labels that map onto the MCP mirror columns. */
    private const MCP_LANGUAGES = ['PHP' => 'php', 'Node / TypeScript' => 'node'];

    /**
     * @var array<int, array{slug:string, name:string, tagline:string, group:string, kind:string, sections:array<int, array{label:string, capability:?string, members:array<int, array{language:string, slug:string}>}>}>
     */
    private const FAMILIES = [
        [
            'slug' => 'fancy-core',
            'name' => 'Fancy Core',
            'tagline' => 'The stack every Fancy app starts from — the React primitives, the Inertia bridge (any Inertia backend, not just Laravel), server-state, a new-build detector, and the agent backbone that makes the whole UI agent-driveable.',
            'group' => 'core',
            'kind' => 'ui',
            'sections' => [
                [
                    'label' => 'Components',
                    'capability' => null,
                    'members' => [['language' => 'React', 'slug' => 'react-fancy']],
                ],
                [
                    'label' => 'Inertia bridge + server-state',
                    'capability' => null,
                    'members' => [
                        ['language' => 'React', 'slug' => 'fancy-inertia'],
                        ['language' => 'React', 'slug' => 'fancy-query'],
                    ],
                ],
                [
                    'label' => 'App lifecycle',
                    'capability' => null,
                    'members' => [['language' => 'React', 'slug' => 'fancy-app-update']],
                ],
                [
                    'label' => 'Agent backbone',
                    'capability' => null,
                    'members' => [['language' => 'React', 'slug' => 'agent-integrations']],
                ],
            ],
        ],
        [
            'slug' => 'fancy-git',
            'name' => 'Fancy Git',
            'tagline' => 'Git as a first-class, agent-driveable surface — a headless engine with proposal-first mutations, normalized provider adapters for GitHub / GitLab / Bitbucket, and a React UI. Mirrored in PHP and Node.',
            'group' => 'tooling',
            'kind' => 'headless',
            'sections' => [
                [
                    'label' => 'Engine',
                    'capability' => 'Local Git + GitHub / GitLab / Bitbucket collaboration',
                    'members' => [
                        ['language' => 'PHP', 'slug' => 'fancy-git'],
                        ['language' => 'Node / TypeScript', 'slug' => 'fancy-git-js'],
                    ],
                ],
                [
                    'label' => 'React UI',
                    'capability' => null,
                    'members' => [['language' => 'React', 'slug' => 'fancy-git-ui']],
                ],
                [
                    'label' => 'GitHub provider',
                    'capability' => 'GitHub.com / GitHub Enterprise provider adapter',
                    'members' => [
                        ['language' => 'PHP', 'slug' => 'fancy-git-github-php'],
                        ['language' => 'Node / TypeScript', 'slug' => 'fancy-git-github-js'],
                    ],
                ],
                [
                    'label' => 'GitLab provider',
                    'capability' => 'GitLab.com / Self-Managed provider adapter',
                    'members' => [
                        ['language' => 'PHP', 'slug' => 'fancy-git-gitlab-php'],
                        ['language' => 'Node / TypeScript', 'slug' => 'fancy-git-gitlab-js'],
                    ],
                ],
                [
                    'label' => 'Bitbucket provider',
                    'capability' => 'Bitbucket Cloud provider adapter',
                    'members' => [
                        ['language' => 'PHP', 'slug' => 'fancy-git-bitbucket-php'],
                        ['language' => 'Node / TypeScript', 'slug' => 'fancy-git-bitbucket-js'],
                    ],
                ],
            ],
        ],
        [
            'slug' => 'fancy-flow',
            'name' => 'Fancy Flow',
            'tagline' => 'Workflow graphs humans and agents author together — a headless topological engine plus an optional React Flow editor. The editor designs; the engine runs anywhere, including a PHP backend with queued durable runs.',
            'group' => 'surfaces',
            'kind' => 'ui',
            'sections' => [
                [
                    'label' => 'Engine + editor',
                    'capability' => 'Workflow graphs (topological engine + editor)',
                    'members' => [
                        ['language' => 'Node / TypeScript', 'slug' => 'fancy-flow'],
                        ['language' => 'PHP', 'slug' => 'fancy-flow-php'],
                    ],
                ],
            ],
        ],
        [
            'slug' => 'fancy-mlm',
            'name' => 'Fancy MLM',
            'tagline' => 'Multi-level referral / network-marketing engine — configurable unilevel / binary / matrix downlines from one CompensationPlan JSON, with identical rewards across languages and a React surface for trees and statements.',
            'group' => 'commerce',
            'kind' => 'headless',
            'sections' => [
                [
                    'label' => 'Engine',
                    'capability' => 'Multi-level referral / network-marketing engine (unilevel / binary / matrix)',
                    'members' => [
                        ['language' => 'PHP', 'slug' => 'fancy-mlm'],
                        ['language' => 'Node / TypeScript', 'slug' => 'fancy-mlm-js'],
                    ],
                ],
                [
                    'label' => 'React UI',
                    'capability' => null,
                    'members' => [['language' => 'React', 'slug' => 'fancy-mlm-ui']],
                ],
            ],
        ],
        [
            'slug' => 'fancy-x-files',
            'name' => 'Fancy X-Files',
            'tagline' => 'Well-known + agent-facing files from one declarative registry — robots.txt, security.txt, humans, llms, sitemap, AGENTS — with a leak-safe protect() guard, plus an admin UI to edit them.',
            'group' => 'platform',
            'kind' => 'headless',
            'sections' => [
                [
                    'label' => 'Registry',
                    'capability' => 'Well-known files (robots / security / llms / sitemap / AGENTS)',
                    'members' => [
                        ['language' => 'PHP', 'slug' => 'fancy-x-files'],
                        ['language' => 'Node / TypeScript', 'slug' => 'fancy-x-files-js'],
                    ],
                ],
                [
                    'label' => 'React UI',
                    'capability' => null,
                    'members' => [['language' => 'React', 'slug' => 'fancy-x-files-ui']],
                ],
            ],
        ],
        [
            'slug' => 'fancy-3d',
            'name' => 'Fancy 3D',
            'tagline' => 'Engine-agnostic 3D — JSON-friendly Scene types and a pluggable <Canvas> with a built-in DOM/CSS-3D renderer (no WebGL dependency), plus optional Babylon.js and three.js adapters.',
            'group' => 'surfaces',
            'kind' => 'ui',
            'sections' => [
                [
                    'label' => 'Core',
                    'capability' => null,
                    'members' => [['language' => 'React', 'slug' => 'fancy-3d']],
                ],
                [
                    'label' => 'Engine adapters',
                    'capability' => null,
                    'members' => [
                        ['language' => 'React', 'slug' => 'fancy-3d-babylon'],
                        ['language' => 'React', 'slug' => 'fancy-3d-three'],
                    ],
                ],
            ],
        ],
        [
            'slug' => 'fancy-term',
            'name' => 'Fancy Term',
            'tagline' => 'A controlled, themeable <Terminal> over xterm.js, plus the headless Node backend that owns the PTYs and the snapshot/replay persistence engine behind it.',
            'group' => 'surfaces',
            'kind' => 'ui',
            'sections' => [
                [
                    'label' => 'Terminal UI',
                    'capability' => null,
                    'members' => [['language' => 'React', 'slug' => 'fancy-term']],
                ],
                [
                    'label' => 'Headless backend',
                    'capability' => null,
                    'members' => [['language' => 'Node / TypeScript', 'slug' => 'fancy-term-host']],
                ],
            ],
        ],
        [
            'slug' => 'fancy-cms',
            'name' => 'Fancy CMS',
            'tagline' => 'The Stages document model — a PHP host + page renderer (node tree → HTML with island hydration) paired with a WYSIWYG React editor. Early-release beta.',
            'group' => 'surfaces',
            'kind' => 'ui',
            'sections' => [
                [
                    'label' => 'Backend',
                    'capability' => null,
                    'members' => [['language' => 'PHP', 'slug' => 'fancy-cms']],
                ],
                [
                    'label' => 'Editor UI',
                    'capability' => null,
                    'members' => [['language' => 'React', 'slug' => 'fancy-cms-ui']],
                ],
            ],
        ],
        [
            'slug' => 'holy-sheet',
            'name' => 'Holy Sheet',
            'tagline' => 'Headless xlsx spreadsheet writer/reader with a formula engine — one Agent write / describe / lint API, mirrored across languages.',
            'group' => 'documents',
            'kind' => 'headless',
            'sections' => [[
                'label' => 'Writer / reader',
                'capability' => 'xlsx writer/reader (+ formula engine)',
                'members' => [
                    ['language' => 'PHP', 'slug' => 'holy-sheet'],
                    ['language' => 'Node / TypeScript', 'slug' => 'holy-sheet-js'],
                ],
            ]],
        ],
        [
            'slug' => 'dark-slide',
            'name' => 'Dark Slide',
            'tagline' => 'Headless pptx deck writer/reader — markdown headings, highlighted code, tables, gradients, and a high-fidelity reader.',
            'group' => 'documents',
            'kind' => 'headless',
            'sections' => [[
                'label' => 'Writer / reader',
                'capability' => 'pptx writer/reader',
                'members' => [
                    ['language' => 'PHP', 'slug' => 'dark-slide'],
                    ['language' => 'Node / TypeScript', 'slug' => 'dark-slide-js'],
                ],
            ]],
        ],
        [
            'slug' => 'last-word',
            'name' => 'Last Word',
            'tagline' => 'Headless docx writer/reader on one JSON Doc model — headings, styled runs, lists, tables, code — with markdown bridges both ways.',
            'group' => 'documents',
            'kind' => 'headless',
            'sections' => [[
                'label' => 'Writer / reader',
                'capability' => 'docx writer/reader (+ markdown bridges)',
                'members' => [
                    ['language' => 'PHP', 'slug' => 'last-word'],
                    ['language' => 'Node / TypeScript', 'slug' => 'last-word-js'],
                ],
            ]],
        ],
        [
            'slug' => 'laravel-catalog',
            'name' => 'Fancy Catalog',
            'tagline' => 'Headless Stripe catalog — products / prices / plans + checkout — adapter-based with an injected Stripe client.',
            'group' => 'commerce',
            'kind' => 'headless',
            'sections' => [[
                'label' => 'Catalog',
                'capability' => 'Stripe catalog (products / prices / plans / checkout)',
                'members' => [
                    ['language' => 'PHP', 'slug' => 'laravel-catalog'],
                    ['language' => 'Node / TypeScript', 'slug' => 'fancy-catalog-js'],
                ],
            ]],
        ],
        [
            'slug' => 'laravel-fms',
            'name' => 'Fancy Features',
            'tagline' => 'Headless feature management — gate / registry / config / group strategies plus metered quotas. Owns the FeatureSource contract catalog plugs into.',
            'group' => 'commerce',
            'kind' => 'headless',
            'sections' => [[
                'label' => 'Feature management',
                'capability' => 'Feature management (gates, quotas, metered features)',
                'members' => [
                    ['language' => 'PHP', 'slug' => 'laravel-fms'],
                    ['language' => 'Node / TypeScript', 'slug' => 'fancy-features-js'],
                ],
            ]],
        ],
        [
            'slug' => 'fancy-heuristics',
            'name' => 'Fancy Heuristics',
            'tagline' => 'End-user (not search-engine) optimization — human + agent interaction analytics: event ingestion, focus heatmaps, and session / actor rollups, with a browser collector.',
            'group' => 'platform',
            'kind' => 'headless',
            'sections' => [[
                'label' => 'Server + collector',
                'capability' => 'Interaction analytics (EUO)',
                'members' => [
                    ['language' => 'PHP', 'slug' => 'fancy-heuristics'],
                    ['language' => 'Node / TypeScript', 'slug' => 'fancy-heuristics-js'],
                ],
            ]],
        ],
    ];

    /**
     * Every slug that belongs to a family — the set the flat listing drops
     * before injecting one card per family.
     *
     * @return list<string>
     */
    public static function memberSlugs(): array
    {
        $slugs = [];
        foreach (self::FAMILIES as $family) {
            foreach ($family['sections'] as $section) {
                foreach ($section['members'] as $member) {
                    $slugs[] = $member['slug'];
                }
            }
        }

        return $slugs;
    }

    /**
     * The family whose slug OR any member slug is $slug, or null.
     *
     * @return array<string,mixed>|null
     */
    public static function find(string $slug): ?array
    {
        foreach (self::FAMILIES as $family) {
            if ($family['slug'] === $slug) {
                return $family;
            }
            foreach ($family['sections'] as $section) {
                foreach ($section['members'] as $member) {
                    if ($member['slug'] === $slug) {
                        return $family;
                    }
                }
            }
        }

        return null;
    }

    /** The canonical page slug for a member slug, or null when it is in no family. */
    public static function canonicalFor(string $slug): ?string
    {
        return self::find($slug)['slug'] ?? null;
    }

    /**
     * Distinct language labels across a family, in first-seen order.
     *
     * @return list<string>
     */
    public static function languagesFor(string $slug): array
    {
        $family = self::find($slug);
        if ($family === null) {
            return [];
        }

        $languages = [];
        foreach ($family['sections'] as $section) {
            foreach ($section['members'] as $member) {
                if (! in_array($member['language'], $languages, true)) {
                    $languages[] = $member['language'];
                }
            }
        }

        return $languages;
    }

    /** @return array<int, array<string,mixed>> */
    public static function all(): array
    {
        return self::FAMILIES;
    }

    /**
     * Every language-mirrored capability across all families, as the
     * capability → php/node package-id pairs the MCP start_project mirror
     * strategy publishes. Ids come from {@see PackageRegistry} so they stay
     * defined in one place; a language with no mirror yet is null.
     *
     * @return array<int, array{capability: string, php: ?string, node: ?string}>
     */
    public static function mcpPairs(): array
    {
        $pairs = [];

        foreach (self::FAMILIES as $family) {
            foreach ($family['sections'] as $section) {
                if ($section['capability'] === null) {
                    continue;
                }

                $ids = ['php' => null, 'node' => null];
                foreach ($section['members'] as $member) {
                    $column = self::MCP_LANGUAGES[$member['language']] ?? null;
                    if ($column === null) {
                        continue; // React UI companions are not a server mirror.
                    }
                    $record = PackageRegistry::findAny($member['slug']) ?? [];
                    $ids[$column] = $record['composer'] ?? $record['npm'] ?? null;
                }

                if ($ids['php'] === null && $ids['node'] === null) {
                    continue;
                }

                $pairs[] = ['capability' => $section['capability'], 'php' => $ids['php'], 'node' => $ids['node']];
            }
        }

        return $pairs;
    }
}

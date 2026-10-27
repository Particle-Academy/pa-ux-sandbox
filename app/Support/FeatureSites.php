<?php

declare(strict_types=1);

namespace App\Support;

/**
 * The eight Features: the parts of the kit that are whole platforms rather
 * than single components, each with its own micro-site at /features/{slug}.
 *
 * This is the ONE list. The nav dropdown reads it through the shared
 * `features` Inertia prop, the /features index reads it, each micro-site reads
 * its own entry, and the SEO single source ({@see Seo\PageSeo}) names the pages
 * from it. Owner ruling and plan: `.ai/plans/features-microsites.md`.
 *
 * What lives here is only what is true of a FEATURE: its name, a one-line
 * tagline, a Lucide icon name, its identity tokens and which packages it is
 * made of. Facts about a PACKAGE — its display name, install id, language,
 * tagline — are never typed here. Members are named by registry slug and
 * resolved through {@see PackageRegistry}, either directly or through a
 * {@see PackageFamily}, so a renamed or newly mirrored package reaches every
 * micro-site with no second edit. `FeatureSitesTest` fails if a member slug
 * stops resolving.
 *
 * Taglines must be checkable against the shipped packages: nothing that cannot
 * be installed is announced.
 */
final class FeatureSites
{
    /**
     * Display-font roles a Feature may pick. Mapped to the site's own font
     * stacks in resources/css/showcase/features.css; no new typefaces.
     */
    public const FONT_ROLES = ['sans', 'display', 'mono', 'serif'];

    /**
     * In nav order. `members` is ordered as the page lists them: a bare slug is
     * one registry package, and `family:<slug>` expands to every visible member
     * of that {@see PackageFamily}, so a mirror added to a family joins its
     * Feature with no edit here. `bridges` lists the agent-integrations bridges
     * a micro-site's "How it fits" names — empty where the Feature has no
     * Human+ surface of its own. `course` is the slug of the Feature's course
     * in the curriculum (FancyCurriculumContent); the page links to it only
     * while that course is published and listed.
     *
     * @var array<string, array{course: string, name: string, tagline: string, icon: string, component: string, theme: array{accent: string, accentDark: string, surface: string, surfaceDark: string, font: string}, members: list<string>, bridges: list<array{name: string, import: string, tools: string}>}>
     */
    private const SITES = [
        'flow' => [
            'course' => 'fancy-flow',
            'name' => 'Flow',
            'tagline' => 'Workflow graphs humans and agents build together, run by one engine in TypeScript, PHP and Python.',
            'icon' => 'workflow',
            'component' => 'Features/Flow/Index',
            'theme' => ['accent' => '#0284c7', 'accentDark' => '#38bdf8', 'surface' => '#f0f9ff', 'surfaceDark' => '#0a1722', 'font' => 'sans'],
            'members' => ['family:fancy-flow', 'fancy-flow-mcp'],
            'bridges' => [['name' => 'registerFlowBridge', 'import' => '@particle-academy/agent-integrations/bridges/flow', 'tools' => 'flow_*']],
        ],
        'tui' => [
            'course' => 'fancy-tui',
            'name' => 'TUI',
            'tagline' => 'Ink components for terminal apps that an agent can drive over MCP.',
            'icon' => 'square-terminal',
            'component' => 'Features/Tui/Index',
            'theme' => ['accent' => '#16a34a', 'accentDark' => '#4ade80', 'surface' => '#f0fdf4', 'surfaceDark' => '#06140b', 'font' => 'mono'],
            'members' => ['fancy-tui'],
            'bridges' => [['name' => 'registerTuiBridge', 'import' => '@particle-academy/agent-integrations/bridges/tui', 'tools' => 'tui_*']],
        ],
        'cms' => [
            'course' => 'fancy-cms',
            'name' => 'CMS',
            'tagline' => 'A WYSIWYG page editor in React on a Laravel content backend.',
            'icon' => 'layout-template',
            'component' => 'Features/Cms/Index',
            'theme' => ['accent' => '#e11d48', 'accentDark' => '#fb7185', 'surface' => '#fff1f2', 'surfaceDark' => '#1d0a10', 'font' => 'serif'],
            'members' => ['fancy-cms', 'fancy-cms-ui', 'charlotte'],
            'bridges' => [['name' => 'registerCmsBridge', 'import' => '@particle-academy/agent-integrations/bridges/cms', 'tools' => 'set_style / set_layout / …']],
        ],
        'documents' => [
            'course' => 'fancy-documents',
            'name' => 'Documents',
            'tagline' => 'xlsx, pptx and docx writers and readers for PHP, Node and Python, plus PDF for PHP.',
            'icon' => 'file-text',
            'component' => 'Features/Documents/Index',
            'theme' => ['accent' => '#2563eb', 'accentDark' => '#60a5fa', 'surface' => '#eff6ff', 'surfaceDark' => '#0a1124', 'font' => 'serif'],
            'members' => ['family:holy-sheet', 'family:dark-slide', 'family:last-word', 'family:fine-print'],
            'bridges' => [],
        ],
        'git' => [
            'course' => 'fancy-git',
            'name' => 'Git',
            'tagline' => 'Provider-neutral Git for PHP and Node, with GitHub, GitLab and Bitbucket adapters and a React UI.',
            'icon' => 'git-branch',
            'component' => 'Features/Git/Index',
            'theme' => ['accent' => '#ea580c', 'accentDark' => '#fb923c', 'surface' => '#fff7ed', 'surfaceDark' => '#1a0e05', 'font' => 'mono'],
            'members' => ['family:fancy-git'],
            'bridges' => [['name' => 'registerGitBridge', 'import' => '@particle-academy/agent-integrations/bridges/git', 'tools' => 'git_*']],
        ],
        '3d' => [
            'course' => 'fancy-3d',
            'name' => '3D',
            'tagline' => 'Engine-agnostic 3D scenes, rendered in the DOM or through Babylon.js or three.js.',
            'icon' => 'box',
            'component' => 'Features/ThreeD/Index',
            'theme' => ['accent' => '#7c3aed', 'accentDark' => '#a78bfa', 'surface' => '#f5f3ff', 'surfaceDark' => '#120c22', 'font' => 'display'],
            'members' => ['family:fancy-3d'],
            'bridges' => [['name' => 'registerSceneBridge', 'import' => '@particle-academy/agent-integrations/bridges/scene', 'tools' => 'scene_*']],
        ],
        'ecommerce' => [
            'course' => 'fancy-ecommerce',
            'name' => 'Ecommerce',
            'tagline' => 'Stripe catalog and checkout, plan and metered feature gating, and multi-level referrals.',
            'icon' => 'shopping-cart',
            'component' => 'Features/Ecommerce/Index',
            'theme' => ['accent' => '#059669', 'accentDark' => '#34d399', 'surface' => '#ecfdf5', 'surfaceDark' => '#05170f', 'font' => 'sans'],
            'members' => ['laravel-catalog', 'fancy-catalog-js', 'laravel-fms', 'fancy-features-js', 'family:fancy-mlm'],
            'bridges' => [
                ['name' => 'registerCatalogBridge', 'import' => '@particle-academy/agent-integrations/bridges/catalog', 'tools' => 'catalog_*'],
                ['name' => 'registerFeaturesBridge', 'import' => '@particle-academy/agent-integrations/bridges/features', 'tools' => 'features_*'],
            ],
        ],
        'gamification' => [
            'course' => 'fancy-gamification',
            'name' => 'Gamification',
            'tagline' => 'XP, achievements, prizes and leaderboards for Laravel apps.',
            'icon' => 'trophy',
            'component' => 'Features/Gamification/Index',
            'theme' => ['accent' => '#d97706', 'accentDark' => '#fbbf24', 'surface' => '#fffbeb', 'surfaceDark' => '#1a1204', 'font' => 'display'],
            'members' => ['laravel-fun-lab'],
            'bridges' => [],
        ],
    ];

    /** @return list<string> */
    public static function slugs(): array
    {
        return array_keys(self::SITES);
    }

    /**
     * Every `family:` reference, so a test can prove each names a real family:
     * a typo would otherwise expand to nothing and quietly drop its packages.
     *
     * @return list<string>
     */
    public static function familyReferences(): array
    {
        $families = [];
        foreach (self::SITES as $site) {
            foreach ($site['members'] as $entry) {
                if (str_starts_with($entry, 'family:')) {
                    $families[] = substr($entry, strlen('family:'));
                }
            }
        }

        return array_values(array_unique($families));
    }

    /**
     * Every Feature, in nav order, with its member SLUGS (unresolved).
     *
     * @return list<array{slug: string, name: string, tagline: string, icon: string, href: string, component: string, theme: array{accent: string, accentDark: string, surface: string, surfaceDark: string, font: string}, memberSlugs: list<string>, bridges: list<array{name: string, import: string, tools: string}>, course: string}>
     */
    public static function all(): array
    {
        return array_map(self::find(...), self::slugs());
    }

    /**
     * One Feature with its member slugs, or null.
     *
     * @return array{slug: string, name: string, tagline: string, icon: string, href: string, component: string, theme: array{accent: string, accentDark: string, surface: string, surfaceDark: string, font: string}, memberSlugs: list<string>, bridges: list<array{name: string, import: string, tools: string}>, course: string}|null
     */
    public static function find(string $slug): ?array
    {
        $site = self::SITES[$slug] ?? null;
        if ($site === null) {
            return null;
        }

        return [
            'slug' => $slug,
            'name' => $site['name'],
            'tagline' => $site['tagline'],
            'icon' => $site['icon'],
            'href' => "/features/{$slug}",
            'component' => $site['component'],
            'theme' => $site['theme'],
            'memberSlugs' => self::memberSlugs($site),
            'bridges' => $site['bridges'],
            'course' => $site['course'],
        ];
    }

    /**
     * What the nav needs and nothing more — it rides on every response.
     *
     * @return list<array{slug: string, name: string, tagline: string, icon: string, href: string}>
     */
    public static function nav(): array
    {
        return array_map(
            static fn (array $f): array => ['slug' => $f['slug'], 'name' => $f['name'], 'tagline' => $f['tagline'], 'icon' => $f['icon'], 'href' => $f['href']],
            self::all(),
        );
    }

    /**
     * A Feature with its members resolved through the registry, for its page.
     *
     * A member that does not resolve is dropped rather than shown: a listed
     * package nobody can install is the one thing these pages must not do.
     * The test suite fails on such a slug, so in practice none is dropped.
     *
     * @return array<string, mixed>|null
     */
    public static function resolved(string $slug): ?array
    {
        $feature = self::find($slug);
        if ($feature === null) {
            return null;
        }

        $members = [];
        foreach ($feature['memberSlugs'] as $memberSlug) {
            $member = self::member($memberSlug);
            if ($member !== null) {
                $members[] = $member;
            }
        }

        $languages = [];
        foreach ($members as $member) {
            if (! in_array($member['language'], $languages, true)) {
                $languages[] = $member['language'];
            }
        }

        unset($feature['memberSlugs']);

        return [...$feature, 'members' => $members, 'languages' => $languages];
    }

    /**
     * One member package, as the micro-site kit renders it.
     *
     * @return array{slug: string, name: string, tagline: string, language: string, registry: ?string, distribution: ?string, install: ?string, href: string, repoUrl: ?string}|null
     */
    public static function member(string $slug): ?array
    {
        $record = PackageRegistry::findAny($slug);
        if ($record === null) {
            return null;
        }

        [$registry, $distribution, $install] = match (true) {
            is_string($record['npm'] ?? null) => ['npm', $record['npm'], "npm install {$record['npm']}"],
            is_string($record['composer'] ?? null) => ['composer', $record['composer'], "composer require {$record['composer']}"],
            is_string($record['pypi'] ?? null) => ['pypi', $record['pypi'], "pip install {$record['pypi']}"],
            default => [null, null, null],
        };

        return [
            'slug' => $slug,
            'name' => (string) ($record['name'] ?? $slug),
            'tagline' => (string) ($record['tagline'] ?? ''),
            'language' => self::languageOf($slug, $record),
            'registry' => $registry,
            'distribution' => $distribution,
            'install' => $install,
            'href' => "/packages/{$slug}",
            'repoUrl' => isset($record['repo']) ? "https://github.com/{$record['repo']}" : null,
        ];
    }

    /**
     * The member's language label, as its family section names it ("React",
     * "Node / TypeScript", "PHP", "Python"). Outside a family the registry's
     * own field is mapped onto the same labels.
     *
     * @param  array<string, mixed>  $record
     */
    private static function languageOf(string $slug, array $record): string
    {
        $family = PackageFamily::find($slug);
        foreach ($family['sections'] ?? [] as $section) {
            foreach ($section['members'] as $member) {
                if ($member['slug'] === $slug) {
                    return (string) $member['language'];
                }
            }
        }

        return match ((string) ($record['language'] ?? '')) {
            'PHP' => 'PHP',
            'Python' => 'Python',
            default => ($record['kind'] ?? null) === 'ui' ? 'React' : 'Node / TypeScript',
        };
    }

    /**
     * @param  array{members: list<string>}  $site
     * @return list<string>
     */
    private static function memberSlugs(array $site): array
    {
        $slugs = [];
        foreach ($site['members'] as $entry) {
            if (str_starts_with($entry, 'family:')) {
                array_push($slugs, ...PackageFamily::memberSlugsOf(substr($entry, strlen('family:'))));
            } else {
                $slugs[] = $entry;
            }
        }

        return array_values(array_unique($slugs));
    }
}

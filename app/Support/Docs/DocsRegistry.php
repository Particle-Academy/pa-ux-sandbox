<?php

namespace App\Support\Docs;

/**
 * Sidebar layout + page metadata for the /docs hub. Each page references a
 * markdown file under resources/docs/{slug}.md and a sidebar group it belongs to.
 *
 * Add new pages by extending {@see SECTIONS} — the controller, sidebar nav,
 * and previous/next chrome update automatically.
 */
class DocsRegistry
{
    /**
     * @var array<int, array{
     *   label: string,
     *   pages: array<int, array{slug: string, title: string, description?: string}>
     * }>
     */
    private const SECTIONS = [
        [
            'label' => 'Getting started',
            'pages' => [
                ['slug' => 'introduction', 'title' => 'Introduction', 'description' => 'What Fancy UI is and the problem it solves.'],
                ['slug' => 'installation', 'title' => 'Installation', 'description' => 'Add Fancy UI to a React or Laravel app.'],
                ['slug' => 'theming', 'title' => 'Theming', 'description' => 'Tailwind v4 design tokens, dark mode, custom palettes.'],
            ],
        ],
        [
            'label' => 'Building with Fancy',
            'pages' => [
                ['slug' => 'building', 'title' => 'Building with Fancy', 'description' => 'The stack, the loop, and how the tutorials fit together.'],
                ['slug' => 'layouts', 'title' => 'Layouts & app shell', 'description' => 'Persistent layouts, navbars, sidebars, and multi-screen shells.'],
                ['slug' => 'page-transitions', 'title' => 'Page transitions', 'description' => 'Animate Inertia navigation with fancy-inertia crossfades.'],
                ['slug' => 'mobile', 'title' => 'Mobile & responsive', 'description' => 'Tailwind v4 breakpoints, touch, mobile nav, and SSR-safe rendering.'],
                ['slug' => 'designing-human-plus', 'title' => 'Designing for Human+', 'description' => 'Design surfaces humans and agents share — presence, trust, affordances.'],
                ['slug' => 'developing-human-plus', 'title' => 'Developing for Human+', 'description' => 'The component contract in code — controlled state, handles, bridges.'],
            ],
        ],
        [
            'label' => 'Wrapper packages',
            'pages' => [
                ['slug' => 'wrapper-packages', 'title' => 'Wrapping other libraries', 'description' => 'The packages that wrap ECharts, React Flow, three.js, Babylon, xterm.js, TanStack Query & Inertia — with deep links.'],
            ],
        ],
        [
            'label' => 'Distribution',
            'pages' => [
                ['slug' => 'cli', 'title' => 'CLI', 'description' => 'fancy-ui CLI reference — init, add, list, search.'],
                ['slug' => 'registry', 'title' => 'Registry', 'description' => 'The /r/index.json + /r/{slug}.json contract.'],
            ],
        ],
        [
            'label' => 'Agents',
            'pages' => [
                ['slug' => 'plugin', 'title' => 'Claude Code plugin', 'description' => 'One-step install of the registry MCP + five skills for Claude Code.'],
                ['slug' => 'mcp', 'title' => 'MCP servers', 'description' => 'Install-MCP, runtime bridges, and how agents drive the UI.'],
                ['slug' => 'human-plus-ux', 'title' => 'Human+ UX', 'description' => 'The architectural framework — humans and agents in the same UI.'],
            ],
        ],
        [
            'label' => 'Reference',
            'pages' => [
                ['slug' => 'changelog', 'title' => 'Changelog', 'description' => 'Release notes across every Fancy UI package.'],
            ],
        ],
    ];

    /** @return list<array{label: string, pages: list<array{slug: string, title: string, description?: string}>}> */
    public static function sections(): array
    {
        return self::SECTIONS;
    }

    /** @return list<array{slug: string, title: string, description?: string, section: string}> */
    public static function flat(): array
    {
        $flat = [];
        foreach (self::SECTIONS as $section) {
            foreach ($section['pages'] as $page) {
                $flat[] = $page + ['section' => $section['label']];
            }
        }

        return $flat;
    }

    /** @return array{slug: string, title: string, description?: string, section: string}|null */
    public static function find(string $slug): ?array
    {
        foreach (self::flat() as $page) {
            if ($page['slug'] === $slug) {
                return $page;
            }
        }

        return null;
    }

    /**
     * @return array{prev: array{slug: string, title: string}|null, next: array{slug: string, title: string}|null}
     */
    public static function neighbors(string $slug): array
    {
        $flat = self::flat();
        $i = null;
        foreach ($flat as $idx => $page) {
            if ($page['slug'] === $slug) {
                $i = $idx;
                break;
            }
        }
        if ($i === null) {
            return ['prev' => null, 'next' => null];
        }

        return [
            'prev' => $i > 0 ? ['slug' => $flat[$i - 1]['slug'], 'title' => $flat[$i - 1]['title']] : null,
            'next' => isset($flat[$i + 1]) ? ['slug' => $flat[$i + 1]['slug'], 'title' => $flat[$i + 1]['title']] : null,
        ];
    }
}

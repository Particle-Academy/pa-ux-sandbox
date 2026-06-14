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
    /** @return array<int, array<string, mixed>> */
    public static function all(): array
    {
        return [
            self::reactFancy(),
            self::fancyWhiteboard(),
            self::fancyArtboard(),
            self::fancyFlow(),
            self::fancySheets(),
            self::fancySlides(),
            self::fancyCode(),
            self::fancyTerm(),
            self::fancyDiff(),
            self::fancyPixel(),
            self::fancyEcharts(),
            self::fancyScreens(),
            self::fancy3d(),
            self::fancy3dBabylon(),
            self::fancy3dThree(),
            self::agentIntegrations(),
            self::fancyInertia(),
            self::fancyMotion(),
            self::fancyCmsUi(),
        ];
    }

    /**
     * Companion packages — headless / no-UI deps developed alongside the
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
        return [
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
                'tagline' => 'Laravel host + PHP page renderer for the Stages doc model — node tree → HTML with island hydration. Backend pair of fancy-cms-ui. (preview — dev-main)',
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
                'slug' => 'mcp-relay-client',
                'name' => 'mcp-relay-client',
                'tagline' => 'Super-lite, single-file MCP client (bash / Python / TS / Go) for connecting an agent to a session-based relay — drive any agent-integrations-hosted app (e.g. the Agent Playground) from your terminal. Download one file, point it at a session URL.',
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
            ],
            [
                'slug' => 'fancy-term-host',
                'name' => '@particle-academy/fancy-term-host',
                'tagline' => 'Headless Node terminal backend for fancy-term — owns the PTYs (node-pty peer) and the T1/T2/T3 persistence engine (snapshot+replay, retained PTYs, detached pty-host) behind four injected ports. No UI.',
                'npm' => '@particle-academy/fancy-term-host',
                'repo' => 'Particle-Academy/fancy-term-host',
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
        ];
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
    private static function componentsForReactFancy(): array
    {
        // Mirrors packages/react-fancy/src/components/ — hand-listed for Phase 1.
        return array_map(fn (array $r) => $r + ['blurb' => ''], [
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
            ['slug' => 'file-upload', 'name' => 'FileUpload'],
            ['slug' => 'heading', 'name' => 'Heading'],
            ['slug' => 'icon', 'name' => 'Icon'],
            ['slug' => 'input-tag', 'name' => 'InputTag'],
            ['slug' => 'inputs', 'name' => 'Inputs'],
            ['slug' => 'kanban', 'name' => 'Kanban'],
            ['slug' => 'magic-wand', 'name' => 'MagicWand'],
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
            'tagline' => 'Workflow editor + runner on top of React Flow — six node kits, topological executor, headless engine, and a FlowRunnerUx flow→UX bridge.',
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
                ['slug' => 'code-editor', 'name' => 'CodeEditor', 'blurb' => 'Editor surface.'],
                ['slug' => 'markdown-editor', 'name' => 'MarkdownEditor', 'blurb' => 'Markdown editor + live preview.'],
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
            'tagline' => 'Inertia.js bridge — schema-driven pages, useFancyForm(), SSR boundaries.',
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
            'tagline' => 'WYSIWYG CMS editor (React) on the Stages doc model — pairs with the particle-academy/fancy-cms PHP renderer. (preview — 0.0.x)',
            'npm' => '@particle-academy/fancy-cms-ui',
            'repo' => 'Particle-Academy/fancy-cms-ui',
            'language' => 'TypeScript',
            'components' => [
                ['slug' => 'cms-editor', 'name' => 'Editor', 'blurb' => 'The WYSIWYG editor surface — canvas + layers + inspector over a Stages node tree.'],
                ['slug' => 'cms-page', 'name' => 'CmsPage', 'blurb' => 'Renders a published Stages document as a page.'],
                ['slug' => 'cms-region', 'name' => 'CmsRegion', 'blurb' => 'An editable / per-surface region within a CMS page.'],
            ],
        ];
    }
}

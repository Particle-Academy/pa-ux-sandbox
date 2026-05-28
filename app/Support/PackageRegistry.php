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
            self::fancyFlow(),
            self::fancySheets(),
            self::fancySlides(),
            self::fancyCode(),
            self::fancyEcharts(),
            self::fancyScreens(),
            self::fancy3d(),
            self::fancy3dBabylon(),
            self::agentIntegrations(),
            self::holySheet(),
            self::darkSlide(),
            self::fancyInertia(),
        ];
    }

    /**
     * Companion PHP packages — composer deps that ship inside this sandbox
     * monorepo (the sandbox doubles as their development host) but aren't
     * part of the Fancy UI showcase narrative. Rendered as a footnote
     * section on /packages, not in the main grid; no per-package detail
     * page generated.
     *
     * @return array<int, array<string, mixed>>
     */
    public static function companions(): array
    {
        return [
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
            'components' => self::componentsForReactFancy(),
        ];
    }

    /** @return array<int, array{slug:string,name:string,blurb:string}> */
    private static function componentsForReactFancy(): array
    {
        // Mirrors packages/react-fancy/src/components/ — hand-listed for Phase 1.
        return array_map(fn (array $r) => $r + ['blurb' => ''], [
            ['slug' => 'accordion', 'name' => 'Accordion'],
            ['slug' => 'action', 'name' => 'Action'],
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
            ['slug' => 'table', 'name' => 'Table'],
            ['slug' => 'tabs', 'name' => 'Tabs'],
            ['slug' => 'text', 'name' => 'Text'],
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
    private static function fancyFlow(): array
    {
        return [
            'slug' => 'fancy-flow',
            'name' => 'fancy-flow',
            'tagline' => 'Workflow editor + runner on top of React Flow — six node kits, topological executor.',
            'npm' => '@particle-academy/fancy-flow',
            'repo' => 'Particle-Academy/fancy-flow',
            'language' => 'TypeScript',
            'components' => [
                ['slug' => 'flow-editor', 'name' => 'FlowEditor', 'blurb' => 'Main editor canvas.'],
                ['slug' => 'use-flow-state', 'name' => 'useFlowState', 'blurb' => 'Controlled state hook.'],
                ['slug' => 'use-flow-run', 'name' => 'useFlowRun', 'blurb' => 'Executor hook.'],
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
    private static function holySheet(): array
    {
        return [
            'slug' => 'holy-sheet',
            'name' => 'holy-sheet',
            'tagline' => 'PHP 8.2+ xlsx writer for agentic document creation. Optional Laravel adapter.',
            'composer' => 'particle-academy/holy-sheet',
            'repo' => 'Particle-Academy/holy-sheet',
            'language' => 'PHP',
            'components' => [
                ['slug' => 'agent', 'name' => 'Agent', 'blurb' => 'Top-level write/describe/lint API.'],
            ],
        ];
    }

    /** @return array<string, mixed> */
    private static function darkSlide(): array
    {
        return [
            'slug' => 'dark-slide',
            'name' => 'dark-slide',
            'tagline' => 'PHP 8.2+ pptx writer/reader for agentic deck creation. v0.3 ships markdown headings, syntax-highlighted code blocks, real tables, gradient backgrounds, and a high-fidelity reader. Framework-agnostic; optional Laravel adapter. Sister to holy-sheet.',
            'composer' => 'particle-academy/dark-slide',
            'repo' => 'Particle-Academy/dark-slide',
            'language' => 'PHP',
            'components' => [
                ['slug' => 'agent', 'name' => 'Agent', 'blurb' => 'Top-level static surface: validate / write / toBytes / read / describe / validateAndRepair.'],
                ['slug' => 'pptx-writer', 'name' => 'PptxWriter', 'blurb' => 'Office Open XML writer — text, image, shape, notes, multi-slide, real tables, gradient backgrounds, syntax-highlighted code.'],
                ['slug' => 'pptx-reader', 'name' => 'PptxReader', 'blurb' => 'PPTX → Deck schema extractor. Round-trips tables, gradients, embedded images (as data URIs), and inline markdown spans.'],
                ['slug' => 'syntax-highlighter', 'name' => 'SyntaxHighlighter', 'blurb' => 'Pure-PHP tokenizer used by the writer to color code blocks. JS/TS, PHP, JSON, bash, CSS, Python, HTML.'],
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
            'components' => [
                ['slug' => 'fancy-app-root', 'name' => 'FancyAppRoot', 'blurb' => 'Inertia app root.'],
                ['slug' => 'use-fancy-form', 'name' => 'useFancyForm', 'blurb' => 'Form hook.'],
            ],
        ];
    }
}

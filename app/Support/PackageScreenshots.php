<?php

declare(strict_types=1);

namespace App\Support;

/**
 * Which package pages carry a screenshot, and which page of THIS site each one
 * is captured from.
 *
 * Every image is a real capture of the package at work on the showcase, taken
 * by `php artisan packages:screenshots` (headless, one browser) and committed
 * to `public/package-shots/<slug>.jpg`. A UI package is captured from its
 * component page, cropped to the live demo (`data-package-shot`). A headless
 * package is captured from a surface it powers, and the `alt` says so.
 *
 * `PackageScreenshotsTest` fails if a listed image is missing, so a page never
 * silently loses its visual.
 */
final class PackageScreenshots
{
    /**
     * slug => where to capture it and how to describe it. `selector` crops the
     * capture to one element; null captures the viewport.
     *
     * @var array<string, array{from: string, selector: ?string, alt: string}>
     */
    private const SHOTS = [
        'react-fancy' => ['from' => '/packages/react-fancy/kanban', 'selector' => '[data-package-shot]', 'alt' => 'A react-fancy Kanban board in the showcase demo'],
        'fancy-artboard' => ['from' => '/packages/fancy-artboard/artboard', 'selector' => '[data-package-shot]', 'alt' => 'A fancy-artboard design canvas with pieces and notes'],
        'fancy-flow' => ['from' => '/packages/fancy-flow/flow-editor', 'selector' => '[data-package-shot]', 'alt' => 'A workflow graph in the fancy-flow editor'],
        'fancy-sheets' => ['from' => '/packages/fancy-sheets/sheet-workbook', 'selector' => '[data-package-shot]', 'alt' => 'A fancy-sheets workbook with formulas'],
        'fancy-docs' => ['from' => '/packages/fancy-docs/doc-viewer', 'selector' => '[data-package-shot]', 'alt' => 'A document in the fancy-docs viewer'],
        'fancy-slides' => ['from' => '/packages/fancy-slides/deck-editor', 'selector' => '[data-package-shot]', 'alt' => 'A deck in the fancy-slides editor'],
        'fancy-code' => ['from' => '/packages/fancy-code/code-editor', 'selector' => '[data-package-shot]', 'alt' => 'Source in the fancy-code editor'],
        'fancy-term' => ['from' => '/packages/fancy-term/terminal', 'selector' => '[data-package-shot]', 'alt' => 'A fancy-term terminal'],
        'fancy-diff' => ['from' => '/packages/fancy-diff/fancy-diff', 'selector' => '[data-package-shot]', 'alt' => 'A fancy-diff review with per-hunk accept and reject'],
        'fancy-pixel' => ['from' => '/packages/fancy-pixel/pixel', 'selector' => '[data-package-shot]', 'alt' => 'The fancy-pixel badge, mark and beacon styles'],
        'fancy-echarts' => ['from' => '/packages/fancy-echarts/echart', 'selector' => '[data-package-shot]', 'alt' => 'An ECharts chart through fancy-echarts'],
        'fancy-mlm-ui' => ['from' => '/packages/fancy-mlm-ui/downline-tree', 'selector' => '[data-package-shot]', 'alt' => 'A referral downline tree from fancy-mlm-ui'],
        'fancy-fun-lab-ui' => ['from' => '/packages/fancy-fun-lab-ui/fun-lab-leaderboard', 'selector' => '[data-package-shot]', 'alt' => 'A fancy-fun-lab-ui leaderboard'],
        'fancy-passkeys-ui' => ['from' => '/packages/fancy-passkeys-ui/passkey-manager', 'selector' => '[data-package-shot]', 'alt' => 'The fancy-passkeys-ui passkey manager'],
        'last-word-ui' => ['from' => '/packages/last-word-ui/doc-viewer', 'selector' => '[data-package-shot]', 'alt' => 'A docx document in the last-word-ui viewer'],
        'classroom' => ['from' => '/packages/classroom/course-player', 'selector' => '[data-package-shot]', 'alt' => 'A course in the classroom course player'],
        'teachers-aid-ui' => ['from' => '/packages/teachers-aid-ui/teachers-aid-chat', 'selector' => '[data-package-shot]', 'alt' => 'The teachers-aid-ui chat'],
        'fancy-git-ui' => ['from' => '/packages/fancy-git-ui/repository-browser', 'selector' => '[data-package-shot]', 'alt' => 'The fancy-git-ui repository browser'],
        'fancy-x-files-ui' => ['from' => '/packages/fancy-x-files-ui/robots-editor', 'selector' => '[data-package-shot]', 'alt' => 'The fancy-x-files-ui robots.txt editor with a live preview'],
        'fancy-screens' => ['from' => '/packages/fancy-screens/screen-system', 'selector' => '[data-package-shot]', 'alt' => 'A fancy-screens screen system'],
        'fancy-3d' => ['from' => '/packages/fancy-3d/canvas', 'selector' => '[data-package-shot]', 'alt' => 'A fancy-3d scene on the DOM renderer'],
        'fancy-map' => ['from' => '/packages/fancy-map/map', 'selector' => '[data-package-shot]', 'alt' => 'A fancy-map map with markers'],
        'fancy-whats-new' => ['from' => '/packages/fancy-whats-new/whats-new', 'selector' => '[data-package-shot]', 'alt' => 'The fancy-whats-new release notes panel'],
        'fancy-motion' => ['from' => '/packages/fancy-motion/motion-stage', 'selector' => '[data-package-shot]', 'alt' => 'A fancy-motion stage and timeline'],
        'fancy-cms-ui' => ['from' => '/packages/fancy-cms-ui/cms-editor', 'selector' => '[data-package-shot]', 'alt' => 'A page in the fancy-cms-ui editor'],
        'catalog-fms' => ['from' => '/packages/catalog-fms/pricing-table', 'selector' => '[data-package-shot]', 'alt' => 'A pricing table from the catalog and FMS block'],
        'agent-integrations' => ['from' => '/packages/agent-integrations/agent-panel', 'selector' => '[data-package-shot]', 'alt' => 'The agent-integrations agent panel'],
        // Headless: a surface each one powers.
        'fancy-heuristics' => ['from' => '/features/heuristics', 'selector' => null, 'alt' => 'The Analytics & Heuristics feature page; fancy-heuristics is headless and powers this showcase\'s analytics'],
        'fancy-heuristics-js' => ['from' => '/features/heuristics', 'selector' => null, 'alt' => 'The Analytics & Heuristics feature page; fancy-heuristics-js is the headless browser collector behind it'],
    ];

    /** @return array<string, array{from: string, selector: ?string, alt: string}> */
    public static function all(): array
    {
        return self::SHOTS;
    }

    /** `package-shots/<slug>.jpg`, relative to `public/`. */
    public static function relativePath(string $slug): string
    {
        return 'package-shots/'.$slug.'.jpg';
    }

    /**
     * The screenshot a package page shows, or null when it has none on disk.
     *
     * @return array{src: string, alt: string, from: string}|null
     */
    public static function for(string $slug): ?array
    {
        $shot = self::SHOTS[$slug] ?? null;
        if ($shot === null || ! is_file(public_path(self::relativePath($slug)))) {
            return null;
        }

        return ['src' => '/'.self::relativePath($slug), 'alt' => $shot['alt'], 'from' => $shot['from']];
    }
}

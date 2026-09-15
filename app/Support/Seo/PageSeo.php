<?php

namespace App\Support\Seo;

use App\Http\Controllers\Showcase\StarterKitController;
use App\Support\Curriculum\FancyCurriculumContent;
use App\Support\Docs\DocsArchive;
use App\Support\Docs\DocsRegistry;
use App\Support\GalleryRegistry;
use App\Support\PackageFamily;
use App\Support\PackageRegistry;
use App\Support\UseCases\UseCaseContent;

/**
 * What each page IS, said once, for both its meta and its share card.
 *
 * A link to a family page unfurled as "Fancy UI — Components for the surfaces
 * where humans and agents work together", with the site's default card: the
 * family had no SEO of its own, and neither did its starter kit, the courses,
 * the flow editor or the storefront. Every docs page had its own title and the
 * SAME card. Pages were telling a reader nothing about themselves the moment
 * the link left the site.
 *
 * So a page's title, description and card come from here, keyed the way the
 * card route is keyed (`/og/{kind}/{key}.png`). The provider builds the meta
 * from {@see self::for()}; `OgImageController` draws the card from the SAME
 * call, so the preview text and the picture cannot describe two different
 * pages. `EveryPageHasItsOwnSeoTest` crawls the site and fails on any title,
 * description or card two pages share.
 */
final class PageSeo
{
    /**
     * The static pages, by route name.
     *
     * @var array<string, array{title: string, description: string, eyebrow: string}>
     */
    private const PAGES = [
        'packages.index' => [
            'eyebrow' => 'Packages',
            'title' => 'Packages — Fancy UI',
            'description' => 'Every package in the Fancy UI suite, grouped into families: react-fancy, fancy-3d, fancy-slides, fancy-whiteboard, fancy-flow, fancy-sheets, fancy-echarts, fancy-code, fancy-screens, agent-integrations, and more.',
        ],
        'docs.index' => [
            'eyebrow' => 'Docs',
            'title' => 'Docs — Fancy UI',
            'description' => 'Documentation for the Fancy UI suite — installation, the Human+ UX contract, MCP agent bridges, and per-package guides.',
        ],
        'agent-playground' => [
            'eyebrow' => 'Agent Playground',
            'title' => 'Agent Playground — Fancy UI',
            'description' => 'A live playground where you connect your own agent over MCP and watch it author Fancy UI screens and drive live data — humans and agents sharing one UI surface.',
        ],
        'dreaming.index' => [
            'eyebrow' => 'Dreaming',
            'title' => 'Dreaming — Fancy UI',
            'description' => 'Speculative, in-progress UI primitives on the Fancy UI dreaming branch — vote on what gets manifested into the kit.',
        ],
        'dreaming.archived' => [
            'eyebrow' => 'Dreaming',
            'title' => 'Archived dreams — Fancy UI',
            'description' => 'Speculative UI primitives from the Fancy UI dreaming branch that were archived rather than manifested into the kit, kept for reference.',
        ],
        'leaderboard' => [
            'eyebrow' => 'Community',
            'title' => 'Leaderboard — Fancy UI',
            'description' => 'The Fancy UI community leaderboard — XP, achievements, and prizes for building with the kit.',
        ],
        'showcase.showcase.index' => [
            'eyebrow' => 'Showcase',
            'title' => 'Showcase — Fancy UI',
            'description' => 'Apps and experiments built with Fancy UI by the community.',
        ],
        'shop.index' => [
            'eyebrow' => 'Shop',
            'title' => 'Shop — Fancy UI',
            'description' => 'Cosmetics and perks for your Fancy UI profile.',
        ],
        'use-cases.index' => [
            'eyebrow' => 'Use cases',
            'title' => 'Use cases — what you can build with Fancy UI',
            'description' => 'Blueprints and how-tos for the apps people actually build: subscription SaaS, e-commerce, online courses, referral networks, dashboards and real-estate portals — each with live component previews and real code.',
        ],
        'flow.index' => [
            'eyebrow' => 'fancy-flow',
            'title' => 'Fancy Flow — the workflow editor and engine — Fancy UI',
            'description' => 'The live fancy-flow editor — swimlanes, undo and redo, auto-layout — over the headless engine that runs the same graphs with zero React on a server, a worker or a CLI.',
        ],
        'fancy-tui.index' => [
            'eyebrow' => 'fancy-tui',
            'title' => 'fancy-tui — a live terminal app — Fancy UI',
            'description' => 'The fancy-tui showcase as one live Ink terminal app, streamed to your browser: Human+ terminal components with controlled inputs, scrollback-safe conversations and MCP workflows.',
        ],
        'pw' => [
            'eyebrow' => 'Tool',
            'title' => 'Password generator — Fancy UI',
            'description' => 'A standalone password generator that runs entirely in your browser; the server never sees what it generates.',
        ],
        'subscriptions.index' => [
            'eyebrow' => 'Fancy UI Pro',
            'title' => 'Fancy UI Pro — plans and pricing',
            'description' => 'Fancy UI Pro: behavioural analytics off the Fancy Pixel, including the human-versus-agent split, and full source export for components.',
        ],
        'products.index' => [
            'eyebrow' => 'laravel-catalog demo',
            'title' => 'Demo storefront — laravel-catalog — Fancy UI',
            'description' => 'A demo storefront for particle-academy/laravel-catalog: Stripe products and prices, managed through the catalog facade and listed with their active prices.',
        ],
        'cms.home' => [
            'eyebrow' => 'fancy-cms demo',
            'title' => 'The home page, authored as a CMS document — Fancy UI',
            'description' => 'The Fancy UI home page rendered from a seeded fancy-cms Stages document instead of JSX, from the same data as the live page, so the two can be compared.',
        ],
    ];

    /**
     * The SEO for one page: title, description and the card spec behind its
     * image. Null when the key names nothing, which is a 404 for the card.
     *
     * @return array{title: string, description: string, card: array{eyebrow: ?string, title: string, subtitle: string}}|null
     */
    public static function for(string $kind, string $key): ?array
    {
        return match ($kind) {
            'pages' => self::page($key),
            'families' => self::family($key),
            'docs' => self::doc($key),
            'docs-archive' => self::archivedDoc($key),
            'components' => self::component($key),
            'use-cases' => self::useCase($key),
            'starter-kits' => self::starterKit($key),
            'inspiration' => self::inspiration($key),
            'learn' => self::course($key),
            default => null,
        };
    }

    /** The card URL for a page, relative, as fancy-seo expects. */
    public static function image(string $kind, string $key): string
    {
        return "/og/{$kind}/{$key}.png";
    }

    /**
     * The meta fancy-seo reads: title, description and the page's own card.
     *
     * @param  array<string, mixed>  $extra
     * @return array<string, mixed>
     */
    public static function meta(string $kind, string $key, array $extra = []): array
    {
        $seo = self::for($kind, $key);
        if ($seo === null) {
            return $extra;
        }

        return [
            'title' => $seo['title'],
            'description' => $seo['description'],
            'image' => self::image($kind, $key),
            'imageAlt' => $seo['title'],
            ...$extra,
        ];
    }

    /** @return array{title: string, description: string, card: array{eyebrow: ?string, title: string, subtitle: string}}|null */
    private static function page(string $routeName): ?array
    {
        $page = self::PAGES[$routeName] ?? null;

        return $page === null ? null : self::shape($page['title'], $page['description'], $page['eyebrow'], self::cardTitle($page['title']));
    }

    /** @return array{title: string, description: string, card: array{eyebrow: ?string, title: string, subtitle: string}}|null */
    private static function family(string $slug): ?array
    {
        $family = PackageFamily::find($slug);
        // A MEMBER slug also finds its family; the card is the family's own page.
        if ($family === null || $family['slug'] !== $slug) {
            return null;
        }

        $members = [];
        foreach ($family['sections'] as $section) {
            foreach ($section['members'] as $member) {
                $members[] = $member['slug'];
            }
        }
        $languages = PackageFamily::languagesFor($slug);

        return self::shape(
            "{$family['name']} — package family — Fancy UI",
            trim("{$family['tagline']} The {$family['name']} family: ".KitFacts::sentence($members).'.'),
            'Package family · '.implode(' · ', $languages),
            (string) $family['name'],
            (string) $family['tagline'],
        );
    }

    /** @return array{title: string, description: string, card: array{eyebrow: ?string, title: string, subtitle: string}}|null */
    private static function doc(string $slug): ?array
    {
        $page = DocsRegistry::find($slug);
        if ($page === null) {
            return null;
        }
        $title = (string) $page['title'];
        $description = trim((string) ($page['description'] ?? '')) ?: "{$title} — Fancy UI documentation.";

        return self::shape("{$title} — Docs — Fancy UI", $description, 'Docs', $title);
    }

    /**
     * A frozen docs page from an older kit line: `{version}/{slug}`.
     *
     * @return array{title: string, description: string, card: array{eyebrow: ?string, title: string, subtitle: string}}|null
     */
    private static function archivedDoc(string $key): ?array
    {
        [$version, $slug] = array_pad(explode('/', $key, 2), 2, 'introduction');
        $page = DocsArchive::exists($version) ? DocsArchive::find($version, $slug) : null;
        if ($page === null) {
            return null;
        }
        $title = (string) $page['title'];
        $description = trim((string) ($page['description'] ?? '')) ?: "{$title} — Fancy UI documentation.";

        return self::shape(
            "{$title} — Docs {$version} — Fancy UI",
            "Kit {$version} docs, frozen: {$description}",
            "Docs · kit {$version}",
            $title,
            $description,
        );
    }

    /** @return array{title: string, description: string, card: array{eyebrow: ?string, title: string, subtitle: string}}|null */
    private static function component(string $key): ?array
    {
        [$pkgSlug, $componentSlug] = array_pad(explode('/', $key, 2), 2, '');
        $pkg = PackageRegistry::findAny($pkgSlug);
        $component = collect($pkg['components'] ?? [])->firstWhere('slug', $componentSlug);
        if ($pkg === null || $component === null) {
            return null;
        }
        $pkgName = (string) ($pkg['name'] ?? $pkgSlug);
        $name = (string) ($component['name'] ?? $componentSlug);
        $blurb = trim((string) ($component['blurb'] ?? ''));

        return self::shape(
            "{$name} — {$pkgName} — Fancy UI",
            // The component's name is in the sentence even when there is a blurb:
            // two components with no blurb must not share a description.
            trim(($blurb !== '' ? "{$blurb} " : '')."{$name}, a {$pkgName} component in the Fancy UI suite."),
            $pkgName,
            $name,
            $blurb !== '' ? $blurb : "A {$pkgName} component.",
        );
    }

    /** @return array{title: string, description: string, card: array{eyebrow: ?string, title: string, subtitle: string}}|null */
    private static function useCase(string $slug): ?array
    {
        $useCase = UseCaseContent::find($slug);
        if ($useCase === null) {
            return null;
        }
        $title = (string) $useCase['title'];
        $summary = trim((string) ($useCase['summary'] ?? ''));

        return self::shape(
            "{$title} — Use cases — Fancy UI",
            $summary !== '' ? $summary : "{$title} — built with the Fancy UI kit.",
            'Use case',
            $title,
        );
    }

    /** @return array{title: string, description: string, card: array{eyebrow: ?string, title: string, subtitle: string}}|null */
    private static function starterKit(string $slug): ?array
    {
        if ($slug === 'index') {
            // Named from the kits on the page. It promised "production-ready"
            // kits to "ship a Human+ UX app in minutes", which is not what the
            // page holds: working starting points, one per package.
            $description = 'Starter apps built on Fancy UI, each a working starting point to clone: '
                .KitFacts::sentence(array_column(StarterKitController::kits(), 'name')).'.';

            return self::shape('Starter Kits — Fancy UI', $description, 'Starter kits', 'Starter kits');
        }

        $kit = collect(StarterKitController::kits())->firstWhere('slug', $slug);
        if ($kit === null) {
            return null;
        }

        return self::shape(
            "{$kit['name']} — Starter kits — Fancy UI",
            "{$kit['blurb']} A Fancy UI starter app on {$kit['pkg']}.",
            "Starter kit · {$kit['pkg']}",
            (string) $kit['name'],
            (string) $kit['blurb'],
        );
    }

    /**
     * An inspiration collection (`fieldwork`) or one of its styles
     * (`fieldwork/swiss`).
     *
     * @return array{title: string, description: string, card: array{eyebrow: ?string, title: string, subtitle: string}}|null
     */
    private static function inspiration(string $key): ?array
    {
        if ($key === 'index') {
            // Every collection, named, with its own count. The typed version
            // described two collections after a third (Dashboards) shipped.
            $collections = array_map(
                static fn (array $c): string => "{$c['name']} ({$c['subject']}, {$c['count']} designs)",
                GalleryRegistry::collections(),
            );
            $description = 'Fictional subjects, each designed many ways from restyled Fancy UI primitives: '
                .KitFacts::sentence($collections).'. Self-contained, forkable starting points built on the Fancy UI Kit.';

            return self::shape('Inspiration Gallery — Fancy UI', $description, 'Inspiration Gallery', 'Inspiration Gallery');
        }

        [$collectionId, $styleId] = array_pad(explode('/', $key, 2), 2, null);
        $collection = GalleryRegistry::collection($collectionId);
        if ($collection === null) {
            return null;
        }

        if ($styleId === null) {
            return self::shape(
                "{$collection['name']} — Inspiration Gallery — Fancy UI",
                "{$collection['name']} — {$collection['subject']}, designed {$collection['count']} ways with restyled Fancy UI primitives. {$collection['title']}",
                'Inspiration Gallery',
                (string) $collection['name'],
                "{$collection['subject']}, designed {$collection['count']} ways",
            );
        }

        $style = GalleryRegistry::find($collectionId, $styleId);
        if ($style === null) {
            return null;
        }
        $name = (string) $style['name'];
        $note = trim((string) $style['note']);

        return self::shape(
            "{$name} — {$collection['name']} — Inspiration Gallery — Fancy UI",
            trim("{$collection['name']}, designed as {$name}. {$note} A self-contained, forkable starting point built on the Fancy UI Kit."),
            "Inspiration · {$collection['name']}",
            $name,
            $note,
        );
    }

    /**
     * The curriculum (`index`) or one course (`fancy-core`). Read from the
     * content class the curriculum is authored from, so SEO needs no database.
     *
     * @return array{title: string, description: string, card: array{eyebrow: ?string, title: string, subtitle: string}}|null
     */
    private static function course(string $key): ?array
    {
        if ($key === 'index') {
            $curriculum = FancyCurriculumContent::curriculum();

            return self::shape(
                "Learn — the {$curriculum['title']} curriculum — Fancy UI",
                (string) $curriculum['description'],
                'Learn',
                "The {$curriculum['title']} curriculum",
                (string) $curriculum['description'],
            );
        }

        $course = collect(FancyCurriculumContent::courses())->firstWhere('slug', $key);
        if ($course === null) {
            return null;
        }

        return self::shape(
            "{$course['title']} — Learn — Fancy UI",
            (string) $course['description'],
            'Course · Fancy UI curriculum',
            (string) $course['title'],
            (string) $course['description'],
        );
    }

    /** "Packages — Fancy UI" -> "Packages": the card already carries the brand. */
    private static function cardTitle(string $title): string
    {
        return trim((string) preg_replace('/\s+—\s+Fancy UI$/u', '', $title));
    }

    /** @return array{title: string, description: string, card: array{eyebrow: ?string, title: string, subtitle: string}} */
    private static function shape(string $title, string $description, ?string $eyebrow, string $cardTitle, ?string $subtitle = null): array
    {
        return [
            'title' => $title,
            'description' => $description,
            'card' => ['eyebrow' => $eyebrow, 'title' => $cardTitle, 'subtitle' => $subtitle ?? $description],
        ];
    }
}

<?php

namespace App\Providers;

use App\Support\Docs\DocsRegistry;
use App\Support\GalleryRegistry;
use App\Support\PackageRegistry;
use FancySeo\Facades\FancySeo;
use FancySeo\JsonLd;
use FancySeo\SitemapBuilder;
use Illuminate\Support\ServiceProvider;

/**
 * Server-rendered SEO for the showcase, expressed through the shipped
 * `particle-academy/fancy-seo` package (the site dogfoods its own SEO stack).
 *
 * Static scalars (site name, default image, robots/AI-bot policy, security
 * contact) live in config/fancy-seo.php. Everything that needs PHP — per-route
 * titles/descriptions, JSON-LD (WebSite / Organization / SoftwareApplication +
 * per-package SoftwareSourceCode / BreadcrumbList), the dynamic sitemap, and the
 * llmstxt.org index — is registered here. The `<x-fancy-seo::head>` component in
 * showcase-app.blade.php renders the resolved head into the first byte; the
 * client `<Seo>` from @particle-academy/fancy-inertia/seo layers per-page
 * overrides on SPA navigation via head-key dedupe.
 */
class SeoServiceProvider extends ServiceProvider
{
    /** Public showcase version surfaced in the llms.txt index. */
    public const VERSION = '0.2';

    private const TAGLINE = 'Components for the surfaces where humans and agents work together.';

    public function boot(): void
    {
        $base = rtrim((string) config('fancy-seo.url', config('app.url')), '/');

        $this->registerDefaults($base);
        $this->registerRouteResolvers($base);
        $this->registerSitemap();
        $this->registerLlms($base);
        $this->registerMarkdown();
    }

    /**
     * Serve the raw source markdown of any docs page at `/docs/{slug}.md` — a
     * clean, chrome-free variant for LLM fetchers (linked from the `<head>` and
     * llms.txt). Returns null for non-doc paths so the route 404s.
     */
    private function registerMarkdown(): void
    {
        FancySeo::markdownUsing(function (string $path): ?string {
            $path = ltrim($path, '/'); // MarkdownController passes a leading slash
            if (! str_starts_with($path, 'docs/')) {
                return null;
            }
            $slug = substr($path, strlen('docs/'));
            if (DocsRegistry::find($slug) === null) {
                return null;
            }
            $file = base_path("resources/docs/{$slug}.md");

            return is_file($file) ? (string) file_get_contents($file) : null;
        });
    }

    /** Site-identity JSON-LD emitted on every page (accumulates with per-route nodes). */
    private function registerDefaults(string $base): void
    {
        FancySeo::defaults([
            'jsonLd' => [
                JsonLd::website('Fancy UI', $base.'/', self::TAGLINE),
                JsonLd::organization(
                    'Particle Academy',
                    $base.'/',
                    $base.'/showcase-assets/fancy-ui-logo.jpg',
                    ['https://github.com/Particle-Academy'],
                ),
                JsonLd::softwareApplication('Fancy UI', $base.'/', [
                    'applicationCategory' => 'DeveloperApplication',
                    'operatingSystem' => 'Web',
                    'softwareVersion' => self::VERSION,
                    'description' => self::TAGLINE,
                    'price' => '0',
                ]),
            ],
        ]);
    }

    private function registerRouteResolvers(string $base): void
    {
        FancySeo::route('home', [
            'title' => 'Fancy UI for React, Inertia, and Laravel | Human-Agent UI',
            'description' => self::TAGLINE.' A suite of React + Laravel UI primitives, every component both authorable (terse, JSON-friendly) and inhabitable by AI agents over MCP — no DOM scraping.',
        ]);

        FancySeo::route('packages.index', [
            'title' => 'Packages — Fancy UI',
            'description' => 'Every package in the Fancy UI suite: react-fancy, fancy-3d, fancy-slides, fancy-whiteboard, fancy-flow, fancy-sheets, fancy-echarts, fancy-code, fancy-screens, agent-integrations, and more.',
        ]);

        FancySeo::route('docs.index', [
            'title' => 'Docs — Fancy UI',
            'description' => 'Documentation for the Fancy UI suite — installation, the Human+ UX contract, MCP agent bridges, and per-package guides.',
            'type' => 'article',
        ]);

        FancySeo::route('starter-kits.index', [
            'title' => 'Starter Kits — Fancy UI',
            'description' => 'Production-ready starter kits built on Fancy UI — clone, install, and ship a Human+ UX app in minutes.',
        ]);

        FancySeo::route('inspiration.index', [
            'title' => 'Inspiration Gallery — Fancy UI',
            'description' => 'One creative-studio portfolio, designed twenty ways — from quiet Swiss grids to agent-native surfaces. Self-contained, forkable starting points built on the Fancy UI Kit.',
        ]);

        FancySeo::route('inspiration.show', fn (array $params): array => $this->inspirationSeo($params['style'] ?? null, $base));

        FancySeo::route('agent-playground', [
            'title' => 'Agent Playground — Fancy UI',
            'description' => 'A live playground where you connect your own agent over MCP and watch it author Fancy UI screens and drive live data — humans and agents sharing one UI surface.',
        ]);

        FancySeo::route('dreaming.index', [
            'title' => 'Dreaming — Fancy UI',
            'description' => 'Speculative, in-progress UI primitives on the Fancy UI dreaming branch — vote on what gets manifested into the kit.',
        ]);

        FancySeo::route('leaderboard', [
            'title' => 'Leaderboard — Fancy UI',
            'description' => 'The Fancy UI community leaderboard — XP, achievements, and prizes for building with the kit.',
        ]);

        FancySeo::route('showcase.showcase.index', [
            'title' => 'Showcase — Fancy UI',
            'description' => 'Apps and experiments built with Fancy UI by the community.',
        ]);

        FancySeo::route('shop.index', [
            'title' => 'Shop — Fancy UI',
            'description' => 'Cosmetics and perks for your Fancy UI profile.',
        ]);

        FancySeo::route('packages.show', fn (array $params): array => $this->packageSeo($params['package'] ?? null, $base));
        FancySeo::route('packages.component', fn (array $params): array => $this->componentSeo($params['package'] ?? null, $params['component'] ?? null, $base));
        FancySeo::route('docs.show', fn (array $params): array => $this->docSeo($params['slug'] ?? 'introduction', $base));
    }

    /**
     * Per-doc-page SEO: a unique title + the page's own description from the docs
     * registry, plus Article + BreadcrumbList JSON-LD. Without this every
     * /docs/{slug} page shared one generic title — the highest-volume content on
     * the site, left un-targeted.
     *
     * @return array<string,mixed>
     */
    private function docSeo(mixed $slug, string $base): array
    {
        $slug = is_string($slug) ? $slug : 'introduction';
        $page = DocsRegistry::find($slug);
        if ($page === null) {
            return ['title' => 'Docs — Fancy UI', 'type' => 'article'];
        }
        $title = (string) $page['title'];
        $description = trim((string) ($page['description'] ?? ''));
        $url = $base.'/docs/'.$slug;

        return [
            'title' => "{$title} — Docs — Fancy UI",
            'description' => $description !== '' ? $description : "{$title} — Fancy UI documentation.",
            'type' => 'article',
            'jsonLd' => [
                JsonLd::article("{$title} — Fancy UI", $url, array_filter([
                    'description' => $description ?: null,
                    'image' => $base.'/showcase-assets/fancy-ui-logo.jpg',
                ])),
                JsonLd::breadcrumbList([
                    ['name' => 'Docs', 'url' => $base.'/docs'],
                    ['name' => $title, 'url' => $url],
                ]),
            ],
        ];
    }

    /**
     * Per-style SEO for the Inspiration Gallery: a unique title + the style's
     * own one-line note, plus a BreadcrumbList back to the gallery index.
     *
     * @return array<string,mixed>
     */
    private function inspirationSeo(mixed $id, string $base): array
    {
        $style = is_string($id) ? GalleryRegistry::find($id) : null;
        if ($style === null) {
            return [
                'title' => 'Inspiration Gallery — Fancy UI',
                'description' => 'One creative-studio portfolio, designed twenty ways with the Fancy UI Kit.',
            ];
        }
        $name = (string) $style['name'];
        $note = trim((string) $style['note']);
        $url = $base.'/inspiration/'.$style['id'];

        return [
            'title' => "{$name} — Inspiration Gallery — Fancy UI",
            'description' => trim("FIELDWORK, designed as {$name}. {$note} A self-contained, forkable starting point built on the Fancy UI Kit."),
            'jsonLd' => [
                JsonLd::breadcrumbList([
                    ['name' => 'Inspiration', 'url' => $base.'/inspiration'],
                    ['name' => $name, 'url' => $url],
                ]),
            ],
        ];
    }

    /**
     * @return array<string,mixed>
     */
    private function packageSeo(mixed $slug, string $base): array
    {
        $pkg = is_string($slug) ? PackageRegistry::find($slug) : null;
        if (! $pkg) {
            return ['title' => 'Package — Fancy UI', 'description' => 'A Fancy UI package.'];
        }
        $name = (string) ($pkg['name'] ?? $slug);
        $tagline = trim((string) ($pkg['tagline'] ?? ''));
        $url = $base.'/packages/'.$slug;

        $jsonLd = [
            JsonLd::breadcrumbList([
                ['name' => 'Packages', 'url' => $base.'/packages'],
                ['name' => $name, 'url' => $url],
            ]),
        ];
        if (! empty($pkg['repo'])) {
            $jsonLd[] = JsonLd::softwareSourceCode($name, $url, 'https://github.com/'.$pkg['repo'], array_filter([
                'programmingLanguage' => $pkg['language'] ?? null,
                'description' => $tagline ?: null,
            ]));
        }

        return [
            'title' => "{$name} — Fancy UI",
            'description' => trim("{$tagline} Part of the Fancy UI suite — authorable by humans and agents, bridgeable over MCP."),
            'image' => "/og/packages/{$slug}.png",
            'imageAlt' => "{$name} — Fancy UI",
            'jsonLd' => $jsonLd,
        ];
    }

    /**
     * @return array<string,mixed>
     */
    private function componentSeo(mixed $pkgSlug, mixed $componentSlug, string $base): array
    {
        $pkg = is_string($pkgSlug) ? PackageRegistry::find($pkgSlug) : null;
        $pkgName = (string) ($pkg['name'] ?? $pkgSlug);
        $componentName = is_string($componentSlug) ? $componentSlug : 'component';
        $blurb = '';
        if ($pkg && is_string($componentSlug)) {
            foreach ($pkg['components'] ?? [] as $c) {
                if (($c['slug'] ?? null) === $componentSlug) {
                    $componentName = (string) ($c['name'] ?? $componentName);
                    $blurb = (string) ($c['blurb'] ?? '');
                    break;
                }
            }
        }
        $url = $base.'/packages/'.$pkgSlug.'/'.$componentSlug;

        return [
            'title' => "{$componentName} — {$pkgName} — Fancy UI",
            'description' => trim("{$blurb} A {$pkgName} component for Human+ UX — controlled state, stable handles, agent-bridgeable."),
            'jsonLd' => [
                JsonLd::breadcrumbList([
                    ['name' => 'Packages', 'url' => $base.'/packages'],
                    ['name' => $pkgName, 'url' => $base.'/packages/'.$pkgSlug],
                    ['name' => $componentName, 'url' => $url],
                ]),
            ],
        ];
    }

    /** Dynamic sitemap: top-level pages + every package + every component. */
    private function registerSitemap(): void
    {
        FancySeo::sitemap(function (SitemapBuilder $map): void {
            $map->add('/', '1.0', 'daily')
                ->add('packages', '0.9', 'weekly')
                ->add('docs', '0.8', 'weekly')
                ->add('starter-kits', '0.7', 'weekly')
                ->add('inspiration', '0.7', 'weekly')
                ->add('agent-playground', '0.8', 'weekly')
                ->add('dreaming', '0.6', 'weekly')
                ->add('showcase', '0.6', 'weekly')
                ->add('leaderboard', '0.5', 'daily');

            // Every inspiration-gallery style page.
            foreach (GalleryRegistry::all() as $style) {
                $map->add('inspiration/'.$style['id'], '0.6', 'monthly');
            }

            // Every docs page — the highest-volume indexable content.
            foreach (DocsRegistry::flat() as $doc) {
                $map->add('docs/'.$doc['slug'], '0.7', 'monthly');
            }

            foreach (PackageRegistry::all() as $pkg) {
                $slug = $pkg['slug'] ?? null;
                if (! is_string($slug)) {
                    continue;
                }
                $map->add("packages/{$slug}", '0.8', 'weekly');
                foreach ($pkg['components'] ?? [] as $component) {
                    $cslug = $component['slug'] ?? null;
                    if (is_string($cslug)) {
                        $map->add("packages/{$slug}/{$cslug}", '0.6', 'monthly');
                    }
                }
            }
        });
    }

    /** llmstxt.org index (curated) + full index (every package/component + the Human+ contract). */
    private function registerLlms(string $base): void
    {
        $v = self::VERSION;

        FancySeo::llms(function () use ($base, $v): string {
            $out = [];
            $out[] = '# Fancy UI';
            $out[] = '';
            $out[] = "> A suite of React + Laravel UI primitives engineered for **Human+ UX** — applications where humans and AI agents share the same UI surface and trade control fluidly. Every component is both an *authoring surface* (terse, JSON-friendly props humans and agents compose) and an *inhabited surface* (agents drive it over MCP tool bridges with stable handles — never DOM scraping). Public showcase version {$v}.";
            $out[] = '';
            $out[] = 'Fancy UI ships JS/TS packages on npm and PHP packages on Packagist. The showcase is a Laravel + Inertia + React app that consumes them like any external app would. Agents inhabit running apps through `@particle-academy/agent-integrations` — a per-session MCP server with one bridge per surface (whiteboard, flow, sheets, slides, charts, code, screens, scene).';
            $out[] = '';
            $out[] = '## Packages';
            $out[] = '';
            foreach (PackageRegistry::all() as $pkg) {
                $slug = $pkg['slug'] ?? '';
                $name = $pkg['name'] ?? $slug;
                $tagline = trim((string) ($pkg['tagline'] ?? ''));
                $out[] = "- [{$name}]({$base}/packages/{$slug}): {$tagline}";
            }
            $out[] = '';
            $out[] = '## Companion PHP packages';
            $out[] = '';
            foreach (PackageRegistry::companions() as $pkg) {
                $name = $pkg['name'] ?? ($pkg['slug'] ?? '');
                $tagline = trim((string) ($pkg['tagline'] ?? ''));
                $out[] = "- {$name}: {$tagline}";
            }
            $out[] = '';
            $out[] = '## Key pages';
            $out[] = '';
            $out[] = "- [Packages]({$base}/packages): the full suite index.";
            $out[] = "- [Docs]({$base}/docs): installation, the Human+ UX contract, MCP bridges.";
            $out[] = "- [Agent Playground]({$base}/agent-playground): connect your own agent over MCP and watch it drive the UI live.";
            $out[] = "- [Starter Kits]({$base}/starter-kits): production-ready apps built on the kit.";
            $out[] = '';
            $out[] = '## Optional';
            $out[] = '';
            $out[] = "- [Full index]({$base}/llms-full.txt): every package + component + the Human+ UX contract in one file.";

            return implode("\n", $out)."\n";
        });

        FancySeo::llms(function () use ($base, $v): string {
            $out = [];
            $out[] = '# Fancy UI — full index';
            $out[] = '';
            $out[] = "> Public showcase version {$v}. The complete package + component map plus the Human+ UX contract every component satisfies. Pure public metadata.";
            $out[] = '';
            $out[] = '## The Human+ UX contract';
            $out[] = '';
            $out[] = 'Every stateful or interactive Fancy UI component meets all of:';
            $out[] = '';
            $out[] = '- **Controlled state** — `value` + `onChange`; no internal-only state an agent might need to read or write.';
            $out[] = '- **Stable handles** — each interactive element has a stable identity (`id`, `data-*`, or a selector prop); agents never guess at the DOM.';
            $out[] = '- **JSON-friendly inputs** — agent-emittable props: arrays of objects, primitives, simple discriminated unions.';
            $out[] = '- **Bridgeable surface** — a `register<Surface>Bridge(server, { adapter })` exposes MCP tools (`grid_paint`, `deck_set`, …).';
            $out[] = '- **Observable activity** — mutations broadcast `AgentActivity` events so presence, undo, and coaching layers compose for free.';
            $out[] = '- **Trust-but-verify hooks** — destructive or human-visible actions support a staged-write / pending mode: agents propose, humans confirm.';
            $out[] = '';
            $out[] = '## Packages and components';
            $out[] = '';
            foreach (PackageRegistry::all() as $pkg) {
                $slug = $pkg['slug'] ?? '';
                $name = $pkg['name'] ?? $slug;
                $tagline = trim((string) ($pkg['tagline'] ?? ''));
                $lang = $pkg['language'] ?? '';
                $dist = $pkg['npm'] ?? ($pkg['composer'] ?? '');
                $out[] = "### {$name}";
                $out[] = '';
                $out[] = $tagline;
                $out[] = '';
                if ($dist !== '') {
                    $out[] = "- Install: `{$dist}`".($lang !== '' ? " ({$lang})" : '');
                }
                $out[] = "- Page: {$base}/packages/{$slug}";
                $components = $pkg['components'] ?? [];
                if (! empty($components)) {
                    $names = array_filter(array_map(fn ($c) => (string) ($c['name'] ?? $c['slug'] ?? ''), $components));
                    $out[] = '- Components: '.implode(', ', $names);
                }
                $out[] = '';
            }

            return implode("\n", $out)."\n";
        }, full: true);
    }
}

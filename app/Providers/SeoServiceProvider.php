<?php

namespace App\Providers;

use App\Http\Controllers\Showcase\StarterKitController;
use App\Models\User;
use App\Support\Curriculum\FancyCurriculumContent;
use App\Support\Docs\DocsRegistry;
use App\Support\GalleryRegistry;
use App\Support\PackageFamily;
use App\Support\PackageRegistry;
use App\Support\Seo\KitFacts;
use App\Support\Seo\PageSeo;
use App\Support\UseCases\UseCaseContent;
use App\Support\Usernames;
use FancySeo\Facades\FancySeo;
use FancySeo\JsonLd;
use FancySeo\SitemapBuilder;
use Illuminate\Support\ServiceProvider;
use LaravelCatalog\Models\Product;

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
                    // The kit version from kit.json. This was a typed '0.2' that
                    // nothing updated when the kit cut 0.5.
                    'softwareVersion' => KitFacts::kitVersion(),
                    'description' => self::TAGLINE,
                    'price' => '0',
                ]),
            ],
        ]);
    }

    private function registerRouteResolvers(string $base): void
    {
        // The languages and the count come from the registry. Both were typed,
        // and the preview this renders said "React, PHP, Node" and "every server
        // capability ships for both PHP and Node" while six Python packages were
        // on PyPI and most PHP packages had no Node twin.
        FancySeo::route('home', fn (): array => [
            'title' => 'Fancy UI — build the app, not the plumbing | '.implode(', ', KitFacts::languages()),
            'description' => KitFacts::packageCount().' small, independent packages for '.KitFacts::sentence(KitFacts::languages())
                .': UI primitives, data grids, spreadsheets, workflow engines, xlsx/pptx/docx writers, Stripe catalogs, feature gating. '
                .'Take one or take the stack — many server capabilities ship as matched PHP and Node packages.',
        ]);

        // Every other page names itself through PageSeo, which is also what
        // draws its share card. A page with no resolver unfurls as the whole
        // site: the family pages, the starter kits, the courses and the flow
        // editor all did, with the site's default card, until this listed them.
        foreach (['packages.index', 'agent-playground', 'dreaming.index', 'dreaming.archived', 'leaderboard', 'showcase.showcase.index', 'shop.index', 'flow.index', 'fancy-tui.index', 'pw', 'subscriptions.index', 'products.index'] as $route) {
            FancySeo::route($route, fn (): array => PageSeo::meta('pages', $route));
        }
        FancySeo::route('docs.index', fn (): array => PageSeo::meta('pages', 'docs.index', ['type' => 'article']));
        FancySeo::route('use-cases.index', fn (): array => PageSeo::meta('pages', 'use-cases.index', ['type' => 'website']));
        FancySeo::route('starter-kits.index', fn (): array => PageSeo::meta('starter-kits', 'index'));
        FancySeo::route('inspiration.index', fn (): array => PageSeo::meta('inspiration', 'index'));
        FancySeo::route('learn.index', fn (): array => PageSeo::meta('learn', 'index'));

        // The same storefront answers on two paths, and the CMS demo re-renders
        // the home page. A page that is a copy says which page it copies, so the
        // copy never competes with the original.
        FancySeo::route('catalog-demo.home', fn (): array => PageSeo::meta('pages', 'products.index', ['canonical' => $base.'/products']));
        FancySeo::route('cms.home', fn (): array => PageSeo::meta('pages', 'cms.home', ['canonical' => $base.'/']));

        FancySeo::route('inspiration.collection', fn (array $params): array => $this->inspirationSeo((string) ($params['collection'] ?? ''), null, $base));
        FancySeo::route('inspiration.show', fn (array $params): array => $this->inspirationSeo((string) ($params['collection'] ?? ''), (string) ($params['style'] ?? ''), $base));
        FancySeo::route('packages.show', fn (array $params): array => $this->packageSeo($params['package'] ?? null, $base));
        FancySeo::route('packages.family', fn (array $params): array => $this->familySeo((string) ($params['family'] ?? ''), $base));
        FancySeo::route('packages.component', fn (array $params): array => $this->componentSeo((string) ($params['package'] ?? ''), (string) ($params['component'] ?? ''), $base));
        FancySeo::route('docs.show', fn (array $params): array => $this->docSeo((string) ($params['slug'] ?? 'introduction'), $base));
        FancySeo::route('docs.versioned', fn (array $params): array => $this->archivedDocSeo((string) ($params['version'] ?? ''), (string) ($params['slug'] ?? 'introduction'), $base));
        FancySeo::route('use-cases.show', fn (array $params): array => $this->useCaseSeo((string) ($params['slug'] ?? ''), $base));
        FancySeo::route('starter-kits.show', fn (array $params): array => PageSeo::meta('starter-kits', (string) ($params['slug'] ?? '')));
        FancySeo::route('starter-kits.cms', fn (array $params): array => $this->starterKitCmsSeo((string) ($params['slug'] ?? ''), $base));
        FancySeo::route('learn.course', fn (array $params): array => PageSeo::meta('learn', (string) ($params['slug'] ?? '')));
        FancySeo::route('products.show', fn (array $params): array => $this->productSeo($params['product'] ?? null));
        FancySeo::route('referrals.join', fn (array $params): array => $this->joinSeo($params['username'] ?? null, $base));
    }

    /**
     * Personalized share meta for a member's /join/{username} invite link:
     * inviter-specific title/description, a canonical on the normalized
     * username, and the personalized OG card (og.join). noindex — thousands of
     * near-identical invite pages shouldn't compete in search, and scrapers
     * (LinkedIn/X/Slack) read the OG tags regardless.
     *
     * @return array<string,mixed>
     */
    private function joinSeo(mixed $username, string $base): array
    {
        $username = is_string($username) ? Usernames::normalize($username) : null;
        $referrer = $username === null ? null : User::query()->where('username', $username)->first();
        if ($referrer === null) {
            // The route 302s home for unknown usernames — nothing renders this.
            return ['title' => 'Join Fancy UI', 'noindex' => true];
        }

        // Social scrapers (X/Twitter, Facebook, LinkedIn, Slack, …) drop the
        // preview IMAGE when a page is noindex — but the rich share card is the
        // entire reason this landing page exists. So keep `noindex` for real
        // search engines (thousands of near-duplicate invite URLs shouldn't
        // compete in search) while serving indexable meta to the unfurl bots,
        // whose only job is to build that card. Identical content either way —
        // not cloaking, just letting link previews render. The join route
        // queues a referral cookie on every hit, so the response is never
        // shared-cached, making per-UA head resolution safe (no Vary needed).
        $forCard = $this->isSocialCardScraper(request()->userAgent());

        return [
            'title' => "{$referrer->name} invited you to Fancy UI",
            'description' => "Join {$referrer->name}'s referral network and build with Fancy UI — components for the surfaces where humans and AI agents work together.",
            'canonical' => "{$base}/join/{$referrer->username}",
            'image' => "/og/join/{$referrer->username}.png",
            'imageAlt' => "{$referrer->name} invited you to Fancy UI",
            'noindex' => ! $forCard,
        ];
    }

    /**
     * Whether the request is a social-card / link-unfurl scraper — the bots
     * that fetch a page solely to build a share preview (X/Twitter, Facebook,
     * LinkedIn, Slack, Discord, Telegram, WhatsApp, Pinterest, Reddit, …).
     * Deliberately excludes general search crawlers (Googlebot/Bingbot/Applebot),
     * which must still honor `noindex` on invite pages.
     */
    private function isSocialCardScraper(?string $userAgent): bool
    {
        if ($userAgent === null || $userAgent === '') {
            return false;
        }

        return (bool) preg_match(
            '/twitterbot|facebookexternalhit|facebot|linkedinbot|slackbot|slack-imgproxy|discordbot|telegrambot|whatsapp|pinterest|redditbot|embedly|skypeuripreview|vkshare|tumblr|mastodon|nuzzel|qwantify/i',
            $userAgent,
        );
    }

    /**
     * Per-use-case SEO.
     *
     * `HowTo` rather than `Article` on purpose: these pages ARE numbered
     * step-by-step instructions, which is what the schema describes and what
     * makes them eligible for a how-to rich result. Claiming Article for
     * something built as ordered steps is both less accurate and less useful.
     *
     * @return array<string,mixed>
     */
    private function useCaseSeo(string $slug, string $base): array
    {
        $useCase = UseCaseContent::find($slug);

        if ($useCase === null) {
            return ['title' => 'Use cases — Fancy UI', 'type' => 'article'];
        }

        $title = (string) $useCase['title'];
        $summary = trim((string) ($useCase['summary'] ?? ''));
        $url = $base.'/use-cases/'.$slug;

        $steps = array_map(
            static fn (array $step): array => [
                'name' => (string) $step['title'],
                // The step body is markdown; the schema wants prose, and a
                // crawler reading literal asterisks learns nothing.
                'text' => trim(strip_tags(str_replace(['**', '`'], '', (string) $step['body']))),
                'url' => $url,
            ],
            $useCase['steps'] ?? [],
        );

        return PageSeo::meta('use-cases', $slug, [
            'type' => 'article',
            'jsonLd' => array_values(array_filter([
                $steps === [] ? null : JsonLd::howTo($title, $steps, $summary ?: null),
                JsonLd::breadcrumbList([
                    ['name' => 'Use cases', 'url' => $base.'/use-cases'],
                    ['name' => $title, 'url' => $url],
                ]),
            ])),
        ]);
    }

    /**
     * Per-doc-page SEO: the page's own title, description and card, plus Article
     * + BreadcrumbList JSON-LD. Every docs page had its own title and the SAME
     * card, so a shared docs link showed the site and not the page.
     *
     * @return array<string,mixed>
     */
    private function docSeo(string $slug, string $base): array
    {
        $page = DocsRegistry::find($slug);
        if ($page === null) {
            return ['title' => 'Docs — Fancy UI', 'type' => 'article'];
        }
        $title = (string) $page['title'];
        $description = trim((string) ($page['description'] ?? ''));
        $url = $base.'/docs/'.$slug;

        return PageSeo::meta('docs', $slug, [
            'type' => 'article',
            'jsonLd' => [
                JsonLd::article("{$title} — Fancy UI", $url, array_filter([
                    'description' => $description ?: null,
                    'image' => $base.PageSeo::image('docs', $slug),
                ])),
                JsonLd::breadcrumbList([
                    ['name' => 'Docs', 'url' => $base.'/docs'],
                    ['name' => $title, 'url' => $url],
                ]),
            ],
        ]);
    }

    /**
     * A frozen docs page from an older kit line.
     *
     * Its own title and card say which line it is. The canonical points at the
     * current page of the same name when there is one: the snapshot exists so a
     * reader on that line can look something up, not to compete in search with
     * the page that replaced it.
     *
     * @return array<string,mixed>
     */
    private function archivedDocSeo(string $version, string $slug, string $base): array
    {
        $current = DocsRegistry::find($slug) !== null ? $base.'/docs/'.$slug : null;

        return PageSeo::meta('docs-archive', "{$version}/{$slug}", array_filter([
            'type' => 'article',
            'canonical' => $current,
        ]));
    }

    /**
     * A package family page, which is where most packages live: a member's own
     * URL 301s here. It had no SEO at all and unfurled as the whole site.
     *
     * A member slug also opens the family (`PackageFamily::find()` matches
     * both), so the canonical names the family's own URL.
     *
     * @return array<string,mixed>
     */
    private function familySeo(string $slug, string $base): array
    {
        $family = PackageFamily::find($slug);
        if ($family === null) {
            return [];
        }
        $url = $base.'/packages/family/'.$family['slug'];

        return PageSeo::meta('families', (string) $family['slug'], [
            'canonical' => $url,
            'jsonLd' => [
                JsonLd::breadcrumbList([
                    ['name' => 'Packages', 'url' => $base.'/packages'],
                    ['name' => (string) $family['name'], 'url' => $url],
                ]),
            ],
        ]);
    }

    /**
     * The same starter kit, authored as a CMS document. It is a comparison of
     * the JSX page, so it says so in its title and points at that page.
     *
     * @return array<string,mixed>
     */
    private function starterKitCmsSeo(string $slug, string $base): array
    {
        $seo = PageSeo::meta('starter-kits', $slug);
        if ($seo === []) {
            return [];
        }

        return [
            ...$seo,
            'title' => str_replace(' — Starter kits — ', ' (CMS rendering) — Starter kits — ', (string) $seo['title']),
            'canonical' => $base.'/starter-kits/'.$slug,
        ];
    }

    /**
     * A product on the laravel-catalog demo storefront. Demo data from the
     * database, so its name and description are the page.
     *
     * @return array<string,mixed>
     */
    private function productSeo(mixed $product): array
    {
        $product = $product instanceof Product ? $product : Product::query()->find($product);
        if ($product === null) {
            return [];
        }
        $description = trim((string) $product->description);

        return [
            'title' => "{$product->name} — demo storefront — Fancy UI",
            'description' => $description !== ''
                ? "{$description} A product on the laravel-catalog demo storefront."
                : "{$product->name}, a product on the laravel-catalog demo storefront.",
        ];
    }

    /**
     * An inspiration collection catalog (`$style` null) or one of its styles.
     *
     * @return array<string,mixed>
     */
    private function inspirationSeo(string $collection, ?string $style, string $base): array
    {
        $key = $style === null ? $collection : "{$collection}/{$style}";
        $seo = PageSeo::meta('inspiration', $key);
        if ($seo === [] || $style === null) {
            return $seo === [] ? PageSeo::meta('inspiration', 'index') : $seo;
        }

        $meta = GalleryRegistry::collection($collection);
        $found = GalleryRegistry::find($collection, $style);

        return [
            ...$seo,
            'jsonLd' => [
                JsonLd::breadcrumbList([
                    ['name' => 'Inspiration', 'url' => $base.'/inspiration'],
                    ['name' => (string) $meta['name'], 'url' => $base.'/inspiration/'.$collection],
                    ['name' => (string) $found['name'], 'url' => $base.'/inspiration/'.$collection.'/'.$style],
                ]),
            ],
        ];
    }

    /**
     * Every package page, companions included.
     *
     * This used `PackageRegistry::find()`, which does not see the companion
     * packages, so all of them (holy-sheet, laravel-fms, the Python and Node
     * twins) were titled "Package — Fancy UI" with the description "A Fancy UI
     * package." The page itself resolves them with `findAny()`; so does this.
     *
     * @return array<string,mixed>
     */
    private function packageSeo(mixed $slug, string $base): array
    {
        $pkg = is_string($slug) ? PackageRegistry::findAny($slug) : null;
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

        // Several twins share a display name (`fancy-flow` is the npm package
        // AND the PyPI one), so the title carries the language when the name is
        // not unique to this slug.
        $sharesName = collect(KitFacts::packages())->where('name', $name)->count() > 1;
        $title = $sharesName && ! empty($pkg['language']) ? "{$name} ({$pkg['language']}) — Fancy UI" : "{$name} — Fancy UI";

        return [
            'title' => $title,
            // No blanket "bridgeable over MCP": it was stamped on holy-sheet and
            // laravel-fms, which render nothing and have no surface to bridge.
            'description' => trim("{$tagline} Part of the Fancy UI suite."),
            'image' => "/og/packages/{$slug}.png",
            'imageAlt' => $title,
            'jsonLd' => $jsonLd,
        ];
    }

    /**
     * @return array<string,mixed>
     */
    private function componentSeo(string $pkgSlug, string $componentSlug, string $base): array
    {
        $seo = PageSeo::for('components', "{$pkgSlug}/{$componentSlug}");
        if ($seo === null) {
            return [];
        }
        $pkgName = (string) (PackageRegistry::findAny($pkgSlug)['name'] ?? $pkgSlug);
        $url = $base.'/packages/'.$pkgSlug.'/'.$componentSlug;

        return PageSeo::meta('components', "{$pkgSlug}/{$componentSlug}", [
            'jsonLd' => [
                JsonLd::breadcrumbList([
                    ['name' => 'Packages', 'url' => $base.'/packages'],
                    ['name' => $pkgName, 'url' => $base.'/packages/'.$pkgSlug],
                    ['name' => (string) $seo['card']['title'], 'url' => $url],
                ]),
            ],
        ]);
    }

    /** Dynamic sitemap: top-level pages + every package + every component. */
    private function registerSitemap(): void
    {
        FancySeo::sitemap(function (SitemapBuilder $map): void {
            $map->add('/', '1.0', 'daily')
                ->add('packages', '0.9', 'weekly')
                ->add('docs', '0.8', 'weekly')
                ->add('use-cases', '0.85', 'weekly')
                ->add('starter-kits', '0.7', 'weekly')
                ->add('inspiration', '0.7', 'weekly')
                ->add('agent-playground', '0.8', 'weekly')
                ->add('dreaming', '0.6', 'weekly')
                ->add('showcase', '0.6', 'weekly')
                ->add('leaderboard', '0.5', 'daily')
                ->add('flow', '0.7', 'weekly')
                ->add('fancy-tui', '0.6', 'weekly')
                ->add('learn', '0.7', 'weekly');

            // Pages that existed and were listed nowhere. The family pages matter
            // most: a family member's own URL 301s to its family, so the family
            // page IS where those packages are, and no crawler was told.
            foreach (PackageFamily::all() as $family) {
                $map->add('packages/family/'.$family['slug'], '0.85', 'weekly');
            }
            foreach (StarterKitController::kits() as $kit) {
                $map->add('starter-kits/'.$kit['slug'], '0.6', 'monthly');
            }
            foreach (FancyCurriculumContent::courses() as $course) {
                $map->add('learn/'.$course['slug'], '0.6', 'monthly');
            }
            // A companion outside any family keeps its own page; one inside a
            // family is reached through the family page above.
            foreach (PackageRegistry::companions() as $pkg) {
                if (PackageFamily::find((string) $pkg['slug']) === null) {
                    $map->add('packages/'.$pkg['slug'], '0.6', 'weekly');
                }
            }

            // Every inspiration-gallery collection catalog + style page.
            foreach (GalleryRegistry::collections() as $collection) {
                $map->add('inspiration/'.$collection['id'], '0.65', 'weekly');
                foreach (GalleryRegistry::styles($collection['id']) as $style) {
                    $map->add('inspiration/'.$collection['id'].'/'.$style['id'], '0.6', 'monthly');
                }
            }

            // Every docs page — the highest-volume indexable content.
            foreach (DocsRegistry::flat() as $doc) {
                $map->add('docs/'.$doc['slug'], '0.7', 'monthly');
            }

            // Every use case — the highest-INTENT indexable content, and it was
            // missing from the sitemap entirely.
            foreach (UseCaseContent::all() as $useCase) {
                $map->add('use-cases/'.$useCase['slug'], '0.75', 'monthly');
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
        $v = KitFacts::kitVersion();

        FancySeo::llms(function () use ($base, $v): string {
            $out = [];
            $out[] = '# Fancy UI';
            $out[] = '';
            $out[] = '> An ecosystem of '.KitFacts::packageCount().' small, independent packages from Particle Academy for '.KitFacts::sentence(KitFacts::languages())
                .': UI primitives and surfaces, plus headless engines, document writers, commerce, analytics and tooling. Interactive components are held to **Human+ UX**: humans and AI agents share the same UI surface, and agents drive it over MCP tool bridges with stable handles, never DOM scraping. Kit version '.$v.'.';
            $out[] = '';
            $out[] = 'Fancy UI publishes to '.KitFacts::sentence(KitFacts::registries()).'. The showcase is a Laravel + Inertia + React app that consumes them like any external app would. Agents inhabit running apps through `@particle-academy/agent-integrations`, a per-session MCP server with a bridge for each interactive surface.';
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
            // Not only PHP: the Node and Python twins and the headless tooling
            // are listed here too, and the heading said otherwise.
            $out[] = '## Companion packages (headless and server)';
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
            $out[] = "> Kit version {$v}. The complete package + component map plus the Human+ UX contract that every stateful or interactive component satisfies. Pure public metadata.";
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

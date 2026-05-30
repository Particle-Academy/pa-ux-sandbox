<?php

namespace App\Support;

use Illuminate\Http\Request;

/**
 * Server-rendered SEO metadata resolver.
 *
 * The showcase is an Inertia/React SPA — without this, a crawler / social
 * scraper / LLM bot that hits any URL gets the bare root view (`<title>` only)
 * because all per-page `<Head>` meta is applied client-side after hydration.
 *
 * `Seo::forRequest()` computes per-route `title` / `description` / `canonical`
 * / Open Graph / Twitter / JSON-LD from the matched route + params, and a View
 * Composer shares it to `showcase-app.blade.php` so the FIRST byte of HTML
 * carries real metadata. (On client-side Inertia navigations the SPA's own
 * `<Head>` keeps things current; this is purely the crawler-facing layer.)
 */
class Seo
{
    public const SITE_NAME = 'Fancy UI';

    public const VERSION = '0.2';

    /** Default social share image (square brand mark). */
    private const OG_IMAGE = '/showcase-assets/fancy-ui-logo.jpg';

    private const TAGLINE = 'Components for the surfaces where humans and agents work together.';

    /**
     * Resolve the SEO payload for the current request.
     *
     * @return array{
     *   title:string, description:string, canonical:string, image:string,
     *   type:string, siteName:string, jsonLd:array<int,array<string,mixed>>
     * }
     */
    public static function forRequest(Request $request): array
    {
        $route = $request->route();
        $name = $route?->getName();
        $base = rtrim((string) config('app.url'), '/');
        $canonical = self::canonical($request, $base);

        [$title, $description, $type] = self::resolve($name, $route?->parameters() ?? []);

        return [
            'title' => $title,
            'description' => $description,
            'canonical' => $canonical,
            'image' => $base.self::OG_IMAGE,
            'type' => $type,
            'siteName' => self::SITE_NAME,
            'jsonLd' => self::jsonLd($name, $base, $title, $description),
        ];
    }

    /** Strip query strings from the canonical URL; keep it absolute + clean. */
    private static function canonical(Request $request, string $base): string
    {
        $path = '/'.ltrim($request->path(), '/');
        if ($path === '/') {
            return $base.'/';
        }

        return $base.rtrim($path, '/');
    }

    /**
     * Map a route name (+ params) to [title, description, ogType].
     *
     * @param  array<string,mixed>  $params
     * @return array{0:string,1:string,2:string}
     */
    private static function resolve(?string $name, array $params): array
    {
        $brand = self::SITE_NAME;

        return match ($name) {
            'home' => [
                "{$brand} — Components for Human+ UX",
                self::TAGLINE.' A suite of React + Laravel UI primitives every component of which is both authorable (terse, JSON-friendly) and inhabitable by AI agents over MCP — no DOM scraping.',
                'website',
            ],
            'packages.index' => [
                "Packages — {$brand}",
                "Every package in the {$brand} suite: react-fancy, fancy-3d, fancy-slides, fancy-whiteboard, fancy-flow, fancy-sheets, fancy-echarts, fancy-code, fancy-screens, agent-integrations, and more.",
                'website',
            ],
            'packages.show' => self::packageMeta($params['package'] ?? null),
            'packages.component' => self::componentMeta($params['package'] ?? null, $params['component'] ?? null),
            'docs.index' => [
                "Docs — {$brand}",
                "Documentation for the {$brand} suite — installation, the Human+ UX contract, MCP agent bridges, and per-package guides.",
                'article',
            ],
            'starter-kits.index' => [
                "Starter Kits — {$brand}",
                "Production-ready starter kits built on {$brand} — clone, install, and ship a Human+ UX app in minutes.",
                'website',
            ],
            'agent-playground' => [
                "Agent Playground — {$brand}",
                "A live playground where you connect your own agent over MCP and watch it author {$brand} screens and drive live data — humans and agents sharing one UI surface.",
                'website',
            ],
            'dreaming.index' => [
                "Dreaming — {$brand}",
                "Speculative, in-progress UI primitives on the {$brand} dreaming branch — vote on what gets manifested into the kit.",
                'website',
            ],
            'leaderboard' => [
                "Leaderboard — {$brand}",
                "The {$brand} community leaderboard — XP, achievements, and prizes for building with the kit.",
                'website',
            ],
            'showcase.showcase.index' => [
                "Showcase — {$brand}",
                "Apps and experiments built with {$brand} by the community.",
                'website',
            ],
            'shop.index' => [
                "Shop — {$brand}",
                "Cosmetics and perks for your {$brand} profile.",
                'website',
            ],
            default => [
                "{$brand} — Human+ UX component suite",
                self::TAGLINE,
                'website',
            ],
        };
    }

    /**
     * @return array{0:string,1:string,2:string}
     */
    private static function packageMeta(mixed $slug): array
    {
        $brand = self::SITE_NAME;
        $pkg = is_string($slug) ? PackageRegistry::find($slug) : null;
        if (! $pkg) {
            return ["Package — {$brand}", "A {$brand} package.", 'website'];
        }
        $name = $pkg['name'] ?? $slug;
        $tagline = $pkg['tagline'] ?? '';

        return [
            "{$name} — {$brand}",
            trim("{$tagline} Part of the {$brand} suite — authorable by humans and agents, bridgeable over MCP."),
            'website',
        ];
    }

    /**
     * @return array{0:string,1:string,2:string}
     */
    private static function componentMeta(mixed $pkgSlug, mixed $componentSlug): array
    {
        $brand = self::SITE_NAME;
        $pkg = is_string($pkgSlug) ? PackageRegistry::find($pkgSlug) : null;
        $pkgName = $pkg['name'] ?? $pkgSlug;
        $componentName = is_string($componentSlug) ? $componentSlug : 'component';
        $blurb = '';
        if ($pkg && is_string($componentSlug)) {
            foreach ($pkg['components'] ?? [] as $c) {
                if (($c['slug'] ?? null) === $componentSlug) {
                    $componentName = $c['name'] ?? $componentName;
                    $blurb = $c['blurb'] ?? '';
                    break;
                }
            }
        }

        return [
            "{$componentName} — {$pkgName} — {$brand}",
            trim("{$blurb} A {$pkgName} component for Human+ UX — controlled state, stable handles, agent-bridgeable."),
            'website',
        ];
    }

    /**
     * JSON-LD structured data. Always emits a WebSite + the SoftwareApplication
     * for the suite; package/component pages add a SoftwareSourceCode node.
     *
     * @return array<int,array<string,mixed>>
     */
    private static function jsonLd(?string $name, string $base, string $title, string $description): array
    {
        $website = [
            '@context' => 'https://schema.org',
            '@type' => 'WebSite',
            'name' => self::SITE_NAME,
            'url' => $base.'/',
            'description' => self::TAGLINE,
        ];

        $software = [
            '@context' => 'https://schema.org',
            '@type' => 'SoftwareApplication',
            'name' => self::SITE_NAME,
            'applicationCategory' => 'DeveloperApplication',
            'operatingSystem' => 'Web',
            'softwareVersion' => self::VERSION,
            'url' => $base.'/',
            'description' => self::TAGLINE,
            'offers' => ['@type' => 'Offer', 'price' => '0', 'priceCurrency' => 'USD'],
        ];

        return [$website, $software];
    }
}

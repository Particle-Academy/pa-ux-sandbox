<?php

return [
    /*
    |--------------------------------------------------------------------------
    | Site defaults
    |--------------------------------------------------------------------------
    | Baseline applied to every page. Per-route resolvers + a controller's
    | FancySeo::for([...]) override these. Richer per-route titles/descriptions
    | and all JSON-LD live in App\Providers\SeoServiceProvider.
    */
    'site_name' => 'Fancy UI',
    'url' => env('FANCY_SEO_URL', config('app.url')),
    'title' => null, // home/per-route titles set in SeoServiceProvider
    'description' => 'Components for the surfaces where humans and agents work together.',
    'image' => '/og/default.png', // dynamic branded card (App\Http\Controllers\OgImageController)
    'image_alt' => 'Fancy UI — components for Human+ UX',
    'image_width' => 1200,
    'image_height' => 630,
    'locale' => 'en_US',
    'type' => 'website',
    'twitter_site' => null,
    'theme_color' => '#8b5cf6',

    /*
    |--------------------------------------------------------------------------
    | Indexing
    |--------------------------------------------------------------------------
    | Authenticated/transactional surfaces are forced noindex by route name
    | (belt-and-suspenders alongside the robots.txt disallow block below).
    */
    'robots' => 'index, follow, max-image-preview:large',
    'noindex_robots' => 'noindex, nofollow',
    'noindex_routes' => [
        'admin.*', 'profile', 'profile.*', 'analytics.index',
        'subscriptions.*', 'shop.purchase', 'showcase.showcase.mine',
        'showcase.showcase.create', 'showcase.showcase.installed',
    ],

    /*
    |--------------------------------------------------------------------------
    | Discovery routes (sitemap.xml / robots.txt / llms.txt / …)
    |--------------------------------------------------------------------------
    | The package registers these; their CONTENT comes from the providers wired
    | in SeoServiceProvider (sitemap + llms) and the keys below (robots).
    | `markdown` (per-page .md) is enabled in Phase 3 once the doc hubs land.
    |
    | robots/security/humans/sitemap are now OWNED by particle-academy/fancy-x-files
    | (config/x-files.php) — its leak-proof protect() keeps /admin & friends
    | Disallowed/unlisted for EVERY group, including the welcomed AI bots. They
    | are disabled here to avoid a route collision. The sitemap STAYS DYNAMIC:
    | SeoServiceProvider still registers its URL providers and App\Support\
    | DynamicSitemap renders them (+ the admin's sitemap controls) through
    | x-files. fancy-seo keeps only llms.txt / llms-full.txt.
    */
    'routes' => [
        'enabled' => true,
        'sitemap' => false,  // x-files owns sitemap.xml (DynamicSitemap — dynamic + leak-safe)
        'robots' => false,   // x-files owns robots.txt
        'llms' => true,
        'security' => false,  // x-files owns .well-known/security.txt
        'humans' => false,   // x-files owns humans.txt
        'markdown' => true, // /docs/{slug}.md — clean markdown for LLM fetchers
    ],

    /*
    |--------------------------------------------------------------------------
    | robots.txt / security.txt / humans.txt
    |--------------------------------------------------------------------------
    | Migrated to particle-academy/fancy-x-files — see config/x-files.php for the
    | disallow (now `protect`) + ai_bots + security contact. One source of truth
    | now lives there; the package's leak-proof RobotsTxt::protect() keeps every
    | private path Disallowed for every bot.
    */
];

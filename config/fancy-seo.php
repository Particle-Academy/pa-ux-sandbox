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
    */
    'routes' => [
        'enabled' => true,
        'sitemap' => true,
        'robots' => true,
        'llms' => true,
        'security' => true,
        'humans' => true,
        'markdown' => true, // /docs/{slug}.md — clean markdown for LLM fetchers
    ],

    /*
    |--------------------------------------------------------------------------
    | robots.txt
    |--------------------------------------------------------------------------
    | Private/transactional areas every bot (incl. the welcomed AI crawlers and
    | our own screenshot scraper, App\Support\RobotsTxt) must not crawl, plus the
    | AI/LLM user-agents we explicitly welcome (we WANT to be ingested + cited).
    */
    'robots_txt' => [
        'disallow' => ['/admin', '/auth', '/login', '/logout', '/profile', '/dev-login', '/subscriptions', '/checkout'],
        'ai_bots' => [
            'GPTBot', 'OAI-SearchBot', 'ChatGPT-User', 'ClaudeBot', 'Claude-Web',
            'anthropic-ai', 'PerplexityBot', 'Google-Extended', 'Applebot-Extended',
            'CCBot', 'Bytespider', 'Amazonbot', 'Meta-ExternalAgent', 'cohere-ai',
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | well-known
    |--------------------------------------------------------------------------
    */
    'security_txt' => [
        'contact' => env('FANCY_SEO_SECURITY_CONTACT', 'mailto:glenn@impactivism.net'),
        'languages' => 'en',
    ],
];

<?php

return [
    /*
    |--------------------------------------------------------------------------
    | Server Side Rendering
    |--------------------------------------------------------------------------
    | The Inertia SSR node process (resources/js/ssr.tsx → bootstrap/ssr,
    | started with `php artisan inertia:start-ssr`) renders the page into the
    | first byte. Inertia gracefully (and fast — localhost ECONNREFUSED) falls
    | back to client-side rendering if the SSR server is unreachable or errors on
    | a page, so this is safe to leave on even before the daemon is running.
    |
    | High-value pages (home, /packages, package Show, Component, /docs) render
    | their content server-side; widget-heavy/interactive pages (AgentPlayground,
    | some demos) fall back to client rendering.
    |
    | Verified working locally; default OFF in prod until the SSR daemon is set
    | up on Forge, since it requires two deliberate steps that the standard deploy
    | doesn't do:
    |   1. Build the SSR bundle:  npm run build:ssr   (deploy runs `npm run build`,
    |      which is client-only — keeps the deploy fast + the SSR build out of the
    |      critical path).
    |   2. Run the SSR daemon:    php artisan inertia:start-ssr   (as a Forge daemon)
    | Then flip INERTIA_SSR_ENABLED=true. Inertia falls back to client rendering
    | (fast ECONNREFUSED) if the daemon isn't up, so enabling early is safe too.
    |
    | PORT: this server runs several Inertia sites, so we DON'T use Inertia's
    | default 13714 (they'd collide). The SSR daemon listens on INERTIA_SSR_PORT
    | (default 13731 here) — set the SAME value in resources/js/ssr.tsx (it reads
    | the same env). Give each Inertia site on the box a distinct INERTIA_SSR_PORT.
    */
    'ssr' => [
        'enabled' => env('INERTIA_SSR_ENABLED', false),
        // HARDCODED port 13733 on BOTH sides — here AND resources/js/ssr.tsx — so
        // PHP and the SSR daemon can never drift. Env can't be relied on: the deploy
        // runs `php artisan optimize` (config:cache), so when the daemon's
        // `php artisan inertia:start-ssr` spawns node it doesn't load .env, and an
        // env read would fall back to a different default than PHP's cached config →
        // "can't connect". A literal on both sides guarantees they agree.
        'url' => 'http://127.0.0.1:13733',
        // Explicit bundle path so `inertia:start-ssr` always finds it (the deploy
        // builds it via `npm run build` → `vite build --ssr` → bootstrap/ssr/ssr.js).
        // Without the build step the daemon logs "Inertia SSR bundle not found".
        'bundle' => base_path('bootstrap/ssr/ssr.js'),
    ],

    'testing' => [
        'ensure_pages_exist' => true,
        'page_paths' => [
            resource_path('js/Pages'),
        ],
        'page_extensions' => [
            'tsx',
            'jsx',
            'js',
            'ts',
            'vue',
        ],
    ],
];

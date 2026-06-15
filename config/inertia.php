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
    */
    'ssr' => [
        'enabled' => env('INERTIA_SSR_ENABLED', false),
        'url' => env('INERTIA_SSR_URL', 'http://127.0.0.1:13714'),
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

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
    | some demos) fall back to client rendering. Production needs the SSR bundle
    | (`npm run build` now runs `vite build --ssr`) AND the SSR daemon running on
    | Forge (`php artisan inertia:start-ssr`). Disabled in tests (phpunit.xml).
    */
    'ssr' => [
        'enabled' => env('INERTIA_SSR_ENABLED', true),
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

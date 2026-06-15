<?php

return [
    /*
    |--------------------------------------------------------------------------
    | Server Side Rendering
    |--------------------------------------------------------------------------
    | The Inertia SSR node process (resources/js/ssr.tsx → bootstrap/ssr,
    | started with `php artisan inertia:start-ssr`) renders the page into the
    | first byte. Inertia gracefully falls back to client-side rendering if the
    | SSR server is unreachable or errors on a page.
    |
    | DEFAULT OFF until the browser-only demo widgets (xterm, Babylon, CodeMirror,
    | ECharts, React-Flow, …) are lazy-loaded / FancyClientOnly-wrapped across the
    | Pages graph — otherwise the eager SSR page glob imports those libs and the
    | node process can't boot. The scaffolding (ssr.tsx + vite ssr input + this
    | config) is in place; flip INERTIA_SSR_ENABLED=true once that refactor lands.
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

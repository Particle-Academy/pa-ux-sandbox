<?php

return [
    /*
    | Master switch — when false, PageScreenshotService is a no-op (heatmaps fall
    | back to the wireframe). Lets environments without Chrome opt out cleanly.
    */
    'enabled' => env('SCREENSHOTS_ENABLED', true),

    /*
    | Reference capture viewport. Heat coordinates are viewport-normalized
    | (x/vw, y/vh), so a fixed reference size keeps blobs aligned to the shot.
    | 1440x900 = 16:10, matching the heatmap canvas aspect.
    */
    'width' => (int) env('SCREENSHOTS_WIDTH', 1440),
    'height' => (int) env('SCREENSHOTS_HEIGHT', 900),
    'timeout' => (int) env('SCREENSHOTS_TIMEOUT', 60),

    /*
    | Renderer:
    |   browsershot — local headless Chrome (needs Chromium + its libs on the box)
    |   cloudflare  — Cloudflare Browser Rendering REST API; renders on CF's edge,
    |                 so NO browser/Chromium is needed on this server (just a token).
    | Use `cloudflare` on hosts where you can't install Chrome (locked-down Forge).
    */
    'driver' => env('SCREENSHOTS_DRIVER', 'browsershot'),

    'cloudflare' => [
        // Create an API token with the "Browser Rendering - Edit" permission.
        'account_id' => env('CF_BROWSER_ACCOUNT_ID'),
        'token' => env('CF_BROWSER_TOKEN'),
    ],

    /*
    | Browsershot/Puppeteer plumbing. Leave null to use what's on PATH /
    | Puppeteer's bundled Chromium. On Forge, set the absolute binary paths and
    | enable no_sandbox (Chrome can't sandbox as root).
    */
    'node_binary' => env('SCREENSHOTS_NODE_BINARY'),
    'npm_binary' => env('SCREENSHOTS_NPM_BINARY'),
    'chrome_path' => env('SCREENSHOTS_CHROME_PATH'),
    'no_sandbox' => (bool) env('SCREENSHOTS_NO_SANDBOX', false),
];

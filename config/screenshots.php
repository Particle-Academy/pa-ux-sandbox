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
    | Browsershot/Puppeteer plumbing. Leave null to use what's on PATH /
    | Puppeteer's bundled Chromium. On Forge, set the absolute binary paths and
    | enable no_sandbox (Chrome can't sandbox as root).
    */
    'node_binary' => env('SCREENSHOTS_NODE_BINARY'),
    'npm_binary' => env('SCREENSHOTS_NPM_BINARY'),
    'chrome_path' => env('SCREENSHOTS_CHROME_PATH'),
    'no_sandbox' => (bool) env('SCREENSHOTS_NO_SANDBOX', false),
];

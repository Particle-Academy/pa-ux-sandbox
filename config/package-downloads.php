<?php

/*
|--------------------------------------------------------------------------
| Package download counts
|--------------------------------------------------------------------------
|
| `php artisan packages:fetch-downloads` reads public download counts for
| every published package from npm, Packagist and PyPI (pypistats.org) and
| stores them in `package_downloads`. None of the three needs a key.
|
| Every limit here is a setting with a polite default. Plain values only:
| this file must survive `php artisan config:cache`.
|
*/

return [

    /*
     * When the daily fetch runs (24-hour HH:MM, app timezone). Daily is the
     * finest grain any of the three sources offers, so more often buys nothing.
     */
    'schedule_at' => env('PACKAGE_DOWNLOADS_AT', '04:30'),

    /*
     * Per-request timeout and connect timeout, in seconds.
     */
    'timeout' => (int) env('PACKAGE_DOWNLOADS_TIMEOUT', 15),
    'connect_timeout' => (int) env('PACKAGE_DOWNLOADS_CONNECT_TIMEOUT', 5),

    /*
     * Pause between consecutive requests, in milliseconds. A full run is a few
     * hundred requests; 500 ms keeps it to a handful of minutes and well under
     * any public rate limit (pypistats in particular asks for restraint).
     */
    'delay_ms' => (int) env('PACKAGE_DOWNLOADS_DELAY_MS', 500),

    /*
     * Sent on every request. Generic on purpose: it names the client, never a
     * person, an address or an account.
     */
    'user_agent' => env('PACKAGE_DOWNLOADS_USER_AGENT', 'fancy-ui-showcase-download-counter/1.0'),

    'npm' => [
        /*
         * npm's range endpoint refuses spans over 18 months, so the all-time
         * total is summed over chunks of this many months (capped at 18).
         */
        'chunk_months' => (int) env('PACKAGE_DOWNLOADS_NPM_CHUNK_MONTHS', 18),

        /*
         * The earliest day to walk back to. The walk also stops at the first
         * chunk with no downloads, which for a young package is the second.
         * npm's download data begins on 2015-01-10.
         */
        'history_start' => env('PACKAGE_DOWNLOADS_NPM_HISTORY_START', '2015-01-10'),
    ],

];

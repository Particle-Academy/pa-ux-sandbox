<?php

/*
|--------------------------------------------------------------------------
| MCP usage analytics
|--------------------------------------------------------------------------
|
| Every request to the hosted `fancy-ui` MCP server at /mcp is recorded by
| App\Http\Middleware\RecordMcpUsage and read back by the admin dashboard at
| /admin/mcp. Recording happens AFTER the response has been sent (terminable
| middleware), or on a queue when `queue` is set, so it is never on the
| request's critical path.
|
| Privacy: the raw IP is never stored. Each request carries a SHA-256 of the
| IP salted with a key that changes every day, so a visitor can be counted
| within a day but not followed across days.
|
| Every limit here is a setting with a sensible default. Plain values only:
| this file must survive `php artisan config:cache`.
|
*/

return [

    /*
     * Master switch. Off means the middleware passes every request straight
     * through and records nothing.
     */
    'enabled' => (bool) env('MCP_STATS_ENABLED', true),

    /*
     * Queue connection for the recording job. NULL (the default) records in
     * the same process after the response has been flushed to the client;
     * a connection name pushes the job onto that queue instead.
     */
    'queue' => env('MCP_STATS_QUEUE'),

    /*
     * JSON-RPC notifications (`notifications/initialized`, `notifications/
     * cancelled`, ...) carry no request and get no reply. Off by default so
     * they do not inflate request counts.
     */
    'record_notifications' => (bool) env('MCP_STATS_RECORD_NOTIFICATIONS', false),

    /*
     * Days of raw requests, sessions and daily rollups kept. The scheduled
     * `mcp-stats:prune` deletes anything older.
     */
    'retention_days' => (int) env('MCP_STATS_RETENTION_DAYS', 400),

    /*
     * Rows deleted per statement while pruning, so a large prune never holds
     * one long lock.
     */
    'prune_chunk' => (int) env('MCP_STATS_PRUNE_CHUNK', 5000),

    /*
     * When the prune runs (24-hour HH:MM, app timezone).
     */
    'prune_at' => env('MCP_STATS_PRUNE_AT', '03:40'),

    'arguments' => [
        /*
         * The stored, sanitized arguments are at most this many bytes of
         * JSON. Over budget, long strings are clipped first, then trailing
         * keys are dropped; the stored value is always valid JSON.
         */
        'max_bytes' => (int) env('MCP_STATS_ARGUMENTS_MAX_BYTES', 2048),

        /*
         * Strings longer than this are clipped when the arguments are over
         * budget.
         */
        'max_string' => (int) env('MCP_STATS_ARGUMENTS_MAX_STRING', 200),

        /*
         * Lists longer than this are clipped when the arguments are over
         * budget.
         */
        'max_items' => (int) env('MCP_STATS_ARGUMENTS_MAX_ITEMS', 20),

        /*
         * Nesting deeper than this is replaced by a marker.
         */
        'max_depth' => (int) env('MCP_STATS_ARGUMENTS_MAX_DEPTH', 6),

        /*
         * Any key matching one of these (case-insensitive regex fragments,
         * matched anywhere in the key) is dropped, at every depth, before
         * anything is stored.
         */
        'secret_key_patterns' => [
            'secret',
            'token',
            'passw',
            'api[_-]?key',
            'apikey',
            'access[_-]?key',
            'private[_-]?key',
            'auth',
            'bearer',
            'credential',
            'cookie',
            'session[_-]?key',
            'signature',
            'otp',
        ],
    ],

    /*
     * Request bodies larger than this are not parsed: the request is
     * recorded with method `(oversized)`.
     */
    'max_body_bytes' => (int) env('MCP_STATS_MAX_BODY_BYTES', 262144),

    /*
     * Tool results larger than this are not decoded for a result count.
     */
    'max_result_bytes' => (int) env('MCP_STATS_MAX_RESULT_BYTES', 1048576),

    /*
     * Upper bounds (ms) of the latency histogram buckets the rollups store.
     * One more bucket catches everything above the last bound. Percentiles
     * are interpolated within a bucket, so they are estimates.
     */
    'latency_buckets' => [1, 2, 5, 10, 20, 30, 50, 75, 100, 150, 200, 300, 500, 750, 1000, 1500, 2000, 3000, 5000, 10000, 30000],

    'rollup' => [
        /*
         * How often the rollup runs, as a cron expression. Each run re-rolls
         * today plus `lookback_days` before it, so late-arriving rows land.
         */
        'cron' => env('MCP_STATS_ROLLUP_CRON', '*/10 * * * *'),
        'lookback_days' => (int) env('MCP_STATS_ROLLUP_LOOKBACK_DAYS', 1),

        /*
         * Raw rows read per chunk while rolling up a day.
         */
        'chunk' => (int) env('MCP_STATS_ROLLUP_CHUNK', 2000),

        /*
         * Argument values longer than this are clipped before they are
         * counted, so one long query does not get its own row per variant.
         */
        'max_value_length' => (int) env('MCP_STATS_ROLLUP_MAX_VALUE_LENGTH', 120),
    ],

    /*
     * Tools whose empty result means "an agent wanted something we do not
     * have", with the argument that names what it wanted. Feeds the
     * search-demand report. Names are the tool names the server serves.
     */
    'search_tools' => [
        'search-components' => 'query',
        'search-nodes' => 'query',
        'search-backend-packages' => 'query',
    ],

    /*
     * Tools whose error result means "an agent asked for a slug we do not
     * have", with the argument that names it.
     */
    'lookup_tools' => [
        'get-component' => 'name',
        'install-instructions' => 'name',
        'get-node' => 'kind',
        'node-install-instructions' => 'kind',
    ],

    'dashboard' => [
        /*
         * Default range when none is asked for, and the presets offered.
         */
        'default_days' => (int) env('MCP_STATS_DEFAULT_DAYS', 7),
        'presets' => [7, 30],

        /*
         * The longest custom range accepted, in days.
         */
        'max_range_days' => (int) env('MCP_STATS_MAX_RANGE_DAYS', 400),

        /*
         * Rows in each "top" table.
         */
        'top' => (int) env('MCP_STATS_TOP', 15),

        /*
         * Values listed per argument on a tool's page.
         */
        'top_values' => (int) env('MCP_STATS_TOP_VALUES', 15),

        /*
         * Recent sessions on the overview and a client's page.
         */
        'sessions' => (int) env('MCP_STATS_SESSIONS', 25),

        /*
         * Requests shown in one session's timeline.
         */
        'timeline_limit' => (int) env('MCP_STATS_TIMELINE_LIMIT', 1000),

        /*
         * Rows per page of individual error calls.
         */
        'per_page' => (int) env('MCP_STATS_PER_PAGE', 50),

        /*
         * Rows in the search-demand report.
         */
        'demand' => (int) env('MCP_STATS_DEMAND', 100),
    ],

    'live' => [
        /*
         * How often the Live page polls its feed, in milliseconds.
         */
        'poll_ms' => (int) env('MCP_STATS_LIVE_POLL_MS', 4000),

        /*
         * The most rows one feed response returns and the page keeps. A
         * request may ask for fewer, never more.
         */
        'row_cap' => (int) env('MCP_STATS_LIVE_ROW_CAP', 50),

        /*
         * The window the live counters cover, in minutes.
         */
        'window_minutes' => (int) env('MCP_STATS_LIVE_WINDOW_MINUTES', 15),

        /*
         * The window the map's clustered layer covers, in hours, and the most
         * clusters it returns (busiest first).
         */
        'map_hours' => (int) env('MCP_STATS_LIVE_MAP_HOURS', 24),
        'map_limit' => (int) env('MCP_STATS_LIVE_MAP_LIMIT', 500),

        /*
         * How long a new request's ping pulses on the map, in milliseconds.
         */
        'ping_ms' => (int) env('MCP_STATS_LIVE_PING_MS', 12000),
    ],

    'geo' => [
        /*
         * Read Cloudflare's visitor-location request headers (CF-IPCountry,
         * cf-ipcity, cf-iplatitude, cf-iplongitude) at record time. They
         * exist only when the site is proxied through Cloudflare (orange
         * cloud); CF-IPCountry also needs Network > IP Geolocation on, and
         * the city and coordinates need the Managed Transform "Add visitor
         * location headers".
         *
         * Off-Cloudflare, a client could send these headers itself. Every
         * value is validated (two-letter code, numeric coordinates in range,
         * bounded city), so the worst a forger gets is a wrong point on an
         * admin-only map. Turn this off if the origin is reachable directly.
         */
        'cloudflare_headers' => (bool) env('MCP_STATS_CLOUDFLARE_GEO', true),
    ],

    /*
     * User-agent families, checked in order: the first whose pattern
     * (case-insensitive regex) matches names the family. Anything else is
     * reported by its first product token, or `other`.
     */
    'user_agent_families' => [
        'claude-code' => 'claude-code|claude-cli',
        'claude' => 'claude|anthropic',
        'cursor' => 'cursor',
        'codex' => 'codex',
        'vscode' => 'vscode|visual studio code',
        'windsurf' => 'windsurf|codeium',
        'openai' => 'openai',
        'mcp-remote' => 'mcp-remote',
        'node' => '^node|undici|node-fetch|axios',
        'python' => 'python|httpx|aiohttp|requests',
        'go' => 'go-http-client',
        'curl' => '^curl',
        'browser' => 'mozilla',
    ],

];

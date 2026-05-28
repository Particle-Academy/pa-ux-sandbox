<?php

declare(strict_types=1);

/**
 * Laravel Fun Lab Configuration
 *
 * Publish with: php artisan vendor:publish --tag=lfl-config
 */

return [

    /*
    |--------------------------------------------------------------------------
    | Table Prefix
    |--------------------------------------------------------------------------
    */

    'table_prefix' => env('LFL_TABLE_PREFIX', 'lfl_'),

    /*
    |--------------------------------------------------------------------------
    | Migrations
    |--------------------------------------------------------------------------
    */

    'migrations' => true,

    /*
    |--------------------------------------------------------------------------
    | API Configuration
    |--------------------------------------------------------------------------
    |
    | `auth.middleware` is the consumer's contract — LFL ships no auth
    | implementation. Point this at any Laravel middleware that resolves
    | `auth()->user()` to an Awardable model (e.g. `auth:sanctum`, `auth:api`).
    |
    | `writes` gates every POST endpoint (awards, grants, opt-in/out, setup).
    | Defaults to FALSE to prevent accidental public mutation. The service
    | provider additionally refuses to register write routes when writes=true
    | and auth.middleware is null — a misconfiguration that would leave every
    | write endpoint publicly callable.
    |
    | `allow_setup_over_http` gates only the catalog-mutating POSTs
    | (/gamed-metrics, /achievements, /prizes, /metric-levels). These wrap
    | LFL::setup() which is upsert-by-slug, so exposing them over HTTP is a
    | higher-privilege act than awarding XP. Default FALSE.
    */

    'api' => [
        'enabled' => true,
        'writes' => env('LFL_API_WRITES', false),
        'allow_setup_over_http' => env('LFL_API_ALLOW_SETUP_OVER_HTTP', false),
        'prefix' => 'api/lfl',
        'middleware' => ['api'],
        'auth' => [
            'guard' => env('LFL_API_GUARD', 'sanctum'),
            'middleware' => env('LFL_API_AUTH_MIDDLEWARE', null),
        ],
        'rate_limit' => [
            // Per-user/IP per-minute cap for write endpoints.
            'writes_per_minute' => (int) env('LFL_API_WRITES_PER_MINUTE', 60),
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | Awardable Allowlist
    |--------------------------------------------------------------------------
    |
    | Fully qualified class names of models that LFL is permitted to treat as
    | awardables via the HTTP API. Write controllers reject any awardable_type
    | not in this list BEFORE calling class_exists() — preventing attacker-
    | controlled class autoloading and narrowing the API surface.
    |
    | Empty array (default) means NO type is accepted over HTTP; the consumer
    | must opt in explicitly. Example:
    |
    |     'awardables' => [
    |         \App\Models\User::class,
    |         \App\Models\Team::class,
    |     ],
    */

    'awardables' => [],

    /*
    |--------------------------------------------------------------------------
    | Authorization Hooks
    |--------------------------------------------------------------------------
    |
    | Callables invoked before every write operation. Each receives the
    | authenticated user and a context array; return truthy to allow, falsy
    | to deny (→ 403 response). Null means DENY — LFL will not guess what the
    | consumer's policy is.
    |
    | Signatures:
    |   award: fn (?Model $user, array $ctx) — $ctx: ['recipient' => Model, 'metric_slug' => string, 'amount' => int]
    |   grant: fn (?Model $user, array $ctx) — $ctx: ['recipient' => Model, 'slug' => string]
    |   opt:   fn (?Model $user, array $ctx) — $ctx: ['target' => Model, 'direction' => 'in'|'out']
    |   setup: fn (?Model $user, array $ctx) — $ctx: ['entity_type' => string, 'slug' => string|null]
    |
    | You may alternatively configure a FQCN pointing at a class with a
    | `authorize(?Model $user, array $ctx): bool` method.
    |
    | When `allow_missing` is true, a null callable is treated as "allow any
    | authenticated user". This is a dev-mode escape hatch; leave false in
    | production.
    */

    'authorize' => [
        'allow_missing' => env('LFL_AUTHORIZE_ALLOW_MISSING', false),
        'award' => null,
        'grant' => null,
        'opt' => null,
        'setup' => null,
    ],

    /*
    |--------------------------------------------------------------------------
    | UI Configuration
    |--------------------------------------------------------------------------
    */

    'ui' => [
        'enabled' => false,
        'prefix' => 'lfl',
        'middleware' => ['web'],
    ],

    /*
    |--------------------------------------------------------------------------
    | Feature Flags
    |--------------------------------------------------------------------------
    */

    'features' => [
        'achievements' => true,
        'leaderboards' => true,
        'prizes' => true,
        'profiles' => true,
        'analytics' => true,
    ],

    /*
    |--------------------------------------------------------------------------
    | Default Point Values
    |--------------------------------------------------------------------------
    |
    | `max_points_per_action` is enforced by AwardXpBuilder::save() — a single
    | call can award at most this many XP. Set to 0 to disable the cap.
    */

    'defaults' => [
        'points' => 10,
        'multipliers' => [
            'streak_bonus' => 1.5,
            'first_time_bonus' => 2.0,
        ],
        'max_points_per_action' => (int) env('LFL_MAX_POINTS_PER_ACTION', 10000),
    ],

    /*
    |--------------------------------------------------------------------------
    | Default Award Types
    |--------------------------------------------------------------------------
    */

    'award_types' => [
        'points' => ['name' => 'Points', 'icon' => 'star', 'cumulative' => true, 'default_amount' => 10],
        'badge' => ['name' => 'Badge', 'icon' => 'badge', 'cumulative' => false, 'default_amount' => 1],
        'achievement' => ['name' => 'Achievement', 'icon' => 'trophy', 'cumulative' => false, 'default_amount' => 1],
    ],

    /*
    |--------------------------------------------------------------------------
    | Event Configuration
    |--------------------------------------------------------------------------
    */

    'events' => [
        'dispatch' => true,
        'log_to_database' => true,
        'broadcast' => env('LFL_EVENTS_BROADCAST', false),
        'queue' => null,
    ],

    /*
    |--------------------------------------------------------------------------
    | Service Bindings
    |--------------------------------------------------------------------------
    */

    'services' => [
        'award_engine' => \LaravelFunLab\Services\AwardEngine::class,
        'leaderboard' => \LaravelFunLab\Builders\LeaderboardBuilder::class,
        'analytics' => \LaravelFunLab\Builders\AnalyticsBuilder::class,
    ],

];

<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Cross-Origin Resource Sharing (CORS) Configuration
    |--------------------------------------------------------------------------
    |
    | Laravel's HandleCors middleware answers preflight (OPTIONS) requests and
    | adds the Access-Control-* headers for the paths listed below.
    |
    | Scope is deliberately narrow: the Fancy Heuristics ingestion endpoints
    | (`heuristics/collect` + `heuristics/pixel`) are hit by browsers on OTHER
    | origins — every site that embeds the Fancy Pixel beacons back here — so
    | they MUST answer cross-origin preflight.
    |
    | CREDENTIALS: the collector beacons via navigator.sendBeacon, which ALWAYS
    | sends in credentials mode "include" (you can't opt a beacon out of cookies).
    | The CORS spec forbids a wildcard `Access-Control-Allow-Origin: *` for a
    | credentialed request — the server must echo the *specific* origin and set
    | `Access-Control-Allow-Credentials: true`. So `supports_credentials` is TRUE
    | here: with `allowed_origins: ['*']` php-cors then REFLECTS the request
    | Origin (not a literal `*`) + adds the credentials header + `Vary: Origin`.
    | These endpoints are anonymous, write-only telemetry that return no
    | sensitive body and use no session, so reflecting any origin is safe.
    |
    | NB: the /gallery/* and /r/* (registry) JSON endpoints set their own
    | `Access-Control-Allow-Origin: *` header in-controller — they are NOT
    | listed here, so HandleCors never doubles the header on them (two
    | Allow-Origin values would make browsers reject the response).
    |
    */

    'paths' => [
        'heuristics/collect',
        'heuristics/pixel',
    ],

    'allowed_methods' => ['POST', 'OPTIONS'],

    'allowed_origins' => ['*'],

    'allowed_origins_patterns' => [],

    'allowed_headers' => ['*'],

    'exposed_headers' => [],

    'max_age' => 86400,

    // Required because sendBeacon requests are credentialed; with allowed_origins
    // ['*'] php-cors reflects the request Origin (never a literal '*') so the
    // credentialed preflight passes.
    'supports_credentials' => true,

];

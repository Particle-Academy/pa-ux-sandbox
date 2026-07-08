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
    | they MUST answer cross-origin preflight. Without this, external embeds
    | (e.g. tynn.ai) get "No 'Access-Control-Allow-Origin' header" and the
    | collector retry-spams the console.
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

    // Ingestion is anonymous, write-only telemetry with no cookies/credentials,
    // so a wildcard origin is correct here (and required for arbitrary embeds).
    'allowed_origins' => ['*'],

    'allowed_origins_patterns' => [],

    'allowed_headers' => ['*'],

    'exposed_headers' => [],

    'max_age' => 86400,

    // Must stay false with a wildcard origin (the two are mutually exclusive
    // per the CORS spec); the beacons carry no credentials anyway.
    'supports_credentials' => false,

];

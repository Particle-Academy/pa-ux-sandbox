<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Third Party Services
    |--------------------------------------------------------------------------
    |
    | This file is for storing the credentials for third party services such
    | as Mailgun, Postmark, AWS and more. This file provides the de facto
    | location for this type of information, allowing packages to have
    | a conventional file to locate the various service credentials.
    |
    */

    'postmark' => [
        'key' => env('POSTMARK_API_KEY'),
    ],

    'resend' => [
        'key' => env('RESEND_API_KEY'),
    ],

    'ses' => [
        'key' => env('AWS_ACCESS_KEY_ID'),
        'secret' => env('AWS_SECRET_ACCESS_KEY'),
        'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
    ],

    'slack' => [
        'notifications' => [
            'bot_user_oauth_token' => env('SLACK_BOT_USER_OAUTH_TOKEN'),
            'channel' => env('SLACK_BOT_USER_DEFAULT_CHANNEL'),
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | Stripe Configuration
    |--------------------------------------------------------------------------
    |
    | Laravel Cashier uses these Stripe keys for payment processing.
    | Get your keys from: https://dashboard.stripe.com/apikeys
    |
    | For testing, use your test mode keys (starts with sk_test_ and pk_test_)
    | For production, use your live mode keys (starts with sk_live_ and pk_live_)
    |
    */

    'stripe' => [
        'key' => env('STRIPE_KEY'),
        'secret' => env('STRIPE_SECRET'),
    ],

    'github' => [
        'client_id' => env('GITHUB_CLIENT_ID'),
        'client_secret' => env('GITHUB_CLIENT_SECRET'),
        'redirect' => env('GITHUB_REDIRECT_URI', env('APP_URL').'/auth/github/callback'),
        'api_token' => env('GITHUB_API_TOKEN'),

        // Webhook receiver (bug-hunter-xp). Set the same secret on the
        // org/repo webhook in GitHub. The org whose issues count, and the
        // labels that mark a bug as confirmed.
        'webhook_secret' => env('GITHUB_WEBHOOK_SECRET'),
        'org' => env('GITHUB_ORG', 'Particle-Academy'),
        'bug_labels' => ['bug', 'confirmed', 'confirmed-bug'],
    ],

    // The docs TUI render service — a localhost Node process (`npm run
    // tui-service`) that renders the real fancy-tui Ink app and browses the
    // real MCP. Unset in environments without it; the page degrades to HTML.
    'tui' => [
        'url' => env('TUI_SERVICE_URL'),
        'timeout' => env('TUI_SERVICE_TIMEOUT', 5),
        // Just above the service's ~2s long-poll hold, so a normal quiet return
        // is never read as a dead service.
        'stream_timeout' => env('TUI_SERVICE_STREAM_TIMEOUT', 8),
    ],

];

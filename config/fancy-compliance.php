<?php

declare(strict_types=1);

return [

    /*
    | The version of the policy a person is consenting to. Change it when what
    | you collect or why changes: every earlier decision stops being current,
    | the banner shows again, and only the required categories are allowed
    | until the person decides under the new version. Earlier rows stay in the
    | ledger as evidence of what was agreed at the time.
    */
    'policy_version' => env('FANCY_COMPLIANCE_POLICY_VERSION', '1'),

    /*
    | Your categories. Keys are short lowercase identifiers (at most 32 of
    | them). `label`, `description` and each purpose are translation keys:
    | the server resolves them for the current locale when your lang files
    | (or this package's, for the defaults below) have them, and the UI falls
    | back to its own messages when they do not.
    |
    | `necessary` is always present and can never be refused, whatever you
    | write here. Keep it to what the site cannot work without, including the
    | consent cookie itself.
    */
    'categories' => [
        'necessary' => [
            'label' => 'fancy-compliance::categories.necessary.label',
            'description' => 'fancy-compliance::categories.necessary.description',
            'purposes' => [
                'fancy-compliance::categories.necessary.purposes.session',
                'fancy-compliance::categories.necessary.purposes.security',
                'fancy-compliance::categories.necessary.purposes.consent',
            ],
        ],
        'analytics' => [
            'label' => 'fancy-compliance::categories.analytics.label',
            'description' => 'fancy-compliance::categories.analytics.description',
            'purposes' => [
                'fancy-compliance::categories.analytics.purposes.usage',
            ],
        ],
        // No `marketing`: the showcase runs no advertising. `analytics` covers
        // its own Fancy Pixel + fancy-heuristics collection and the in-page
        // agent-activity sink, each gated on it twice: in the browser
        // (resources/js/components/ShowcaseAnalytics.tsx) and on the server
        // (App\Http\Middleware\GateSelfAnalytics).
    ],

    /*
    | The guest cookie: a random token, set only once a guest has decided, so
    | the decision can be honoured on the next visit. It is strictly necessary
    | for that reason and needs no consent of its own. HttpOnly always.
    | `secure` null follows the request (HTTPS sets it).
    */
    'cookie' => [
        'name' => 'fancy_compliance_subject',
        'lifetime_days' => 365,
        'path' => '/',
        'domain' => null,
        'secure' => null,
        'same_site' => 'lax',
    ],

    // The guard whose user is the subject when someone is signed in. Null is the default guard.
    'guard' => null,

    /*
    | The record and withdraw routes. They are POSTs and sit in your `web`
    | group so your CSRF protection applies. RATE LIMITING IS YOURS: add
    | `throttle:...` here, sized for your traffic.
    */
    'routes' => [
        'enabled' => true,
        'prefix' => 'fancy-compliance',
        // 30 decisions a minute per client: a person makes a handful, so more
        // is a script appending to a ledger that never deletes.
        'middleware' => ['web', 'throttle:30,1'],
    ],

    'inertia' => [
        'share' => true,
        'key' => 'fancyCompliance',
    ],

    /*
    | Ledger retention. Null keeps every row, which is the default because a
    | consent record is the evidence that you had consent: delete it and you
    | can no longer show what someone agreed to, or when. If your counsel sets
    | a period, put it here in days and schedule `fancy-compliance:prune`.
    | Pruning never removes a subject's latest row, which is their current
    | state.
    */
    'retention' => [
        'days' => null,
    ],

    'table' => 'fancy_compliance_consents',
];

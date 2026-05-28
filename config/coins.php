<?php

/**
 * Coin economy configuration.
 *
 * Coins are earned passively as a byproduct of XP gains and lump-summed
 * on achievement / level milestones. Spending happens through the shop
 * (see app/Services/Shop).
 *
 * Earn rates are intentionally fractional so we can tune the
 * coins-per-XP signal without restructuring the XP scale.
 * Coins are always rounded DOWN (floor) so a fractional sliver never
 * inflates balances.
 */
return [
    'earn' => [
        // Per-metric coin yield as a multiplier on the awarded XP amount.
        // Off-site / creator metrics yield more coins per XP than passive
        // browsing — same shape as the composite engagement weights but
        // not identical (coin yield favors broad participation, weights
        // favor signal strength).
        'per_xp' => [
            'promotion-xp'   => 0.50,
            'contributor-xp' => 0.40,
            'bug-hunter-xp'  => 0.35,
            'projects-xp'    => 0.30,
            'bridge-xp'      => 0.25,
            'tinkerer-xp'    => 0.15,
            'dreamer-xp'     => 0.12,
            'explorer-xp'    => 0.05,
            'reader-xp'      => 0.05,
        ],

        // Default per-XP yield for any metric not listed above. Lets
        // future metrics work without a config change.
        'default_per_xp' => 0.05,

        // Lump-sum bonus when a user unlocks an achievement. Keyed by
        // achievement slug; falls back to `default_achievement` for any
        // achievement not listed.
        'achievement' => [
            'badge-bearer' => 250,
            'brand-ambassador' => 1000,
            'first-pr' => 100,
            'maintainer' => 500,
            'library-builder' => 500,
            'exterminator' => 500,
            'project-veteran' => 250,
        ],
        'default_achievement' => 50,

        // Lump-sum bonus on prize grants. Same key/fallback shape as
        // achievements.
        'prize' => [
            'sandbox-pro' => 0, // no double-dip — prize already grants pro features
            'early-tester-badge' => 100,
        ],
        'default_prize' => 0,
    ],
];

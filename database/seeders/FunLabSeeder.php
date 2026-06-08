<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use LaravelFunLab\Facades\LFL;

/**
 * Seeds the Fancy UI showcase's gamification taxonomy.
 *
 * Nine XP buckets split into two tiers of engagement:
 *
 *   on-site (visitor activity, mostly automated triggers)
 *     - explorer-xp   : browsing packages / components
 *     - tinkerer-xp   : actually using interactive demos
 *     - bridge-xp     : invoking MCP bridge tools from chat
 *     - reader-xp     : viewing docs / source
 *     - dreamer-xp    : engaging with dreaming branch (votes, theme filter)
 *
 *   off-site (creator / promoter activity, admin-mediated or crawler-verified)
 *     - bug-hunter-xp : filing or triaging bugs against particle-academy repos
 *     - contributor-xp: submitting new components for inclusion
 *     - projects-xp   : registering public projects built with Fancy UI
 *     - promotion-xp  : displaying a "Powered by Fancy" badge on a public URL
 *
 * They roll up via the `overall-engagement` group with weights tuned so
 * creator/promoter signal (1.5–2.0x) outranks on-site activity (0.5–1.5x).
 * That group's levels drive the chrome chip and the prize-unlock
 * milestone for feature gating (see laravel-fms pre-strategy in v0.6.0+).
 *
 * Idempotent — LFL::setup() upserts on slug, so this is safe to re-run.
 */
class FunLabSeeder extends Seeder
{
    public function run(): void
    {
        // Null-safe so this idempotent taxonomy can also be invoked from a data
        // migration (where there's no console command context) — see
        // database/migrations/*_seed_funlab_taxonomy.php. Feature content
        // (achievements + awards/prizes + metrics/levels) must deploy via
        // `migrate`, which Forge runs; `db:seed` does not run on deploy.
        $this->command?->info('Seeding Laravel Fun Lab taxonomy...');

        $this->seedGamedMetrics();
        $this->seedMetricLevels();
        $this->seedOverallGroup();
        $this->seedAchievements();
        $this->seedPrizes();

        $this->command?->info('  ✓ Fun Lab taxonomy seeded');
    }

    protected function seedGamedMetrics(): void
    {
        $metrics = [
            // on-site engagement
            ['slug' => 'explorer-xp', 'name' => 'Explorer XP', 'description' => 'Earned by browsing packages and component pages.', 'icon' => 'compass'],
            ['slug' => 'tinkerer-xp', 'name' => 'Tinkerer XP', 'description' => 'Earned by actually using interactive demos.', 'icon' => 'wrench'],
            ['slug' => 'bridge-xp', 'name' => 'Bridge XP', 'description' => 'Earned by invoking MCP bridge tools from an agent surface.', 'icon' => 'plug'],
            ['slug' => 'reader-xp', 'name' => 'Reader XP', 'description' => 'Earned by viewing docs and source files.', 'icon' => 'book-open'],
            ['slug' => 'dreamer-xp', 'name' => 'Dreamer XP', 'description' => 'Earned by exploring the dreaming branch and voting on speculative components.', 'icon' => 'sparkles'],

            // off-site / creator engagement
            ['slug' => 'bug-hunter-xp', 'name' => 'Bug Hunter XP', 'description' => 'Earned by filing or triaging confirmed bugs on particle-academy repos.', 'icon' => 'bug'],
            ['slug' => 'contributor-xp', 'name' => 'Contributor XP', 'description' => 'Earned by submitting new components that get accepted into the library.', 'icon' => 'git-merge'],
            ['slug' => 'projects-xp', 'name' => 'Projects XP', 'description' => 'Earned by registering public projects built with Fancy UI.', 'icon' => 'rocket'],
            ['slug' => 'promotion-xp', 'name' => 'Promotion XP', 'description' => 'Earned when a "Powered by Fancy" badge is detected on your public URLs.', 'icon' => 'megaphone'],
        ];

        foreach ($metrics as $m) {
            LFL::setup(a: 'gamed-metric', with: array_merge($m, ['active' => true]));
        }
    }

    protected function seedMetricLevels(): void
    {
        // Each metric uses the same threshold curve. Tuned so reaching
        // level 5 takes a few sessions of genuine engagement, not just
        // a passive browse-through.
        $tiers = [
            ['level' => 1, 'xp' => 0,    'name' => 'Newcomer'],
            ['level' => 2, 'xp' => 50,   'name' => 'Curious'],
            ['level' => 3, 'xp' => 200,  'name' => 'Engaged'],
            ['level' => 4, 'xp' => 500,  'name' => 'Devoted'],
            ['level' => 5, 'xp' => 1000, 'name' => 'Master'],
        ];

        $allMetrics = [
            'explorer-xp', 'tinkerer-xp', 'bridge-xp', 'reader-xp', 'dreamer-xp',
            'bug-hunter-xp', 'contributor-xp', 'projects-xp', 'promotion-xp',
        ];
        foreach ($allMetrics as $metric) {
            foreach ($tiers as $tier) {
                LFL::setup(a: 'metric-level', with: array_merge($tier, ['metric' => $metric]));
            }
        }
    }

    protected function seedOverallGroup(): void
    {
        LFL::setup(a: 'metric-level-group', with: [
            'slug' => 'overall-engagement',
            'name' => 'Overall Engagement',
            'description' => 'Composite engagement score across every surface — drives the chrome chip and the prize-unlock milestone.',
        ]);

        // Weights tune the "what we care about" signal:
        //   creating/promoting > composing > tinkering > exploring > reading
        // Off-site engagement (creator/promoter signals) outweighs on-site
        // activity because those are the actions that grow the ecosystem.
        // Promotion sits at the top — every detected badge is free
        // distribution for us.
        $weights = [
            // off-site (1.5–2.0)
            'promotion-xp' => 2.0,
            'contributor-xp' => 1.8,
            'bug-hunter-xp' => 1.7,
            'projects-xp' => 1.5,
            // on-site (0.5–1.5)
            'bridge-xp' => 1.5,
            'tinkerer-xp' => 1.2,
            'dreamer-xp' => 1.0,
            'explorer-xp' => 0.6,
            'reader-xp' => 0.5,
        ];

        foreach ($weights as $metric => $weight) {
            LFL::setup(a: 'metric-level-group-metric', with: [
                'group' => 'overall-engagement',
                'metric' => $metric,
                'weight' => $weight,
            ]);
        }

        // Group levels — higher thresholds because this is the composite.
        // Reaching level 10 is the unlock milestone for the "Sandbox Pro"
        // prize (see seedPrizes()), which the FMS pre-strategy will treat
        // as equivalent to a paid subscription.
        $groupTiers = [
            ['level' => 1,  'xp' => 0,     'name' => 'Visitor'],
            ['level' => 3,  'xp' => 250,   'name' => 'Regular'],
            ['level' => 5,  'xp' => 1000,  'name' => 'Enthusiast'],
            ['level' => 7,  'xp' => 2500,  'name' => 'Power User'],
            ['level' => 10, 'xp' => 6000,  'name' => 'Ambassador'],
        ];

        foreach ($groupTiers as $tier) {
            LFL::setup(a: 'metric-level-group-level', with: array_merge($tier, [
                'group' => 'overall-engagement',
            ]));
        }
    }

    protected function seedAchievements(): void
    {
        $achievements = [
            ['slug' => 'first-visit', 'name' => 'First Steps', 'description' => 'Visited the sandbox.', 'icon' => 'footprints'],
            ['slug' => 'component-collector', 'name' => 'Component Collector', 'description' => 'Viewed every shipped component at least once.', 'icon' => 'grid'],
            ['slug' => 'bridge-initiate', 'name' => 'Bridge Initiate', 'description' => 'Invoked an MCP bridge tool for the first time.', 'icon' => 'plug'],
            ['slug' => 'agent-whisperer', 'name' => 'Agent Whisperer', 'description' => 'Invoked 50+ MCP bridge tools.', 'icon' => 'sparkles'],
            ['slug' => 'sheet-architect', 'name' => 'Sheet Architect', 'description' => 'Edited a workbook in the fancy-sheets demo.', 'icon' => 'table'],
            ['slug' => 'slide-director', 'name' => 'Slide Director', 'description' => 'Authored a deck via the slides bridge.', 'icon' => 'projector'],
            ['slug' => 'source-diver', 'name' => 'Source Diver', 'description' => 'Opened the source viewer on 10+ components.', 'icon' => 'file-search'],
            ['slug' => 'theme-explorer', 'name' => 'Theme Explorer', 'description' => 'Switched every theme filter on the dreaming gallery.', 'icon' => 'palette'],
            ['slug' => 'critic', 'name' => 'Critic', 'description' => 'Voted on at least 5 dreaming components.', 'icon' => 'thumbs-up'],
            ['slug' => 'first-pr', 'name' => 'First PR', 'description' => 'Opened your first pull request on a particle-academy repo.', 'icon' => 'git-pull-request'],
            ['slug' => 'maintainer', 'name' => 'Maintainer', 'description' => 'Merged 25+ PRs across the Fancy UI suite.', 'icon' => 'shield-check'],

            // off-site engagement
            ['slug' => 'first-bug', 'name' => 'First Bug', 'description' => 'Filed your first confirmed bug.', 'icon' => 'bug'],
            ['slug' => 'bug-slayer', 'name' => 'Bug Slayer', 'description' => 'Filed 10+ confirmed bugs.', 'icon' => 'bug-off'],
            ['slug' => 'exterminator', 'name' => 'Exterminator', 'description' => 'Filed 25+ confirmed bugs.', 'icon' => 'shield-alert'],
            ['slug' => 'first-contribution', 'name' => 'First Contribution', 'description' => 'Submitted a new component that was accepted.', 'icon' => 'git-commit'],
            ['slug' => 'component-author', 'name' => 'Component Author', 'description' => 'Authored 3+ accepted components.', 'icon' => 'pen-tool'],
            ['slug' => 'library-builder', 'name' => 'Library Builder', 'description' => 'Authored 10+ accepted components.', 'icon' => 'library'],
            ['slug' => 'first-project', 'name' => 'First Project', 'description' => 'Registered your first public project built with Fancy UI.', 'icon' => 'rocket'],
            ['slug' => 'project-veteran', 'name' => 'Project Veteran', 'description' => 'Registered 5+ public projects built with Fancy UI.', 'icon' => 'medal'],
            ['slug' => 'badge-bearer', 'name' => 'Badge Bearer', 'description' => 'Verified "Powered by Fancy" badge spotted on your project.', 'icon' => 'badge-check'],
            ['slug' => 'brand-ambassador', 'name' => 'Brand Ambassador', 'description' => '5+ active projects displaying the Fancy badge.', 'icon' => 'megaphone'],

            // ── Hidden Easter eggs (the FlowRunnerUx "deep system" story) ──
            // Secret until earned — these never appear in the catalog until unlocked.
            ['slug' => 'the-adventurer', 'name' => 'The Adventurer', 'description' => 'Found the one true path through Pip\'s descent into the deep system.', 'icon' => 'compass', 'hidden' => true],
            ['slug' => 'ultimate-adventurer', 'name' => 'Ultimate Adventurer', 'description' => 'Uncovered every ending of the deep system — triumph and every disaster alike.', 'icon' => 'trophy', 'hidden' => true],
        ];

        foreach ($achievements as $a) {
            LFL::setup(a: 'achievement', with: array_merge($a, ['active' => true]));
        }
    }

    protected function seedPrizes(): void
    {
        // The big one: granting "Sandbox Pro" makes the FMS pre-strategy
        // treat the user as a paid subscriber. Earned by reaching
        // overall-engagement level 10 (Ambassador). Inventory is null
        // because earning it is gated by activity, not stock.
        LFL::setup(a: 'prize', with: [
            'slug' => 'sandbox-pro',
            'name' => 'Sandbox Pro',
            'description' => 'Unlocks the same features Stripe Pro subscribers get — earned by genuine engagement.',
            'type' => 'virtual',
            'metadata' => ['feature_grant_equivalent' => 'sandbox-pro-features'],
        ]);

        LFL::setup(a: 'prize', with: [
            'slug' => 'early-tester-badge',
            'name' => 'Early Tester Badge',
            'description' => 'Cosmetic flair on your public profile.',
            'type' => 'virtual',
        ]);
    }
}

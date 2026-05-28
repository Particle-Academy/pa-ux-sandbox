<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use LaravelFunLab\Facades\LFL;

/**
 * Seeds the Fancy UI showcase's gamification taxonomy.
 *
 * Five XP buckets reflect the surfaces visitors actually engage with:
 *   - explorer-xp   : browsing packages / components
 *   - tinkerer-xp   : actually using interactive demos
 *   - bridge-xp     : invoking MCP bridge tools from chat
 *   - reader-xp     : viewing docs / source
 *   - dreamer-xp    : interacting with the dreaming branch (votes, theme filter)
 *
 * They roll up via the `overall-engagement` group with weights tuned so
 * "doing things" outranks "looking at things." That group's levels drive
 * the chrome chip and act as the milestone for prize-based feature
 * unlocks (see laravel-fms pre-strategy wiring in v0.6.0+).
 *
 * Idempotent — LFL::setup() upserts on slug, so this is safe to re-run.
 */
class FunLabSeeder extends Seeder
{
    public function run(): void
    {
        $this->command->info('Seeding Laravel Fun Lab taxonomy...');

        $this->seedGamedMetrics();
        $this->seedMetricLevels();
        $this->seedOverallGroup();
        $this->seedAchievements();
        $this->seedPrizes();

        $this->command->info('  ✓ Fun Lab taxonomy seeded');
    }

    protected function seedGamedMetrics(): void
    {
        $metrics = [
            ['slug' => 'explorer-xp', 'name' => 'Explorer XP', 'description' => 'Earned by browsing packages and component pages.', 'icon' => 'compass'],
            ['slug' => 'tinkerer-xp', 'name' => 'Tinkerer XP', 'description' => 'Earned by actually using interactive demos.', 'icon' => 'wrench'],
            ['slug' => 'bridge-xp', 'name' => 'Bridge XP', 'description' => 'Earned by invoking MCP bridge tools from an agent surface.', 'icon' => 'plug'],
            ['slug' => 'reader-xp', 'name' => 'Reader XP', 'description' => 'Earned by viewing docs and source files.', 'icon' => 'book-open'],
            ['slug' => 'dreamer-xp', 'name' => 'Dreamer XP', 'description' => 'Earned by exploring the dreaming branch and voting on speculative components.', 'icon' => 'sparkles'],
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

        foreach (['explorer-xp', 'tinkerer-xp', 'bridge-xp', 'reader-xp', 'dreamer-xp'] as $metric) {
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
        //   doing > using > exploring > reading
        // Bridge use is the strongest signal that someone is actually
        // composing with agents (the Human+ UX thesis), so it gets the
        // highest weight.
        $weights = [
            'bridge-xp'   => 1.5,
            'tinkerer-xp' => 1.2,
            'dreamer-xp'  => 1.0,
            'explorer-xp' => 0.6,
            'reader-xp'   => 0.5,
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

<?php

namespace Database\Seeders;

use App\Models\User;
use FancyMlm\Laravel\Models\Member;
use Illuminate\Database\Seeder;

/**
 * Seeds a demo referral network into `mlm_members`. Every member carries BOTH a
 * `sponsor_id` (who enrolled them — the unilevel edge) and a `placement_id`
 * (where they sit after spillover — the binary / matrix edge), and the two
 * diverge on purpose: the sponsor tree is WIDE (the root personally enrolled
 * five people) while the placement tree is a DEEP two-leg structure. Switching
 * the tree type on /admin/mlm re-shapes the very same members — the point of the
 * showcase.
 *
 * The root is linked to the "Test User" account so the signed-in demo user sees
 * their own downline + commissions on /referrals.
 */
class MlmNetworkSeeder extends Seeder
{
    public function run(): void
    {
        $this->command?->info('Seeding fancy-mlm demo network...');

        // Clean slate — this is demo data, not taxonomy.
        Member::query()->delete();

        $root = User::query()->where('email', 'user@example.com')->first();

        // name => [sponsor, placement, tier, active]
        $spec = [
            'You' => [null, null, 'gold', true],
            'Ada' => ['You', 'You', 'gold', true],
            'Bo' => ['You', 'You', 'silver', true],
            'Cy' => ['You', 'Ada', 'silver', true],
            'Di' => ['You', 'Bo', 'bronze', true],
            'Eve' => ['You', 'Ada', 'bronze', false], // inactive — shows compression
            'Fin' => ['Ada', 'Cy', 'silver', true],
            'Gus' => ['Ada', 'Di', 'bronze', true],
            'Hana' => ['Bo', 'Eve', 'bronze', true],
            'Ivy' => ['Cy', 'Fin', 'bronze', true],
            'Jo' => ['Cy', 'Gus', 'diamond', true],
            'Kai' => ['Di', 'Hana', 'bronze', true],
        ];

        /** @var array<string, int> $ids */
        $ids = [];
        foreach ($spec as $name => [$sponsor, $placement, $tier, $active]) {
            $member = Member::query()->create([
                'user_id' => $name === 'You' ? $root?->getKey() : null,
                'sponsor_id' => $sponsor ? $ids[$sponsor] : null,
                'placement_id' => $placement ? $ids[$placement] : null,
                'tier' => $tier,
                'active' => $active,
                'meta' => ['label' => $name, 'demo' => true],
            ]);
            $ids[$name] = $member->getKey();
        }

        $this->command?->info('  ✓ '.count($ids).' members seeded (root → '.($root?->email ?? 'unlinked').')');
    }
}

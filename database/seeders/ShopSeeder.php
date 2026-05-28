<?php

namespace Database\Seeders;

use App\Models\ShopItem;
use Illuminate\Database\Seeder;

/**
 * Seeds the initial coin shop catalog: a small set of cosmetics that
 * decorate a user's profile + leaderboard chip, and one real service —
 * Featured Showcase — that flips a submission's featured_until window
 * forward N days.
 *
 * Idempotent — keyed on slug via updateOrCreate.
 */
class ShopSeeder extends Seeder
{
    public function run(): void
    {
        $items = [
            // Cosmetics — avatar frames
            [
                'slug' => 'cosmetic-frame-bronze',
                'name' => 'Bronze Avatar Frame',
                'description' => 'Adds a bronze ring around your avatar across the site.',
                'kind' => 'cosmetic',
                'price' => 250,
                'order' => 10,
                'metadata' => ['slot' => 'avatar-frame', 'value' => 'bronze'],
            ],
            [
                'slug' => 'cosmetic-frame-silver',
                'name' => 'Silver Avatar Frame',
                'description' => 'Adds a silver ring around your avatar across the site.',
                'kind' => 'cosmetic',
                'price' => 750,
                'order' => 11,
                'metadata' => ['slot' => 'avatar-frame', 'value' => 'silver'],
            ],
            [
                'slug' => 'cosmetic-frame-gold',
                'name' => 'Gold Avatar Frame',
                'description' => 'Adds a gold ring around your avatar across the site.',
                'kind' => 'cosmetic',
                'price' => 2000,
                'order' => 12,
                'metadata' => ['slot' => 'avatar-frame', 'value' => 'gold'],
            ],

            // Cosmetics — name colors
            [
                'slug' => 'cosmetic-name-color-blue',
                'name' => 'Blue Display Name',
                'description' => 'Renders your display name in cool blue.',
                'kind' => 'cosmetic',
                'price' => 200,
                'order' => 20,
                'metadata' => ['slot' => 'name-color', 'value' => 'blue'],
            ],
            [
                'slug' => 'cosmetic-name-color-rainbow',
                'name' => 'Rainbow Display Name',
                'description' => 'Animated rainbow gradient on your display name.',
                'kind' => 'cosmetic',
                'price' => 1500,
                'order' => 21,
                'metadata' => ['slot' => 'name-color', 'value' => 'rainbow'],
            ],

            // Cosmetics — profile banner
            [
                'slug' => 'cosmetic-banner-sunset',
                'name' => 'Sunset Profile Banner',
                'description' => 'A warm orange/pink gradient banner across your profile page.',
                'kind' => 'cosmetic',
                'price' => 500,
                'order' => 30,
                'metadata' => ['slot' => 'banner', 'value' => 'sunset'],
            ],
            [
                'slug' => 'cosmetic-banner-aurora',
                'name' => 'Aurora Profile Banner',
                'description' => 'Subtle green/violet aurora gradient across your profile page.',
                'kind' => 'cosmetic',
                'price' => 500,
                'order' => 31,
                'metadata' => ['slot' => 'banner', 'value' => 'aurora'],
            ],

            // Services
            [
                'slug' => 'service-featured-showcase-7d',
                'name' => 'Feature Showcase Item (7 days)',
                'description' => 'Promotes one of your showcase submissions to the featured strip for 7 days. Stacks if already featured.',
                'kind' => 'service',
                'price' => 1000,
                'order' => 100,
                'metadata' => ['service' => 'featured-showcase', 'duration_days' => 7],
            ],
            [
                'slug' => 'service-featured-showcase-30d',
                'name' => 'Feature Showcase Item (30 days)',
                'description' => 'Promotes one of your showcase submissions to the featured strip for 30 days.',
                'kind' => 'service',
                'price' => 3500,
                'order' => 101,
                'metadata' => ['service' => 'featured-showcase', 'duration_days' => 30],
            ],
        ];

        foreach ($items as $data) {
            ShopItem::updateOrCreate(['slug' => $data['slug']], array_merge($data, ['active' => true]));
        }

        $this->command->info('  ✓ Shop items seeded ('.count($items).' items)');
    }
}

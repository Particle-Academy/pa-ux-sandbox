<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use LaravelCatalog\Models\Product;
use LaravelCatalog\Models\Price;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $this->command->info('Seeding database...');
        $this->command->newLine();

        // Create Users
        // Outside the local sandbox, require explicit env-supplied passwords.
        // Otherwise an accidental seed against a real environment would
        // create two known-credential accounts that exist forever.
        $isLocal = app()->environment('local');
        $adminPassword = (string) env('SEED_ADMIN_PASSWORD', $isLocal ? 'password' : '');
        $userPassword = (string) env('SEED_USER_PASSWORD', $isLocal ? 'password' : '');

        if (! $isLocal && ($adminPassword === '' || $userPassword === '')) {
            throw new \RuntimeException(
                'SEED_ADMIN_PASSWORD and SEED_USER_PASSWORD must be set when seeding outside local.'
            );
        }

        $this->command->info('Creating users...');
        $admin = User::factory()->create([
            'name' => 'Admin User',
            'email' => 'admin@example.com',
            'password' => Hash::make($adminPassword),
            'is_admin' => true,
        ]);
        $this->command->info("  ✓ Created Admin User: {$admin->email}");

        $user = User::factory()->create([
            'name' => 'Test User',
            'email' => 'user@example.com',
            'password' => Hash::make($userPassword),
            'is_admin' => false,
        ]);
        $this->command->info("  ✓ Created Test User: {$user->email}");
        $this->command->newLine();

        // Create Products with Recurring Prices (Plans)
        $this->command->info('Creating subscription plans...');
        $plans = $this->createPlans();
        $this->command->info("  ✓ Created {$plans['products']} plans with {$plans['prices']} pricing options");
        $this->command->newLine();

        // Create Products with One-Time Prices (Add-ons)
        $this->command->info('Creating one-time products (add-ons)...');
        $addons = $this->createAddons();
        $this->command->info("  ✓ Created {$addons['products']} add-on products with {$addons['prices']} pricing options");
        $this->command->newLine();

        // Summary
        $this->command->info('Database seeding completed!');
        $this->command->newLine();
        $this->command->info('Test Credentials:');
        $this->command->table(
            ['Role', 'Email', 'Password'],
            [
                ['Admin', 'admin@example.com', 'password'],
                ['User', 'user@example.com', 'password'],
            ]
        );
        $this->command->newLine();
        $this->command->info('Test Data Summary:');
        $this->command->table(
            ['Type', 'Count'],
            [
                ['Users', '2'],
                ['Subscription Plans', $plans['products']],
                ['Plan Prices', $plans['prices']],
                ['Add-on Products', $addons['products']],
                ['Add-on Prices', $addons['prices']],
            ]
        );
    }

    /**
     * Create subscription plans (Products with recurring prices).
     */
    protected function createPlans(): array
    {
        $plans = [
            [
                'name' => 'Starter',
                'description' => 'Perfect for individuals and small projects. Get started with essential features.',
                'order' => 10,
                'metadata' => [
                    'storefront' => [
                        'plan' => [
                            'show' => true,
                            'recommended' => false,
                        ],
                    ],
                ],
                'prices' => [
                    [
                        'unit_amount' => 0, // Free
                        'currency' => 'USD',
                        'recurring_interval' => 'month',
                        'type' => Price::TYPE_RECURRING,
                        'metadata' => [
                            'seats_included' => 3,
                            'tokens_per_period' => 10000,
                        ],
                        'order' => 0,
                    ],
                    [
                        'unit_amount' => 0, // Free yearly
                        'currency' => 'USD',
                        'recurring_interval' => 'year',
                        'type' => Price::TYPE_RECURRING,
                        'metadata' => [
                            'seats_included' => 3,
                            'tokens_per_period' => 120000,
                        ],
                        'order' => 1,
                    ],
                ],
            ],
            [
                'name' => 'Pro',
                'description' => 'For growing teams and businesses. Advanced features and priority support.',
                'order' => 20,
                'metadata' => [
                    'storefront' => [
                        'plan' => [
                            'show' => true,
                            'recommended' => true, // Marked as recommended
                        ],
                    ],
                ],
                'prices' => [
                    [
                        'unit_amount' => 2900, // $29/month
                        'currency' => 'USD',
                        'recurring_interval' => 'month',
                        'type' => Price::TYPE_RECURRING,
                        'recurring_trial_period_days' => 14,
                        'metadata' => [
                            'seats_included' => 10,
                            'tokens_per_period' => 100000,
                        ],
                        'order' => 0,
                    ],
                    [
                        'unit_amount' => 29000, // $290/year (save ~$58)
                        'currency' => 'USD',
                        'recurring_interval' => 'year',
                        'type' => Price::TYPE_RECURRING,
                        'recurring_trial_period_days' => 14,
                        'metadata' => [
                            'seats_included' => 10,
                            'tokens_per_period' => 1200000,
                        ],
                        'order' => 1,
                    ],
                ],
            ],
            [
                'name' => 'Business',
                'description' => 'For large organizations. Enterprise features, unlimited seats, and dedicated support.',
                'order' => 30,
                'metadata' => [
                    'storefront' => [
                        'plan' => [
                            'show' => true,
                            'recommended' => false,
                        ],
                    ],
                ],
                'prices' => [
                    [
                        'unit_amount' => 9900, // $99/month
                        'currency' => 'USD',
                        'recurring_interval' => 'month',
                        'type' => Price::TYPE_RECURRING,
                        'recurring_trial_period_days' => 14,
                        'metadata' => [
                            'seats_included' => null, // Unlimited
                            'tokens_per_period' => 1000000,
                        ],
                        'order' => 0,
                    ],
                    [
                        'unit_amount' => 99000, // $990/year (save ~$198)
                        'currency' => 'USD',
                        'recurring_interval' => 'year',
                        'type' => Price::TYPE_RECURRING,
                        'recurring_trial_period_days' => 14,
                        'metadata' => [
                            'seats_included' => null, // Unlimited
                            'tokens_per_period' => 12000000,
                        ],
                        'order' => 1,
                    ],
                ],
            ],
        ];

        $productCount = 0;
        $priceCount = 0;

        foreach ($plans as $planData) {
            $prices = $planData['prices'];
            unset($planData['prices']);

            $product = Product::create(
                array_merge($planData, [
                    'active' => true,
                    'images' => [],
                    'metadata' => $planData['metadata'] ?? [],
                ])
            );

            $productCount++;

            foreach ($prices as $priceData) {
                Price::create(
                    array_merge($priceData, [
                        'product_id' => $product->id,
                        'active' => true,
                        'recurring_interval_count' => 1,
                    ])
                );

                $priceCount++;
            }
        }

        return ['products' => $productCount, 'prices' => $priceCount];
    }

    /**
     * Create one-time products (add-ons).
     */
    protected function createAddons(): array
    {
        $addons = [
            [
                'name' => 'Premium Support',
                'description' => 'Get priority support with 24/7 access to our expert team.',
                'order' => 10,
                'metadata' => [
                    'storefront' => [
                        'addon' => [
                            'show' => true,
                        ],
                    ],
                ],
                'prices' => [
                    [
                        'unit_amount' => 4999, // $49.99 one-time
                        'currency' => 'USD',
                        'type' => Price::TYPE_ONE_TIME,
                        'order' => 0,
                    ],
                ],
            ],
            [
                'name' => 'Extra Storage',
                'description' => 'Add 500GB of additional storage to your account.',
                'order' => 20,
                'metadata' => [
                    'storefront' => [
                        'addon' => [
                            'show' => true,
                        ],
                    ],
                ],
                'prices' => [
                    [
                        'unit_amount' => 1999, // $19.99 one-time
                        'currency' => 'USD',
                        'type' => Price::TYPE_ONE_TIME,
                        'order' => 0,
                    ],
                ],
            ],
            [
                'name' => 'Custom Domain',
                'description' => 'Use your own custom domain with SSL certificate included.',
                'order' => 30,
                'metadata' => [
                    'storefront' => [
                        'addon' => [
                            'show' => true,
                        ],
                    ],
                ],
                'prices' => [
                    [
                        'unit_amount' => 999, // $9.99 one-time setup
                        'currency' => 'USD',
                        'type' => Price::TYPE_ONE_TIME,
                        'order' => 0,
                    ],
                ],
            ],
        ];

        $productCount = 0;
        $priceCount = 0;

        foreach ($addons as $addonData) {
            $prices = $addonData['prices'];
            unset($addonData['prices']);

            $product = Product::create(
                array_merge($addonData, [
                    'active' => true,
                    'images' => [],
                    'metadata' => $addonData['metadata'] ?? [],
                ])
            );

            $productCount++;

            foreach ($prices as $priceData) {
                Price::create(
                    array_merge($priceData, [
                        'product_id' => $product->id,
                        'active' => true,
                    ])
                );

                $priceCount++;
            }
        }

        return ['products' => $productCount, 'prices' => $priceCount];
    }
}

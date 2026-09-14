<?php

namespace Database\Factories\Catalog;

use LaravelCatalog\Database\Factories\PriceFactory as CatalogPriceFactory;
use LaravelCatalog\Models\Price;

/**
 * laravel-catalog's PriceFactory without Faker.
 *
 * The package's own definition() calls fake() and builds its product with
 * the package's ProductFactory, which calls it too. The states (`oneTime()`,
 * `yearly()`) are inherited unchanged. Delete this class once
 * laravel-catalog's factories stop calling fake().
 */
class PriceFactory extends CatalogPriceFactory
{
    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'product_id' => ProductFactory::new(),
            'active' => true,
            'currency' => 'USD',
            'unit_amount' => random_int(1000, 50000),
            'recurring_interval' => 'month',
            'recurring_interval_count' => 1,
            'recurring_trial_period_days' => null,
            'type' => Price::TYPE_RECURRING,
            'metadata' => [],
            'external_id' => null,
            'order' => 0,
        ];
    }
}

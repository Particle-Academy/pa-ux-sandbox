<?php

namespace Database\Factories\Catalog;

use Illuminate\Support\Arr;
use LaravelCatalog\Database\Factories\ProductFactory as CatalogProductFactory;

/**
 * laravel-catalog's ProductFactory without Faker.
 *
 * The package's own definition() calls fake(), which Laravel only defines
 * when fakerphp/faker is installed, and this app does not install it. Use
 * `ProductFactory::new()` where the package docs use `Product::factory()`.
 * Delete this class once laravel-catalog's factories stop calling fake().
 */
class ProductFactory extends CatalogProductFactory
{
    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $name = Arr::random(['Starter', 'Growth', 'Team', 'Business', 'Studio', 'Enterprise'])
            .' '.Arr::random(['Plan', 'Bundle', 'Pass', 'Membership', 'License']);

        return [
            'name' => $name,
            'description' => "The {$name}, made by a test factory.",
            'active' => true,
            'images' => [],
            'metadata' => [],
            'statement_descriptor' => null,
            'unit_label' => null,
            'external_id' => null,
            'order' => 0,
        ];
    }
}

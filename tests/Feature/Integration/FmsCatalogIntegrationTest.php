<?php

use Illuminate\Foundation\Testing\RefreshDatabase;
use LaravelCatalog\Models\Product;
use LaravelCatalog\Models\ProductFeature;
use ParticleAcademy\Fms\Services\FmsFeatureRegistry;
use ParticleAcademy\Fms\Contracts\FeatureManagerInterface;
use Tests\TestCase;

uses(TestCase::class, RefreshDatabase::class);

it('can sync FMS features to ProductFeature model', function () {
    $registry = app(FmsFeatureRegistry::class);
    
    // Clear existing features for this test
    ProductFeature::where('key', 'integration-test-feature')->delete();
    
    // Register a feature in FMS registry
    $registry->register('integration-test-feature', [
        'name' => 'Integration Test Feature',
        'description' => 'Test feature for integration',
        'type' => 'boolean',
    ]);
    
    // Sync to database
    $result = $registry->syncNewFeatures();
    
    expect($result['created'])->toBeGreaterThanOrEqual(1);
    
    // Verify it was created in ProductFeature table
    $feature = ProductFeature::where('key', 'integration-test-feature')->first();
    
    expect($feature)->not->toBeNull()
        ->and($feature->name)->toBe('Integration Test Feature')
        ->and($feature->type)->toBe('boolean');
});

it('can attach ProductFeature to Product', function () {
    $product = Product::factory()->create();
    $feature = ProductFeature::create([
        'key' => 'product-feature-test',
        'name' => 'Product Feature Test',
        'type' => 'boolean',
    ]);
    
    // Use DB facade to insert with ULID since pivot table has ULID id
    \Illuminate\Support\Facades\DB::table('product_feature_configs')->insert([
        'id' => \Illuminate\Support\Str::ulid(),
        'product_id' => $product->id,
        'product_feature_id' => $feature->id,
        'enabled' => true,
        'included_quantity' => null,
        'created_at' => now(),
        'updated_at' => now(),
    ]);
    
    $product->refresh();
    
    expect($product->productFeatures)->toHaveCount(1)
        ->and($product->productFeatures->first()->key)->toBe('product-feature-test')
        ->and((bool) $product->productFeatures->first()->pivot->enabled)->toBeTrue();
});

it('configures FMS to use Catalog ProductFeature model', function () {
    $modelClass = config('fms.product_feature_model');
    
    expect($modelClass)->toBe(\LaravelCatalog\Models\ProductFeature::class)
        ->and(class_exists($modelClass))->toBeTrue();
});

it('can use FMS FeatureManager with ProductFeature', function () {
    $manager = app(FeatureManagerInterface::class);
    
    // Register feature via registry
    $registry = app(FmsFeatureRegistry::class);
    $registry->register('manager-test-feature', [
        'name' => 'Manager Test',
        'type' => 'boolean',
        'enabled' => true,
    ]);
    
    // Check access
    expect($manager->canAccess('manager-test-feature'))->toBeTrue();
    
    // Register disabled feature
    $registry->register('disabled-feature', [
        'name' => 'Disabled',
        'type' => 'boolean',
        'enabled' => false,
    ]);
    
    expect($manager->canAccess('disabled-feature'))->toBeFalse();
});

it('can sync features from config to ProductFeature', function () {
    // Clear existing feature for this test
    ProductFeature::where('key', 'config-test-feature')->delete();
    
    $registry = app(FmsFeatureRegistry::class);
    
    // Manually register from config
    $registry->register('config-test-feature', [
        'name' => 'Config Test Feature',
        'type' => 'resource',
    ]);
    
    $result = $registry->syncNewFeatures();
    
    expect($result['created'])->toBeGreaterThanOrEqual(1);
    
    $feature = ProductFeature::where('key', 'config-test-feature')->first();
    
    expect($feature)->not->toBeNull()
        ->and($feature->type)->toBe('resource');
});


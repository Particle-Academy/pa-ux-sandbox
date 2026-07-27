<?php

use App\Models\FlowNodePackage;
use Tests\TestCase;

uses(TestCase::class);

/**
 * The marketplace registry's write side.
 *
 * It had a read side and no way in — rows had to be hand-written, which meant
 * the validator deciding what a valid manifest is had never run against a real
 * one.
 */
function manifestFile(array $overrides = []): string
{
    $manifest = array_merge([
        'schemaVersion' => 1,
        'name' => '@acme/fancy-flow-node-widget',
        'kind' => '@acme/widget',
        'title' => 'Widget',
        'category' => 'io',
        'description' => 'Does widget things.',
        'ui' => ['ui'],
        'runtimes' => ['ts' => ['files' => ['js'], 'engine' => '>=0.30.0']],
        'fixtures' => 'fixtures/widget.json',
        'sideEffects' => 'idempotent',
    ], $overrides);

    $path = tempnam(sys_get_temp_dir(), 'manifest').'.json';
    file_put_contents($path, json_encode($manifest));

    return $path;
}

it('registers a manifest and lists it', function () {
    $this->artisan('flow:register-node', ['manifest' => manifestFile()])
        ->assertSuccessful();

    $package = FlowNodePackage::query()->where('kind', '@acme/widget')->firstOrFail();

    expect($package->status)->toBe(FlowNodePackage::LISTED)
        ->and($package->provenance)->toBe(FlowNodePackage::FIRST_PARTY)
        ->and($package->runtimes)->toBe(['ts'])
        ->and($package->verified)->toBeFalse();
});

it('updates in place on re-registration rather than listing the node twice', function () {
    $this->artisan('flow:register-node', ['manifest' => manifestFile()])->assertSuccessful();
    $this->artisan('flow:register-node', ['manifest' => manifestFile(['description' => 'Now with more widget.'])])
        ->assertSuccessful();

    expect(FlowNodePackage::query()->where('kind', '@acme/widget')->count())->toBe(1);
    expect(FlowNodePackage::query()->where('kind', '@acme/widget')->value('description'))
        ->toBe('Now with more widget.');
});

it('refuses a manifest the engine would refuse', function () {
    // A bare kind id is the one mistake that cannot be fixed afterwards — the
    // ambiguous string is already written into saved documents.
    $this->artisan('flow:register-node', ['manifest' => manifestFile(['kind' => 'widget'])])
        ->assertFailed();

    expect(FlowNodePackage::query()->count())->toBe(0);
});

it('refuses a package that claims its own verification', function () {
    $this->artisan('flow:register-node', ['manifest' => manifestFile(['verified' => true])])
        ->assertFailed();

    expect(FlowNodePackage::query()->count())->toBe(0);
});

it('can hold a package back for review', function () {
    $this->artisan('flow:register-node', ['manifest' => manifestFile(), '--pending' => true])
        ->assertSuccessful();

    // Pending is not servable: an install command must never resolve it.
    expect(FlowNodePackage::query()->listed()->count())->toBe(0);

    // Asserted on the submission, not on the index being empty. The index also
    // carries the first-party nodes, which are built rather than registered —
    // and an index that WAS empty is the bug FirstPartyNodeRegistryTest covers.
    $items = collect($this->getJson('/r/nodes/index.json')->assertOk()->json('items'));

    expect($items->pluck('kind'))->not->toContain('@acme/widget');
    $this->getJson('/r/nodes/acme__widget.json')->assertNotFound();
});

it('serves a registered node to the public index and manifest endpoints', function () {
    $this->artisan('flow:register-node', ['manifest' => manifestFile()])->assertSuccessful();

    // Looked up by kind rather than by position: the index also carries the
    // first-party nodes, so `items.0` is whatever sorts first, not this one.
    $entry = collect($this->getJson('/r/nodes/index.json')->assertOk()->json('items'))
        ->firstWhere('kind', '@acme/widget');

    expect($entry)->not->toBeNull();
    expect($entry['url'])->toBe('/r/nodes/acme__widget.json');

    $this->getJson('/r/nodes/acme__widget.json')
        ->assertOk()
        ->assertJsonPath('kind', '@acme/widget')
        // The two facts the registry owns rather than the package.
        ->assertJsonPath('verified', false);
});

<?php

use App\Support\Registry\RegistryItem;
use App\Support\Registry\RegistrySource;
use Tests\TestCase;

uses(TestCase::class);

function registryItem(string $name, ?string $since = null, ?string $until = null): RegistryItem
{
    return new RegistryItem(
        name: $name,
        title: ucfirst($name),
        description: "The $name component",
        package: 'react-fancy',
        files: [['path' => "$name.tsx", 'content' => '// …', 'type' => 'registry:ui', 'target' => '']],
        since: $since,
        until: $until,
    );
}

/** Swap the real registry for a fixture so the assertions do not move with the catalog. */
function fakeComponentRegistry(array $items): void
{
    $source = Mockery::mock(RegistrySource::class);
    $source->shouldReceive('all')->andReturn($items);
    $source->shouldReceive('find')->andReturnUsing(
        fn (string $slug) => collect($items)->firstWhere('name', $slug)
    );

    app()->instance(RegistrySource::class, $source);
}

beforeEach(function () {
    fakeComponentRegistry([
        registryItem('always'),                      // in every version
        registryItem('added-in-05', since: '0.5'),   // did not exist in 0.4
        registryItem('dropped-after-04', until: '0.4'), // gone in 0.5
    ]);
});

// ─── existsIn ────────────────────────────────────────────────────────────────

it('treats an item with no bounds as present in every version', function () {
    expect(registryItem('always')->existsIn('0.1'))->toBeTrue();
    expect(registryItem('always')->existsIn('9.9'))->toBeTrue();
});

it('excludes an item before the version it was added in', function () {
    $added = registryItem('x', since: '0.5');

    expect($added->existsIn('0.4'))->toBeFalse();
    expect($added->existsIn('0.5'))->toBeTrue();
    expect($added->existsIn('0.6'))->toBeTrue();
});

it('excludes an item after the version it was removed in', function () {
    $dropped = registryItem('x', until: '0.4');

    expect($dropped->existsIn('0.4'))->toBeTrue();
    expect($dropped->existsIn('0.5'))->toBeFalse();
});

/**
 * The bug a string comparison would introduce, and the reason for
 * version_compare: "0.10" < "0.9" lexically, so every item added in 0.9 would
 * silently vanish from the 0.10 index — with a 200 and a shorter list, which
 * looks exactly like success.
 */
it('orders 0.10 after 0.9 rather than comparing as strings', function () {
    expect(registryItem('x', since: '0.9')->existsIn('0.10'))->toBeTrue();
    expect(registryItem('x', until: '0.9')->existsIn('0.10'))->toBeFalse();
});

// ─── The index ───────────────────────────────────────────────────────────────

it('serves the whole catalog when no version is asked for', function () {
    $names = collect($this->getJson('/r/index.json')->assertOk()->json('items'))->pluck('name');

    expect($names->all())->toBe(['always', 'added-in-05', 'dropped-after-04']);
});

it('narrows the index to what existed in the requested version', function () {
    $names = collect($this->getJson('/r/index.json?version=0.4')->assertOk()->json('items'))->pluck('name');

    expect($names->all())->toBe(['always', 'dropped-after-04']);
});

it('drops a removed item from a later version', function () {
    $names = collect($this->getJson('/r/index.json?version=0.5')->assertOk()->json('items'))->pluck('name');

    expect($names->all())->toBe(['always', 'added-in-05']);
});

it('reports which version the index describes', function () {
    $this->getJson('/r/index.json')->assertJsonPath('version', config('kit.version'));
    $this->getJson('/r/index.json?version=0.4')->assertJsonPath('version', '0.4');
});

/**
 * Public, cached, and consumed by tooling — failing someone's whole install
 * over a junk query string would be worse than ignoring it.
 */
it('ignores a malformed version rather than erroring', function () {
    $this->getJson('/r/index.json?version=latest')
        ->assertOk()
        ->assertJsonPath('version', config('kit.version'))
        ->assertJsonCount(3, 'items');
});

// ─── One item ────────────────────────────────────────────────────────────────

it('404s an item that did not exist in the requested version, rather than serving it anyway', function () {
    // The CLI vendors whatever this returns. Source that cannot compile against
    // the consumer's kit is a worse answer than no source.
    $this->getJson('/r/added-in-05.json?version=0.4')
        ->assertNotFound()
        ->assertJsonPath('since', '0.5');
});

it('serves an item that did exist in the requested version', function () {
    $this->getJson('/r/dropped-after-04.json?version=0.4')
        ->assertOk()
        ->assertJsonPath('name', 'dropped-after-04');
});

// ─── The payload shape ───────────────────────────────────────────────────────

/**
 * An item present in every version must serialize exactly as it did before
 * versioning existed — otherwise every consumer's cached registry churns for
 * two null fields.
 */
it('omits the version fields entirely when they are not set', function () {
    $summary = collect($this->getJson('/r/index.json')->json('items'))->firstWhere('name', 'always');

    expect($summary)->not->toHaveKey('since');
    expect($summary)->not->toHaveKey('until');
});

it('emits the version fields on an item that has them', function () {
    $this->getJson('/r/added-in-05.json')
        ->assertOk()
        ->assertJsonPath('since', '0.5');
});

it('round-trips since and until through the precompiled artifact', function () {
    // Production loads the registry from a built JSON artifact, so a field that
    // survives toArray() but not fromArray() would work everywhere except prod.
    $restored = RegistryItem::fromArray(registryItem('x', since: '0.5', until: '0.7')->toArray());

    expect($restored->since)->toBe('0.5');
    expect($restored->until)->toBe('0.7');
});

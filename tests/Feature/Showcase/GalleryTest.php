<?php

use App\Support\GalleryRegistry;
use Tests\TestCase;

uses(TestCase::class);

it('serves the gallery index with every collection + all 60 style cards', function () {
    $this->getJson('/gallery/index.json')
        ->assertOk()
        ->assertJsonPath('count', 60)
        ->assertJsonPath('kind', 'design-blueprints')
        ->assertJsonPath('collections.0.id', 'fieldwork')
        ->assertJsonPath('collections.1.id', 'mom-n-pops')
        ->assertJsonPath('collections.2.id', 'dashboards')
        ->assertJsonPath('styles.0.id', 'swiss')
        ->assertJsonPath('styles.0.blueprint', '/gallery/fieldwork/swiss.json')
        ->assertJsonPath('styles.20.id', 'tacos')
        ->assertJsonPath('styles.20.blueprint', '/gallery/mom-n-pops/tacos.json')
        ->assertJsonPath('styles.40.id', 'pulse')
        ->assertJsonPath('styles.40.blueprint', '/gallery/dashboards/pulse.json')
        ->assertHeader('access-control-allow-origin', '*');
});

it("serves one collection's own index", function () {
    $this->getJson('/gallery/mom-n-pops/index.json')
        ->assertOk()
        ->assertJsonPath('id', 'mom-n-pops')
        ->assertJsonPath('name', 'Mom-n-Pops')
        ->assertJsonPath('count', 20)
        ->assertJsonPath('styles.0.id', 'tacos')
        ->assertJsonPath('styles.0.url', '/inspiration/mom-n-pops/tacos');
});

it("serves one style's full grab-blueprint (recipe + metadata)", function () {
    $this->getJson('/gallery/fieldwork/swiss.json')
        ->assertOk()
        ->assertJsonPath('id', 'swiss')
        ->assertJsonPath('collection', 'fieldwork')
        ->assertJsonPath('kind', 'design-blueprint')
        ->assertJsonStructure([
            'id', 'num', 'name', 'mode', 'thumb', 'url', 'usage', 'collection',
            'thesis', 'tokens', 'layout', 'sections', 'palette', 'contentArchetype', 'remix',
        ]);
});

it('ships a full recipe for every style in every collection', function (string $collection, string $id) {
    $res = $this->getJson("/gallery/{$collection}/{$id}.json")->assertOk();
    expect($res->json('kind'))->toBe('design-blueprint');
    expect($res->json('thesis'))->toBeString()->not->toBe('');
    expect(count($res->json('sections')))->toBeGreaterThan(0)
        ->and(count($res->json('palette')))->toBeGreaterThan(0);
})->with(collect(GalleryRegistry::collections())
    ->flatMap(fn (array $c) => array_map(
        fn (array $s) => [$c['id'], $s['id']],
        GalleryRegistry::styles($c['id']),
    ))->all());

it('resolves legacy pre-collection blueprint urls by bare style id', function () {
    $this->getJson('/gallery/swiss.json')
        ->assertOk()
        ->assertJsonPath('id', 'swiss')
        ->assertJsonPath('collection', 'fieldwork')
        ->assertJsonPath('url', '/inspiration/fieldwork/swiss');

    $this->getJson('/gallery/tacos.json')
        ->assertOk()
        ->assertJsonPath('id', 'tacos')
        ->assertJsonPath('collection', 'mom-n-pops')
        ->assertJsonPath('url', '/inspiration/mom-n-pops/tacos');
});

it('404s on unknown styles + collections', function () {
    $this->getJson('/gallery/nope.json')->assertStatus(404);
    $this->getJson('/gallery/fieldwork/nope.json')->assertStatus(404);
    $this->getJson('/gallery/nope/swiss.json')->assertStatus(404);
    $this->getJson('/gallery/nope/index.json')->assertStatus(404);
});

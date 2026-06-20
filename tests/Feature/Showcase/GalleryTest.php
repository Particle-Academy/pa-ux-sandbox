<?php

use Tests\TestCase;

uses(TestCase::class);

it('serves the gallery index with all 20 styles + blueprint urls', function () {
    $this->getJson('/gallery/index.json')
        ->assertOk()
        ->assertJsonPath('count', 20)
        ->assertJsonPath('kind', 'design-blueprints')
        ->assertJsonPath('styles.0.id', 'swiss')
        ->assertJsonPath('styles.0.blueprint', '/gallery/swiss.json')
        ->assertHeader('access-control-allow-origin', '*');
});

it("serves one style's full grab-blueprint (recipe + metadata)", function () {
    $this->getJson('/gallery/swiss.json')
        ->assertOk()
        ->assertJsonPath('id', 'swiss')
        ->assertJsonPath('kind', 'design-blueprint')
        ->assertJsonStructure([
            'id', 'num', 'name', 'mode', 'thumb', 'url', 'usage',
            'thesis', 'tokens', 'layout', 'sections', 'palette', 'contentArchetype', 'remix',
        ]);
});

it('serves an agent-emitted blueprint with sections + palette', function () {
    $res = $this->getJson('/gallery/dark.json')->assertOk();
    expect(count($res->json('sections')))->toBeGreaterThan(0)
        ->and(count($res->json('palette')))->toBeGreaterThan(0);
});

it('404s on an unknown style', function () {
    $this->getJson('/gallery/nope.json')->assertStatus(404);
});

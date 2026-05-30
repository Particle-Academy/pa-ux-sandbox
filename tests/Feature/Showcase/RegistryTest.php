<?php

use App\Support\Registry\RegistryItem;
use App\Support\Registry\RegistrySource;
use Tests\TestCase;

uses(TestCase::class);

it('serves the registry from the compiled artifact when sibling source is absent (production parity)', function () {
    // Simulate Forge: only px-ui-sandbox is deployed — no ../react-fancy etc.
    // on disk — so RegistrySource must fall back to the committed artifact
    // (resources/registry/registry.json) instead of coming up empty.
    $source = Mockery::mock(RegistrySource::class)->makePartial();
    $source->shouldReceive('liveSourceAvailable')->andReturn(false);

    $items = $source->all();

    expect($items)->not->toBeEmpty();
    expect($items[0])->toBeInstanceOf(RegistryItem::class);
    // Full bundles (with source files) survive the round-trip through the artifact.
    expect($items[0]->files)->toBeArray()->not->toBeEmpty();
    // The compiled set matches the live scan — same source of truth.
    expect(count($items))->toBe(count($source->scanLive()));
})->skip(
    fn () => ! is_file(RegistrySource::compiledPath()),
    'registry artifact not built — run `php artisan registry:build`',
);

it('serves a shadcn-compatible registry index', function () {
    $response = $this->get('/r/index.json');

    $response->assertOk();
    $body = $response->json();

    expect($body)->toHaveKeys(['$schema', 'name', 'homepage', 'items']);
    expect($body['name'])->toBe('fancy-ui');
    expect($body['items'])->toBeArray()->not->toBeEmpty();

    // Each item carries the summary shape the CLI / MCP server reads.
    foreach ($body['items'] as $item) {
        expect($item)->toHaveKeys(['name', 'type', 'title', 'description', 'package', 'files', 'url']);
        expect($item['url'])->toStartWith('/r/');
    }
});

it('serves a registry item for an existing react-fancy component', function () {
    $response = $this->get('/r/card.json');

    $response->assertOk();
    $body = $response->json();

    expect($body['name'])->toBe('card');
    expect($body['title'])->toBe('Card');
    expect($body['package'])->toBe('react-fancy');
    expect($body['type'])->toBe('registry:ui');
    expect($body['files'])->toBeArray()->not->toBeEmpty();

    $cardFile = collect($body['files'])->firstWhere('path', 'components/fancy/card/Card.tsx');
    expect($cardFile)->not->toBeNull();
});

it('returns 404 for unknown registry slugs', function () {
    $response = $this->get('/r/this-does-not-exist.json');

    $response->assertStatus(404);
    expect($response->json('error'))->toContain('not found');
});

it('parses npm dependencies and filters peer deps', function () {
    $body = $this->get('/r/card.json')->json();

    expect($body['dependencies'])->toBeArray();
    expect($body['registryDependencies'])->toBeArray();
    expect($body['dependencies'])->not->toContain('react');
    expect($body['dependencies'])->not->toContain('react-dom');
});

it('includes all sibling .tsx files in the component folder', function () {
    $body = $this->get('/r/card.json')->json();

    $paths = array_column($body['files'], 'path');
    expect($paths)->toContain('components/fancy/card/Card.tsx');
    expect($paths)->toContain('components/fancy/card/CardHeader.tsx');
    expect($paths)->toContain('components/fancy/card/index.ts');
});

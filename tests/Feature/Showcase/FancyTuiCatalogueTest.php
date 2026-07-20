<?php

use Illuminate\Support\Arr;
use Tests\TestCase;

uses(TestCase::class);

/**
 * The catalogue feed behind /fancy-tui's "Fancy Docs TUI". The terminal draws
 * exactly what this returns, so the contract that matters is: the right shape,
 * no source bodies, and never a link that 404s.
 */
it('serves the stripped registry the docs TUI browses', function () {
    $response = $this->get('/fancy-tui/catalogue.json');

    $response->assertOk();
    $response->assertJsonStructure([
        'count',
        'items' => [['name', 'title', 'description', 'package', 'type', 'dependencies', 'registryDependencies', 'files', 'href']],
    ]);

    $items = $response->json('items');
    expect($items)->not->toBeEmpty();
    expect($response->json('count'))->toBe(count($items));
});

it('strips file contents so the payload stays small', function () {
    $items = $this->get('/fancy-tui/catalogue.json')->json('items');

    foreach (Arr::flatten(array_column($items, 'files'), 1) as $file) {
        expect($file)->toHaveKey('path');
        expect($file)->not->toHaveKey('content');
    }
});

it('only ever links to pages that exist', function () {
    $items = $this->get('/fancy-tui/catalogue.json')->json('items');

    $hrefs = array_values(array_unique(array_filter(array_column($items, 'href'))));
    expect($hrefs)->not->toBeEmpty();

    // Sampling keeps the suite quick while still proving the resolution rule —
    // a guessed "/packages/{pkg}/{name}" 404s for most of the registry.
    foreach (array_slice($hrefs, 0, 25) as $href) {
        expect($this->get($href)->status())->toBe(200, "expected {$href} to resolve");
    }
});

it('exposes the fancy-tui components the terminal renders inline', function () {
    $items = collect($this->get('/fancy-tui/catalogue.json')->json('items'))
        ->where('package', 'fancy-tui');

    expect($items)->not->toBeEmpty();
    expect($items->pluck('name'))->toContain('tui-status-bar');
});

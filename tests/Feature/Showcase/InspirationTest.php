<?php

use App\Support\GalleryRegistry;
use Tests\TestCase;

uses(TestCase::class);

it('lists every collection with all its styles on /inspiration', function () {
    $this->get('/inspiration')
        ->assertOk()
        ->assertInertia(function ($page) {
            $page->component('Inspiration/Index');
            $collections = collect($page->toArray()['props']['collections']);

            expect($collections->pluck('id')->all())->toBe(['fieldwork', 'mom-n-pops', 'dashboards']);

            $collections->each(function (array $c) {
                expect($c)->toHaveKeys(['id', 'name', 'kicker', 'title', 'subject', 'blurb', 'framing', 'range', 'count', 'styles']);
                // fieldwork + mom-n-pops ship 20; dashboards is landing in batches.
                expect(count($c['styles']))->toBe($c['count'])->toBeGreaterThan(0);
                collect($c['styles'])->each(function (array $s) use ($c) {
                    expect($s)->toHaveKeys(['id', 'num', 'name', 'note', 'mode', 'swatch', 'collection', 'thumb']);
                    expect($s['mode'])->toBeIn(['light', 'dark']);
                    expect($s['collection'])->toBe($c['id']);
                    expect($s['thumb'])->toBe("/inspiration-thumbs/{$c['id']}/{$s['id']}.jpeg");
                });
            });
        });
});

it('renders each collection catalog with its ordered styles', function (string $collection, string $first, string $last) {
    $this->get("/inspiration/{$collection}")
        ->assertOk()
        ->assertInertia(function ($page) use ($collection, $first, $last) {
            $page->component('Inspiration/Collection')
                ->where('collection.id', $collection);
            $styles = collect($page->toArray()['props']['styles']);
            expect($styles->count())->toBeGreaterThan(0);
            expect($styles->first()['id'])->toBe($first);
            expect($styles->last()['id'])->toBe($last);
        });
})->with([
    // Ordered common → experimental: Swiss first, Agentic last.
    ['fieldwork', 'swiss', 'agentic'],
    // Ordered storefront → data surface: Taquería first, agentic Melts last.
    ['mom-n-pops', 'tacos', 'grilledcheese'],
    // Apps 01–13 (batch one): Pulse first, Voyage last.
    ['dashboards', 'pulse', 'voyage'],
]);

it('renders the per-style page for every registered style in every collection', function (string $collection, string $id) {
    $this->get("/inspiration/{$collection}/{$id}")
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('Inspiration/Show')
            ->where('style.id', $id)
            ->where('style.collection', $collection)
            ->where('collection.id', $collection)
        );
})->with(collect(GalleryRegistry::collections())
    ->flatMap(fn (array $c) => array_map(
        fn (array $s) => [$c['id'], $s['id']],
        GalleryRegistry::styles($c['id']),
    ))->all());

it('serves the Swiss style — the first built gallery page', function () {
    $this->get('/inspiration/fieldwork/swiss')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('Inspiration/Show')
            ->where('style.id', 'swiss')
            ->where('style.num', '01')
            ->where('style.mode', 'light')
            ->where('style.name', 'Swiss / Minimal')
        );
});

it('301-redirects legacy pre-collection style urls to their collection', function (string $id, string $collection) {
    $this->get("/inspiration/{$id}")
        ->assertMovedPermanently()
        ->assertRedirect("/inspiration/{$collection}/{$id}");
})->with([
    ['swiss', 'fieldwork'],
    ['agentic', 'fieldwork'],
    ['tacos', 'mom-n-pops'],
]);

it('404s for an unknown collection and an unknown style', function () {
    $this->get('/inspiration/does-not-exist')->assertNotFound();
    $this->get('/inspiration/fieldwork/does-not-exist')->assertNotFound();
    $this->get('/inspiration/mom-n-pops/swiss')->assertNotFound();
});

it('keeps style ids unique across collections (legacy lookups depend on it)', function () {
    $ids = collect(GalleryRegistry::collections())
        ->flatMap(fn (array $c) => array_column(GalleryRegistry::styles($c['id']), 'id'));

    expect($ids->duplicates()->all())->toBe([]);
    // Collection slugs must never collide with style ids either — the
    // /inspiration/{collection} route resolves both.
    expect($ids->intersect(collect(GalleryRegistry::collections())->pluck('id'))->all())->toBe([]);
});

it('exposes the registry lookup api', function () {
    expect(GalleryRegistry::collections())->toHaveCount(3);
    expect(GalleryRegistry::styles('fieldwork'))->toHaveCount(20);
    expect(GalleryRegistry::styles('mom-n-pops'))->toHaveCount(20);
    expect(GalleryRegistry::find('fieldwork', 'swiss'))->toMatchArray(['id' => 'swiss', 'num' => '01', 'mode' => 'light', 'collection' => 'fieldwork']);
    expect(GalleryRegistry::find('mom-n-pops', 'tacos'))->toMatchArray(['id' => 'tacos', 'num' => '01', 'collection' => 'mom-n-pops']);
    expect(GalleryRegistry::find('fieldwork', 'tacos'))->toBeNull();
    expect(GalleryRegistry::findAnywhere('ramen'))->toMatchArray(['id' => 'ramen', 'collection' => 'mom-n-pops']);
    expect(GalleryRegistry::findAnywhere('nope'))->toBeNull();
    expect(GalleryRegistry::collection('nope'))->toBeNull();
});

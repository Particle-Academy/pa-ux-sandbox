<?php

use App\Support\GalleryRegistry;
use Tests\TestCase;

uses(TestCase::class);

it('lists all twenty gallery styles on /inspiration', function () {
    $this->get('/inspiration')
        ->assertOk()
        ->assertInertia(function ($page) {
            $page->component('Inspiration/Index');
            $styles = collect($page->toArray()['props']['styles']);

            expect($styles)->toHaveCount(20);
            $styles->each(function (array $s) {
                expect($s)->toHaveKeys(['id', 'num', 'name', 'note', 'mode', 'swatch']);
                expect($s['mode'])->toBeIn(['light', 'dark']);
            });

            // Ordered common → experimental: Swiss first, Agentic last.
            expect($styles->first()['id'])->toBe('swiss');
            expect($styles->last()['id'])->toBe('agentic');
        });
});

it('renders the per-style page for every registered style', function (string $id) {
    $this->get("/inspiration/{$id}")
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('Inspiration/Show')
            ->where('style.id', $id)
        );
})->with(array_map(fn (array $s) => $s['id'], GalleryRegistry::all()));

it('404s for an unknown style', function () {
    $this->get('/inspiration/does-not-exist')->assertNotFound();
});

it('exposes find() and all() on the registry', function () {
    expect(GalleryRegistry::all())->toHaveCount(20);
    expect(GalleryRegistry::find('swiss'))->toMatchArray(['id' => 'swiss', 'num' => '01', 'mode' => 'light']);
    expect(GalleryRegistry::find('nope'))->toBeNull();
});

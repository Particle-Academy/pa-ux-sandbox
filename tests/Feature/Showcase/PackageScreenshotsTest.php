<?php

use App\Support\PackageRegistry;
use App\Support\PackageScreenshots;
use Tests\TestCase;

uses(TestCase::class);

/*
 * Package pages show a real screenshot of the package at work, captured from
 * this showcase's own pages by `php artisan packages:screenshots`
 * (owner, 2026-11-16: /packages/fancy-heuristics had no visual at all).
 *
 * The map in PackageScreenshots is the one list. A file the map names but the
 * disk lacks is a page that silently loses its image, so it fails here.
 */

it('names only real, visible packages, each captured from a page on this site', function () {
    foreach (PackageScreenshots::all() as $slug => $shot) {
        expect(PackageRegistry::findAny($slug))->not->toBeNull("{$slug} is not in the registry")
            ->and(PackageRegistry::isHidden($slug))->toBeFalse("{$slug} is hidden")
            ->and($shot['from'])->toStartWith('/')
            ->and($shot['alt'])->not->toBe('');
    }
});

it('has a committed image for every package it names', function () {
    $missing = [];
    foreach (array_keys(PackageScreenshots::all()) as $slug) {
        if (! is_file(public_path(PackageScreenshots::relativePath($slug)))) {
            $missing[] = $slug;
        }
    }

    expect($missing)->toBe([], 'Run php artisan packages:screenshots '.implode(' ', $missing));
});

it('covers every UI package that has a live demo, plus the heuristics pair', function () {
    expect(array_keys(PackageScreenshots::all()))->toContain(
        'react-fancy', 'fancy-flow', 'fancy-sheets', 'fancy-pixel', 'fancy-heuristics', 'fancy-heuristics-js',
    );
});

it('puts the screenshot on the package page', function () {
    $html = $this->get('/packages/fancy-heuristics')->assertOk()->getContent();
    preg_match('#<script data-page="app" type="application/json">(.*?)</script>#s', $html, $page);
    $props = json_decode($page[1] ?? '{}', true)['props'] ?? [];

    expect($props['screenshot'] ?? null)->toBe([
        'src' => '/'.PackageScreenshots::relativePath('fancy-heuristics'),
        'alt' => PackageScreenshots::all()['fancy-heuristics']['alt'],
        'from' => PackageScreenshots::all()['fancy-heuristics']['from'],
    ]);
});

it('sends no screenshot for a package without one', function () {
    expect(PackageScreenshots::for('holy-sheet-py-does-not-exist'))->toBeNull();
});

it('renders the screenshot through react-fancy, not a hand-rolled img', function () {
    $show = (string) file_get_contents(resource_path('js/Pages/Packages/Show.tsx'));

    expect($show)->toContain('<ImageViewer')
        ->and($show)->toContain('data-package-screenshot');
});

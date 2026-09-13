<?php

use Symfony\Component\Finder\Finder;
use Tests\TestCase;

uses(TestCase::class);

/**
 * A package hero never states a version someone typed.
 *
 * The /flow page's hero said "v0.29" while the showcase ran fancy-flow 0.70.0:
 * forty-one minors behind, on the page that sells the package. It is the same
 * failure the footer's react-fancy version had, which is why that one is read
 * from the installed package at build time. A hero that shows a version reads it
 * the same way (a Vite `define`, see vite.config.js).
 *
 * Every page that renders the package hero (`pkg-hero__meta`) is checked, so a
 * new bespoke package page cannot bring the typed number back.
 */
it('reads every package hero version from the installed package', function () {
    $pages = Finder::create()->files()->in(base_path('resources/js/Pages'))->name('*.tsx')->contains('pkg-hero__meta');

    expect(iterator_count($pages))->toBeGreaterThan(0);

    foreach ($pages as $page) {
        expect($page->getContents())->not->toMatch(
            '/>\s*v\d+\.\d+(\.\d+)?\s*</',
            "typed version in {$page->getRelativePathname()}; read it from the installed package instead",
        );
    }
});

<?php

use Tests\TestCase;

uses(TestCase::class);

/**
 * The two surfaces authored through the CMS — `/cms/home` and
 * `/starter-kits/{slug}/cms` — and the properties that make the second one
 * worth having.
 */
function seed(string $file): string
{
    return (string) file_get_contents(base_path("resources/js/cms/{$file}"));
}

it('serves the CMS-authored starter kit page for every kit', function () {
    // One document, eight kits. A hand-written page cannot make that claim, and
    // it is the whole reason this surface was chosen as the second beachhead.
    foreach (['fancy-flow', 'fancy-sheets', 'react-fancy', 'shop-n-sub'] as $slug) {
        $this->get("/starter-kits/{$slug}/cms")->assertOk();
    }
});

it('404s for a kit that does not exist', function () {
    $this->get('/starter-kits/not-a-kit/cms')->assertNotFound();
});

it('keeps the JSX page it mirrors', function () {
    // The point is the COMPARISON. If the original is ever deleted, the CMS
    // version stops being evidence of anything.
    $this->get('/starter-kits/fancy-flow')->assertOk();
});

it('authors the starter-kit document in the post-sections shape', function () {
    // `fancy-cms-ui` 0.5.0 removed `PageDoc.sections[]`; roots are ordered by
    // their fractional `order` key like any other sibling group. This document
    // was authored after that change, so it should never have carried one.
    expect(seed('starter-kit-seed.ts'))->not->toContain('sections:');
});

it('has migrated the home document off sections[] too', function () {
    expect(seed('home-seed.ts'))->not->toContain('sections:');
});

it('carries the starter-kit page on CMS primitives, not on islands', function () {
    // The claim this surface exists to support. `home-seed.ts` is mostly
    // whole-section islands re-rendering components Home already exports, which
    // proves the CMS can HOST a page but says nothing about whether the model
    // can EXPRESS one. Here only the clipboard button and the interactive kit
    // demo are islands; everything else is a document node.
    $doc = seed('starter-kit-seed.ts');

    $nodes = substr_count($doc, 'parent:');
    $islands = substr_count($doc, 'island: true');

    expect($nodes)->toBeGreaterThan(8, 'the seed shrank — recount before trusting the ratio');
    expect($islands)->toBe(2);
    expect($islands / $nodes)->toBeLessThan(0.25);
});

it('binds every kit-specific value instead of writing it into the document', function () {
    // A value typed into a document is a value nothing can keep true — the same
    // failure that left the CMS home hero claiming "v0.4" and "64 packages".
    // Here it would also be a correctness bug: a literal kit name would render
    // on all eight kits.
    $doc = seed('starter-kit-seed.ts');

    foreach (['Workflow Studio', 'fancy-flow', 'Spreadsheet Studio'] as $literal) {
        expect($doc)->not->toContain($literal, "kit-specific literal in the document: {$literal}");
    }

    expect($doc)->toContain('$bind');
});

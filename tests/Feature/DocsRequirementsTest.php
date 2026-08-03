<?php

use App\Support\Docs\DocsRegistry;
use Tests\TestCase;

uses(TestCase::class);

it('renders the minimum requirements docs page', function () {
    $this->get('/docs/requirements')
        ->assertOk()
        ->assertSee('Minimum requirements', false)
        ->assertSee('Supported browsers', false);
});

it('serves it as a clean markdown variant', function () {
    $res = $this->get('/docs/requirements.md');

    $res->assertOk();
    expect($res->headers->get('Content-Type'))->toContain('text/markdown');
});

it('is registered in the docs sidebar', function () {
    $slugs = collect(DocsRegistry::flat())->pluck('slug');

    expect($slugs)->toContain('requirements');
});

/**
 * The floors are the point of the page, so a version silently dropping out of
 * the table is the failure worth catching. Each number is set by a specific
 * dependency — see the page — and changing one means changing that dependency,
 * not editing prose.
 */
it('states the browser floor every supported engine is held to', function () {
    $markdown = file_get_contents(base_path('resources/docs/requirements.md'));

    expect($markdown)
        ->toContain('**Chrome** | 111')       // Vite baseline target + color-mix()
        ->toContain('**Firefox** | 128')      // Tailwind v4 — @property landed here
        ->toContain('16.4');                  // Safari, macOS + iOS
});

it('links minimum requirements from the site footer', function () {
    $layout = file_get_contents(base_path('resources/js/Pages/Layout.tsx'));

    expect($layout)->toContain('/docs/requirements');
});

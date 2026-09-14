<?php

use App\Mcp\Tools\SearchBackendPackages;
use App\Support\PackageContext;
use Laravel\Mcp\Request;
use Tests\TestCase;

uses(TestCase::class);

/**
 * Prism lists as one family, and a search for what a Prism package DOES finds it.
 *
 * The nine Prism packages were registered (see PrismFamilyIsCompleteTest) but in
 * no family, so none carried a capability label. Search matched their slug, name
 * and tagline only: "llm harness" missed prism-harness because its tagline never
 * says "LLM". That is the query an agent types, and a miss reads as "Fancy has no
 * harness", which is how a third-party library gets proposed instead.
 *
 * The family is also a public section of /packages (owner-approved 2026-09-13).
 */
const PRISM_MEMBERS = [
    'prism', 'prism-harness', 'prism-human-plus', 'prism-mcp', 'prism-opentelemetry',
    'prism-perplexity', 'prism-workspace', 'prism-memory', 'prism-browser',
];

function prismBackendSearch(string $query): array
{
    $response = app(SearchBackendPackages::class)->handle(new Request(['query' => $query, 'stack' => 'php']));
    $body = json_decode($response->content()->toArray()['text'] ?? '{}', true) ?? [];

    return collect($body['packages'] ?? [])->pluck('name')->all();
}

it('finds a Prism package by what it does, not only by words in its tagline', function (string $query, string $package) {
    expect(prismBackendSearch($query))->toContain($package);
})->with([
    // Every query below failed before the family existed: none of its words sit
    // in the package's slug, name or tagline all at once. A query that already
    // matched a tagline ("agent browser automation") proved nothing and was cut.
    'an LLM harness' => ['llm harness', 'particle-academy/prism-harness'],
    'an MCP client' => ['mcp client', 'particle-academy/prism-mcp'],
    'LLM tracing' => ['llm tracing', 'particle-academy/prism-opentelemetry'],
    'web browsing for an agent' => ['web browsing', 'particle-academy/prism-browser'],
    'an agent sandbox' => ['agent sandbox filesystem', 'particle-academy/prism-workspace'],
    'a vector store' => ['vector store', 'particle-academy/prism-memory'],
]);

it('lists Prism as one family card in Platform', function () {
    $this->get('/packages')
        ->assertOk()
        ->assertInertia(function ($page) {
            $pkgs = collect($page->toArray()['props']['packages']);

            $prism = $pkgs->firstWhere('slug', 'prism');
            expect($prism)->not->toBeNull();
            expect($prism['family'])->toBeTrue();
            expect($prism['member_count'])->toBe(count(PRISM_MEMBERS));
            expect($prism['group'])->toBe('platform');

            foreach (array_diff(PRISM_MEMBERS, ['prism']) as $member) {
                expect($pkgs->pluck('slug'))->not->toContain($member);
            }
        });
});

it('renders the family page with every member linked to its own page', function () {
    $this->get('/packages/family/prism')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('Packages/Family')
            ->where('family.slug', 'prism')
            ->where('family.sections', function ($sections) {
                $members = collect($sections)->flatMap(fn ($s) => $s['members']);
                expect($members->pluck('slug')->sort()->values()->all())->toBe(collect(PRISM_MEMBERS)->sort()->values()->all());

                // Each has curated context, so each keeps a page and the family links to it.
                expect($members->pluck('href')->filter()->count())->toBe(count(PRISM_MEMBERS));

                return true;
            })
        );
});

it('keeps a Prism member page that has curated context, rather than folding it into the family', function () {
    // None of the nine ships a README the registry can read, and none has
    // component demos. Their curated context is the page. A member with neither
    // used to 301 to the family, so joining a family would have silently removed
    // nine pages of content.
    foreach (PRISM_MEMBERS as $slug) {
        expect(PackageContext::find($slug))->not->toBeNull();

        $this->get("/packages/{$slug}")
            ->assertOk()
            ->assertInertia(fn ($page) => $page->component('Packages/Show')->whereNot('context', null));
    }
});

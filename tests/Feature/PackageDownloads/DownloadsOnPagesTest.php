<?php

use App\Models\PackageDownload;
use Tests\TestCase;

uses(TestCase::class);

/**
 * The pages carry the counts as props; the React side formats and renders them
 * (covered in tests/js/package-downloads.test.tsx). `null` is the absent state:
 * a package nobody has measured must not read as one nobody downloads.
 */
beforeEach(function () {
    PackageDownload::create([
        'slug' => 'holy-sheet', 'source' => 'packagist', 'name' => 'particle-academy/holy-sheet',
        'monthly' => 1_234, 'total' => 9_876, 'fetched_at' => now(),
    ]);
    PackageDownload::create([
        'slug' => 'react-fancy', 'source' => 'npm', 'name' => '@particle-academy/react-fancy',
        'monthly' => 28_700, 'total' => 120_000, 'fetched_at' => now(),
    ]);
});

it('puts downloads on the package page', function () {
    $this->get('/packages/holy-sheet')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('Packages/Show')
            ->where('downloads', ['monthly' => 1_234, 'total' => 9_876]));
});

it('sends null downloads to a package page with no data', function () {
    $this->get('/packages/dark-slide')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('Packages/Show')
            ->where('downloads', null));
});

it('puts downloads on each /packages listing, summing a family', function () {
    PackageDownload::create([
        'slug' => 'fancy-inertia', 'source' => 'npm', 'name' => '@particle-academy/fancy-inertia',
        'monthly' => 300, 'total' => 1_000, 'fetched_at' => now(),
    ]);

    $this->get('/packages')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('Packages/Index')
            ->where('packages', function ($packages) {
                $bySlug = collect($packages)->keyBy('slug');

                // react-fancy + fancy-inertia are both members of Fancy Core.
                return $bySlug['fancy-core']['downloads'] === ['monthly' => 29_000, 'total' => 121_000]
                    && collect($bySlug['fancy-core']['members'])->firstWhere('slug', 'react-fancy')['downloads']
                        === ['monthly' => 28_700, 'total' => 120_000];
            }));
});

it('sends null for a listing with no data', function () {
    $this->get('/packages')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->where('packages', fn ($packages) => collect($packages)
                ->every(fn (array $p) => array_key_exists('downloads', $p))
                && collect($packages)->contains(fn (array $p) => $p['downloads'] === null)));
});

it('puts downloads on a family page member', function () {
    $this->get('/packages/family/fancy-core')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('Packages/Family')
            ->where('family.downloads', ['monthly' => 28_700, 'total' => 120_000]));
});

it('puts the kit-wide monthly total on the home page', function () {
    $this->get('/')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('Home')
            ->where('downloads_this_month', 29_934));
});

it('sends a null kit total to the home page before anything is measured', function () {
    PackageDownload::query()->delete();

    $this->get('/')
        ->assertOk()
        ->assertInertia(fn ($page) => $page->where('downloads_this_month', null));
});

it('never labels the counts as users', function () {
    foreach (['resources/js/Pages/Packages/Downloads.tsx', 'resources/js/Pages/Home.tsx'] as $file) {
        $src = (string) file_get_contents(base_path($file));
        expect($src)->not->toMatch('/\b\d*\s*users this month|active users|\busers\b.{0,20}download/i');
    }
    expect((string) file_get_contents(base_path('resources/js/Pages/Packages/Downloads.tsx')))
        ->toContain('downloads');
});

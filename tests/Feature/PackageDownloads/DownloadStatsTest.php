<?php

use App\Models\PackageDownload;
use App\Support\Downloads\DownloadStats;
use Tests\TestCase;

uses(TestCase::class);

/** @param array<string, mixed> $attrs */
function downloadRow(string $slug, string $source, array $attrs): PackageDownload
{
    return PackageDownload::create([
        'slug' => $slug,
        'source' => $source,
        'name' => "{$source}:{$slug}",
        'fetched_at' => now(),
    ] + $attrs);
}

it('returns null for a package with no counts at all', function () {
    expect(DownloadStats::forPackage('react-fancy'))->toBeNull();
});

it('returns null when the only row is a failure that never measured anything', function () {
    PackageDownload::create([
        'slug' => 'react-fancy', 'source' => 'npm', 'name' => '@particle-academy/react-fancy',
        'last_error' => 'HTTP 404', 'consecutive_failures' => 1,
    ]);

    expect(DownloadStats::forPackage('react-fancy'))->toBeNull()
        ->and(DownloadStats::kitMonthly())->toBeNull();
});

it('reports one source as-is', function () {
    downloadRow('react-fancy', 'npm', ['monthly' => 28_700, 'weekly' => 6_000, 'total' => 120_000]);

    expect(DownloadStats::forPackage('react-fancy'))->toBe(['monthly' => 28_700, 'total' => 120_000]);
});

it('sums every ecosystem a package publishes to', function () {
    downloadRow('fancy-template', 'npm', ['monthly' => 100, 'total' => 1_000]);
    downloadRow('fancy-template', 'packagist', ['monthly' => 50, 'total' => 400]);

    expect(DownloadStats::forPackage('fancy-template'))->toBe(['monthly' => 150, 'total' => 1_400]);
});

it('drops the all-time total when any measured source has none, rather than undercount it', function () {
    downloadRow('fancy-template', 'npm', ['monthly' => 100, 'total' => 1_000]);
    downloadRow('fancy-template', 'pypi', ['monthly' => 7]);

    expect(DownloadStats::forPackage('fancy-template'))->toBe(['monthly' => 107, 'total' => null]);
});

it('sums a family across its members', function () {
    downloadRow('fancy-git', 'packagist', ['monthly' => 10, 'total' => 90]);
    downloadRow('fancy-git-js', 'npm', ['monthly' => 5, 'total' => 20]);

    expect(DownloadStats::forPackages(['fancy-git', 'fancy-git-js', 'fancy-git-ui']))
        ->toBe(['monthly' => 15, 'total' => 110]);
});

it('totals the kit for the month over every published package, ignoring retired slugs', function () {
    downloadRow('react-fancy', 'npm', ['monthly' => 1_000]);
    downloadRow('holy-sheet', 'packagist', ['monthly' => 200]);
    downloadRow('holy-sheet-py', 'pypi', ['monthly' => 30]);
    // A slug no longer in the registry, or hidden, is not part of the kit.
    downloadRow('long-gone-package', 'npm', ['monthly' => 999_999]);
    downloadRow('fancy-sockets', 'npm', ['monthly' => 888_888]);

    expect(DownloadStats::kitMonthly())->toBe(1_230);
});

it('returns null for the kit total when nothing has been measured', function () {
    expect(DownloadStats::kitMonthly())->toBeNull();
});

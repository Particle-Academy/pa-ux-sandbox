<?php

use App\Support\PackageRegistry;
use App\Support\Registry\TuiPreviewSource;
use Illuminate\Support\Facades\File;
use Tests\TestCase;

uses(TestCase::class);

/**
 * fancy-tui's captured frames, sourced the same way READMEs are.
 *
 * The frames come from fancy-tui's own `npm run showcase` harness — real Ink
 * renders, captured. Previews here are never hand-authored ANSI: hand-drawn
 * frames drift from the component the moment either changes, and nothing
 * notices.
 */
it('reads the harness output from the package repo', function () {
    $frames = (new TuiPreviewSource)->all();

    expect($frames)->not->toBeEmpty();
    expect($frames)->toHaveKey('hero');
    expect($frames['hero']['frame'])->toBeString()->not->toBe('');
})->skip(fn () => (new TuiPreviewSource)->fromRepo() === null, 'needs the sibling repos');

it('covers every component the package lists', function () {
    // A frame missing for a listed component is a placeholder tile nobody
    // notices — the state this whole path exists to leave behind.
    $source = new TuiPreviewSource;
    $package = PackageRegistry::findAny('fancy-tui');

    $missing = collect($package['components'] ?? [])
        ->pluck('slug')
        ->reject(fn (string $slug) => $source->forComponent($slug) !== null)
        ->values()
        ->all();

    expect($missing)->toBe([]);
})->skip(fn () => (new TuiPreviewSource)->all() === [], 'needs the frames');

it('falls back to the compiled artifact, which is all production has', function () {
    expect(File::exists(TuiPreviewSource::compiledPath()))->toBeTrue();

    $compiled = json_decode(File::get(TuiPreviewSource::compiledPath()), true)['components'] ?? [];

    expect(count($compiled))->toBeGreaterThan(50);
});

it('drops the source JSX from the payload', function () {
    // `source` is what produced the frame — useful on a detail page, pure
    // weight repeated 52 times in a listing.
    $indexed = (new TuiPreviewSource)->index([
        ['slug' => 'x', 'frame' => 'F', 'columns' => 68, 'name' => 'X', 'group' => 'G', 'source' => '<Huge />'],
    ]);

    expect($indexed['x'])->toBe(['frame' => 'F', 'columns' => 68, 'name' => 'X', 'group' => 'G']);
});

it('skips an entry the harness produced no frame for', function () {
    expect((new TuiPreviewSource)->index([['slug' => 'x', 'name' => 'X']]))->toBe([]);
});

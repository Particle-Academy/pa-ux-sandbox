<?php

use App\Services\Showcase\FancyPixelDetector;
use Tests\TestCase;

uses(TestCase::class);

/**
 * The badge wordmark was renamed on 2026-11-15 (owner ruling q_4b32212d): the
 * pixel now says "Powered by Fancy". Customer sites already carry the old
 * "Powered by Fancy UI", so BOTH must verify through the transition. Mirrors
 * fancy-heuristics' PixelDetectorTest, whose detector this one must match.
 */
it('reads the badge wordmark under either name', function (string $html, bool $expected) {
    expect((new FancyPixelDetector)->detect($html))->toBe($expected);
})->with([
    'old wordmark' => ['<footer>Powered by Fancy UI</footer>', true],
    'old wordmark spaced/cased' => ['POWERED   by   fancy   ui', true],
    'old wordmark mid-sentence' => ['Powered by Fancy UI and friends', true],
    'new wordmark' => ['<footer>Powered by Fancy</footer>', true],
    'new wordmark at end of text' => ['Powered by Fancy', true],
    'new wordmark with punctuation' => ['Powered by Fancy.', true],
    'some other Fancy brand' => ['Powered by Fancy Feast', false],
    'a longer word' => ['Powered by Fancypants', false],
    'a hyphenated name' => ['Powered by Fancy-Cats', false],
    'unrelated html' => ['<div>nothing here</div>', false],
]);

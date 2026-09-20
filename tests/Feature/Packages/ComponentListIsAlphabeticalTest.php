<?php

use App\Support\PackageRegistry;
use Tests\TestCase;

uses(TestCase::class);

/**
 * The component grid is browsed by eye, so its order is a feature.
 *
 * The list is a hand-written literal. It drifted the moment a rename moved one
 * entry -- the Action -> Button rename left `Button` sitting THIRD, ahead of
 * `Autocomplete` and `Avatar` -- and nothing reported it, because a
 * hand-ordered list has nothing in it that can notice.
 *
 * `componentsForReactFancy()` now sorts before returning. This asserts the sort
 * is still there: delete it and the literal's own order comes back, which is
 * not alphabetical and has not been for some time.
 */
it('lists react-fancy components in alphabetical order', function (): void {
    $names = array_column(PackageRegistry::definitionFor('react-fancy')['components'], 'name');

    expect($names)->not->toBeEmpty();

    $sorted = $names;
    usort($sorted, 'strcasecmp');

    expect($names)->toBe($sorted);
});

/**
 * Case-insensitively, and stated separately so a failure says WHICH rule broke.
 * `strcasecmp` is the comparison the registry uses; a plain `sort()` would put
 * every capitalised name ahead of every lowercase one, which is not what a
 * reader means by alphabetical.
 */
it('orders case-insensitively rather than by byte value', function (): void {
    $names = array_column(PackageRegistry::definitionFor('react-fancy')['components'], 'name');
    $lower = array_map('strtolower', $names);
    $sortedLower = $lower;
    sort($sortedLower);

    expect($lower)->toBe($sortedLower);
});

<?php

declare(strict_types=1);

use App\Support\DogfoodCheck;
use Illuminate\Contracts\Console\Kernel;
use Tests\TestCase;

uses(TestCase::class);

/**
 * The showcase must run the latest release of every first-party package —
 * it is part of the kit's end-to-end suite, and a suite on stale versions is
 * green about code consumers never receive.
 *
 * The comparison is tested here, offline. The command that fetches versions is
 * exercised separately; what matters most is that this logic cannot report a
 * pass it did not earn.
 */
it('reports a package that is behind', function () {
    $result = DogfoodCheck::compare(
        ['particle-academy/holy-sheet' => 'v1.3.0'],
        ['particle-academy/holy-sheet' => 'v2.0.1'],
    );

    expect($result['behind'])->toBe(['particle-academy/holy-sheet' => ['1.3.0', '2.0.1']]);
    expect(DogfoodCheck::passes($result))->toBeFalse();
});

it('treats v-prefixed and bare versions as the same release', function () {
    // Packagist says `v2.0.1`, npm says `2.0.1`. Comparing them literally would
    // report every Composer package as behind, forever — and a check that cries
    // wolf is one people turn off.
    $result = DogfoodCheck::compare(
        ['particle-academy/holy-sheet' => 'v2.0.1', '@particle-academy/react-fancy' => '5.17.0'],
        ['particle-academy/holy-sheet' => '2.0.1', '@particle-academy/react-fancy' => 'v5.17.0'],
    );

    expect($result['behind'])->toBe([]);
    expect(DogfoodCheck::passes($result))->toBeTrue();
});

it('FAILS when a lookup failed, rather than counting it as current', function () {
    // The fail-open this exists to prevent. Sweeping these versions by hand,
    // the first script reported "all at latest" because a registry call
    // returned a shape it did not handle — every comparison skipped, and the
    // empty result read as a clean sweep. Eleven packages were behind.
    $result = DogfoodCheck::compare(
        ['particle-academy/holy-sheet' => 'v2.0.1', 'particle-academy/fancy-seo' => 'v0.5.0'],
        ['particle-academy/holy-sheet' => 'v2.0.1', 'particle-academy/fancy-seo' => null],
    );

    expect($result['behind'])->toBe([]);
    expect($result['unchecked'])->toBe(['particle-academy/fancy-seo']);
    // Nothing was behind, and it still does not pass. A check that cannot see
    // is not a check that agrees.
    expect(DogfoodCheck::passes($result))->toBeFalse();
});

it('treats an empty-string version as a failed lookup too', function () {
    $result = DogfoodCheck::compare(['a' => '1.0.0'], ['a' => '']);

    expect($result['unchecked'])->toBe(['a']);
    expect(DogfoodCheck::passes($result))->toBeFalse();
});

it('passes only when every package was checked and every one is current', function () {
    $result = DogfoodCheck::compare(
        ['a' => '1.0.0', 'b' => 'v2.3.4'],
        ['a' => '1.0.0', 'b' => '2.3.4'],
    );

    expect(DogfoodCheck::passes($result))->toBeTrue();
});

it('registers the command, so the rule has something to run', function () {
    // The rule is "after any package ships, the sandbox takes it". A rule with
    // no runnable check is a note, and notes drift -- this app had thirteen
    // packages behind while the rule was already written down.
    expect(array_key_exists('kit:dogfood', app(Kernel::class)->all()))->toBeTrue();
});

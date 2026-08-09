<?php

use Tests\TestCase;

uses(TestCase::class);

/**
 * The Inspiration Gallery exists to demo the kit, so a style that hand-rolls a
 * primitive react-fancy already ships is the gallery arguing against its own
 * point. It is also how the gap list gets lost: a hand-rolled widget looks
 * finished, so nobody files it, and the primitive never gets built — or, as
 * here, gets built and then never adopted.
 *
 * `<Marquee>` shipped in react-fancy and eight styles kept their own copy for
 * months. This test is the thing that would have said so.
 */
function galleryCss(): array
{
    return glob(base_path('resources/js/Pages/Inspiration/styles/*/*.css')) ?: [];
}

it('finds gallery stylesheets to check', function () {
    // Without this, every assertion below passes on an empty list.
    expect(galleryCss())->not->toBeEmpty();
});

it('leaves marquee scrolling to the react-fancy primitive', function () {
    // `kinetic` is the one allowed exception, and it is documented in the file:
    // its ticker offsets by scroll velocity through the same `transform` the
    // primitive owns, so it cannot go through <Marquee>. Its hero and clients
    // marquees DO use the primitive.
    $allowed = ['kinetic.css'];
    $offenders = [];

    foreach (galleryCss() as $file) {
        if (in_array(basename($file), $allowed, true)) {
            continue;
        }

        if (preg_match('/@keyframes\s+[a-z0-9-]*(marquee|ticker)/i', (string) file_get_contents($file), $m)) {
            $offenders[] = basename($file).' → '.$m[0];
        }
    }

    expect($offenders)->toBe([], 'hand-rolled marquee keyframes — use <Marquee> from react-fancy');
});

it('still has the styles that were converted', function () {
    // Guards the guard: if these files were renamed or deleted, the check above
    // would pass by having nothing left to find.
    foreach (['gradient', 'neobrutal', 'retro', 'broken', 'bigtype', 'cobrowse', 'cursor', 'dark'] as $style) {
        expect(file_exists(base_path("resources/js/Pages/Inspiration/styles/fieldwork/{$style}.tsx")))
            ->toBeTrue("{$style}.tsx is gone");
    }
});

it('imports Marquee in every style that renders one', function () {
    $converted = ['gradient', 'neobrutal', 'retro', 'broken', 'bigtype', 'cobrowse', 'cursor', 'dark'];

    foreach ($converted as $style) {
        $src = (string) file_get_contents(base_path("resources/js/Pages/Inspiration/styles/fieldwork/{$style}.tsx"));

        // NOT `toContain($needle, $message)` — Pest treats every argument as
        // another needle, so the message becomes a second thing to search for
        // and the assertion always fails.
        expect(str_contains($src, 'Marquee'))->toBeTrue("{$style} no longer renders a Marquee");
        expect(str_contains($src, '@particle-academy/react-fancy'))->toBeTrue("{$style} lost its react-fancy import");
    }
});

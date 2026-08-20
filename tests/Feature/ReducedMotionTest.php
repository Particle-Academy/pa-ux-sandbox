<?php

declare(strict_types=1);

use Tests\TestCase;

uses(TestCase::class);

/**
 * `prefers-reduced-motion` coverage across the showcase stylesheets.
 *
 * Motion is not decoration for everyone — `prefers-reduced-motion: reduce` is
 * an assistive setting, and an animation that ignores it causes real symptoms.
 * Every animation the showcase runs must therefore have a reduced treatment.
 *
 * ASSERTED AGAINST THE STYLESHEET SOURCE, deliberately. A rendered check would
 * need a browser honouring the media query, which nothing in CI does, and the
 * precedent is already set: `fancy-diff` asserts its `white-space` rules out of
 * `styles.css` for the same reason. A media-query guard is a property of the
 * source, so the source is the honest thing to read.
 *
 * WHY THIS IS A SWEEP AND NOT A CHECK ON ONE RULE: when this was written,
 * `.pf-fade` (the profile card entrance) was the reported defect, but the same
 * gap existed on `.mp-caret` in packages.css and on FOUR of landing.css's five
 * animations — that file had a guard covering exactly one of them, which is
 * the shape of a fix that looks finished. A test that named `.pf-fade` would
 * have closed the instance and left the class open, so this enumerates instead.
 */

/**
 * EVERY stylesheet this app ships, resolved fresh so a new file is covered
 * automatically and a new animation cannot arrive unnoticed.
 *
 * Deliberately not limited to `css/showcase/` — the reported defect lived
 * there, but `analytics.css` and `showcase.css` sit one level up and had the
 * same gap. Scoping this to the directory would have closed the instance and
 * left the class open.
 *
 * @return list<string>
 */
function appStylesheets(): array
{
    $sheets = glob(resource_path('css/*.css')) ?: [];

    foreach (['css/showcase/*.css', 'css/showcase/**/*.css'] as $pattern) {
        $sheets = array_merge($sheets, glob(resource_path($pattern)) ?: []);
    }

    sort($sheets);

    return array_values(array_unique($sheets));
}

/** Strip comments so commented-out CSS never counts as a declaration or a guard. */
function withoutCssComments(string $css): string
{
    return (string) preg_replace('~/\*.*?\*/~s', '', $css);
}

/**
 * Split a stylesheet into the text inside `prefers-reduced-motion: reduce`
 * blocks and the text outside them, matching braces so a nested rule does not
 * end the block early.
 *
 * @return array{guarded: string, unguarded: string}
 */
function splitOnReducedMotion(string $css): array
{
    $guarded = '';
    $unguarded = '';
    $offset = 0;

    while (preg_match('/@media[^{]*prefers-reduced-motion\s*:\s*reduce[^{]*\{/i', $css, $m, PREG_OFFSET_CAPTURE, $offset)) {
        $blockStart = $m[0][1];
        $cursor = $blockStart + strlen($m[0][0]);
        $depth = 1;

        while ($cursor < strlen($css) && $depth > 0) {
            if ($css[$cursor] === '{') {
                $depth++;
            } elseif ($css[$cursor] === '}') {
                $depth--;
            }
            $cursor++;
        }

        $unguarded .= substr($css, $offset, $blockStart - $offset);
        $guarded .= substr($css, $blockStart, $cursor - $blockStart);
        $offset = $cursor;
    }

    $unguarded .= substr($css, $offset);

    return ['guarded' => $guarded, 'unguarded' => $unguarded];
}

/**
 * Every selector that starts an animation outside a reduced-motion guard,
 * paired with the keyframes name it runs.
 *
 * Both are needed because there are two legitimate treatments and they look
 * nothing alike: switching the animation off by SELECTOR
 * (`.pf-fade { animation: none }`), or redefining its KEYFRAMES so the motion
 * flattens while the timing survives — which is what a timed auto-dismiss
 * needs. Checking only for the selector would report the second as unguarded.
 *
 * `animation: none` is skipped — it stops motion rather than starting it.
 * `@keyframes` bodies cannot match, since their `from`/`to` rules contain no
 * `animation` declaration.
 *
 * @return list<array{selector: string, name: string}>
 */
function animatedSelectors(string $unguardedCss): array
{
    $found = [];

    // selector { … animation[-name]: <something other than none> … }
    $pattern = '/(?<selector>[^{}@;]+)\{(?<body>[^{}]*)\}/s';

    if (! preg_match_all($pattern, $unguardedCss, $matches, PREG_SET_ORDER)) {
        return [];
    }

    foreach ($matches as $rule) {
        if (! preg_match('/(?:^|[;\s])animation(?:-name)?\s*:\s*(?<value>[^;}]+)/i', $rule['body'], $decl)) {
            continue;
        }

        if (preg_match('/^\s*none\b/i', $decl['value'])) {
            continue;
        }

        $selector = trim(preg_replace('/\s+/', ' ', $rule['selector']) ?? '');

        // A keyframe stop ("from", "to", "50%", "0%, 100%") is not a selector.
        if ($selector === '' || preg_match('/^(from|to|[\d.]+%)(\s*,\s*(from|to|[\d.]+%))*$/i', $selector)) {
            continue;
        }

        // First identifier in the shorthand that is not a time/easing/keyword
        // is the keyframes name — good enough for the shapes this repo writes.
        $name = '';
        foreach (preg_split('/\s+/', trim($decl['value'])) ?: [] as $token) {
            if (preg_match('/^[A-Za-z_][\w-]*$/', $token)
                && ! preg_match('/^(infinite|alternate|reverse|both|forwards|backwards|none|linear|ease|ease-in|ease-out|ease-in-out|normal|paused|running|steps|cubic-bezier)$/i', $token)) {
                $name = $token;
                break;
            }
        }

        $found[$selector] = ['selector' => $selector, 'name' => $name];
    }

    return array_values($found);
}

it('gives every animation a reduced-motion treatment', function () {
    $sheets = appStylesheets();
    expect($sheets)->not->toBeEmpty('no stylesheets were found — the glob is wrong');

    $unprotected = [];

    foreach ($sheets as $path) {
        $css = withoutCssComments((string) file_get_contents($path));
        ['guarded' => $guarded, 'unguarded' => $unguarded] = splitOnReducedMotion($css);

        foreach (animatedSelectors($unguarded) as $animated) {
            $stoppedBySelector = str_contains($guarded, $animated['selector']);
            $flattenedByKeyframes = $animated['name'] !== ''
                && preg_match('/@keyframes\s+'.preg_quote($animated['name'], '/').'\s*\{/', $guarded) === 1;

            if (! $stoppedBySelector && ! $flattenedByKeyframes) {
                $unprotected[] = basename($path).'  ->  '.$animated['selector']
                    .($animated['name'] !== '' ? "  (runs `{$animated['name']}`)" : '');
            }
        }
    }

    expect($unprotected)->toBe([], sprintf(
        "these rules animate with no `prefers-reduced-motion: reduce` treatment:\n  %s\n\n".
        'Add a guard in the same file that either sets `animation: none` on the selector, or redefines '.
        'its keyframes without movement. The reduced path must still END at the same rendered state.',
        implode("\n  ", $unprotected),
    ));
});

/**
 * The one animation that must NOT simply be switched off.
 *
 * `.active-user-pill` is a timed auto-dismiss: it rises, holds, then fades to
 * `opacity: 0` at 100% with `forwards`. Ending invisible is the POINT. So the
 * two obvious reduced-motion moves are both wrong here — `animation: none`
 * leaves the pill on screen forever, and the popular global
 * `animation-duration: 0.01ms !important` reset makes it vanish before it can
 * be read. Its guard keeps the duration and the fade, and drops only the
 * travel, which is why this file must never grow that blanket reset.
 */
it('keeps the auto-dismiss pill timed rather than switching it off', function () {
    $css = withoutCssComments((string) file_get_contents(resource_path('css/showcase/landing.css')));
    ['guarded' => $guarded] = splitOnReducedMotion($css);

    expect(str_contains($guarded, 'active-user-rise'))->toBeTrue(
        'the presence pill lost its bespoke reduced-motion keyframes',
    );

    // It must still reach opacity 0 under reduce, or it never dismisses.
    expect($guarded)->toMatch('/@keyframes\s+active-user-rise\s*\{.*?100%\s*\{[^}]*opacity:\s*0/s',
        'the reduced-motion keyframes no longer fade the pill out, so it would never dismiss',
    );
});

it('never neutralises motion with a blanket duration reset', function () {
    foreach (appStylesheets() as $path) {
        $css = withoutCssComments((string) file_get_contents($path));

        expect($css)->not->toMatch('/animation-duration\s*:\s*0(\.\d+)?m?s\s*!important/i', sprintf(
            '%s neutralises motion with a blanket `animation-duration` reset. That snaps every animation to '.
            'its END state, which for a timed auto-dismiss (see .active-user-pill) means it disappears before '.
            'it can be read. Guard animations individually.',
            basename($path),
        ));
    }
});

<?php

declare(strict_types=1);

use Tests\TestCase;

uses(TestCase::class);

/**
 * Accessibility of the GAMIFIED surfaces — WCAG 2.2 as it applies to status,
 * rank and progress UI.
 *
 * Gamification adds exactly the things that break assistive tech: status
 * expressed as colour, rapidly-changing values, motion, timers and dense
 * dashboards. The rules that matter here:
 *
 *  - **Never colour as the ONLY signal** for rank, tier or rarity.
 *  - **State must be programmatically determinable** (WCAG 4.1.2). A selected
 *    tab or toggle that is only tinted is, to a screen reader, not selected.
 *  - **Rank and status must reach assistive tech**, not just the eye.
 *
 * These are asserted against the SERVER-RENDERED HTML, which is what a crawler
 * and an assistive technology both receive first.
 *
 * The failure this file was written for: `/leaderboard`'s scope switcher was a
 * hand-rolled group of `<button>`s whose selected state was a background colour
 * and nothing else — no `aria-pressed`, no `aria-current`, no radio semantics.
 * A screen-reader user heard "Players, button. Contributors, button." and could
 * not tell which was active. react-fancy ships `MultiSwitch` for this exact
 * control, with `role="radiogroup"` / `role="radio"` / `aria-checked` — so the
 * accessibility gap and the Fancy Exclusive violation were the same defect.
 */
/**
 * NOTE ON METHOD: every assertion in this file reads SOURCE, not rendered HTML.
 *
 * `phpunit.xml` sets `INERTIA_SSR_ENABLED=false`, so a PHP feature test receives
 * the Blade shell with an EMPTY `<div id="app">` — no React output whatsoever.
 * An assertion here about component markup does not fail when the component is
 * wrong; it fails always, or passes vacuously against a page that rendered
 * nothing. (The use-case `<title>` tests work only because the title comes from
 * the fancy-seo Blade baseline, which is server-side.)
 *
 * The rendered result is verified in a browser instead.
 */
it('exposes which scope is selected on the leaderboard, not just its colour', function () {
    $source = file_get_contents(resource_path('js/Pages/Leaderboard.tsx'));

    // Selection must be programmatically determinable (WCAG 4.1.2), not a tint.
    $hasState = str_contains($source, 'aria-checked')
        || str_contains($source, 'aria-pressed')
        || str_contains($source, 'aria-selected')
        || str_contains($source, 'aria-current');

    expect($hasState)->toBeTrue(
        'the leaderboard scope switcher conveys its selected state with colour alone — '
        .'a screen reader cannot tell which scope is active',
    );

    // And the group needs a name, or it is announced as an unlabelled "group".
    expect(str_contains($source, 'aria-label'))->toBeTrue(
        'the switcher groups are unnamed for assistive tech',
    );

    // Visible keyboard focus (WCAG 2.4.7) — the tint is invisible when tabbing.
    expect(str_contains($source, 'focus-visible:'))->toBeTrue(
        'the switcher has no visible keyboard focus style',
    );
});

/**
 * The next two assert the SOURCE contract rather than rendered output, and the
 * reason is worth recording: `/leaderboard` renders empty without seeded
 * players — live and in tests — so a rendered-HTML assertion here passes or
 * fails on whether the database happens to have data, which is not what is
 * being tested. The contract survives an empty page.
 */
it('does not rank players by colour alone', function () {
    $source = file_get_contents(resource_path('js/Pages/Leaderboard.tsx'));

    // The podium tints 1st/2nd/3rd. That is fine ONLY because the rank is also
    // spelled out and carries an icon; a medal colour is meaningless to anyone
    // who cannot see it.
    foreach (['"1st"', '"2nd"', '"3rd"'] as $label) {
        expect(str_contains($source, $label))->toBeTrue(
            "the podium no longer spells out rank {$label}, leaving colour as the only signal",
        );
    }
});

it('gives the leaderboard table real column headers', function () {
    // `Table.Column label=` renders a <th>. A rank table without them is a grid
    // of numbers to assistive tech.
    $source = file_get_contents(resource_path('js/Pages/Leaderboard.tsx'));

    expect(str_contains($source, 'Table.Column'))->toBeTrue(
        'the leaderboard table no longer declares columns, so it renders without <th> headers',
    );
});

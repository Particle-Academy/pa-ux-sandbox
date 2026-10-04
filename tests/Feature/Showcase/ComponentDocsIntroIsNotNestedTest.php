<?php

use Tests\TestCase;

uses(TestCase::class);

/*
 * A component doc's `intro` is block prose, so its container must not be a paragraph.
 *
 * ## The defect this encodes
 *
 * `ExamplesPanel` wrapped `doc.intro` in `<Text>`, which renders a `<p>`. Every
 * one of the 113 docs files writes its intro as block markup — a `<p>`, or a
 * fragment of them. So every component page in the showcase rendered a `<p>`
 * inside a `<p>` and React logged:
 *
 *     In HTML, <p> cannot be a descendant of <p>. This will cause a hydration error.
 *
 * The HTML parser closes the outer paragraph when it meets the inner one, so the
 * server's tree and the client's tree genuinely differ and React re-renders that
 * subtree on hydration.
 *
 * ## Why nothing caught it for 113 pages
 *
 * It is invisible three ways at once. It renders correctly — the browser's repair
 * happens to produce the layout we wanted. The type-check passes, because `<Text>`
 * legitimately accepts nodes. And the suite passes, because PHPUnit renders no
 * React at all: these tests assert on source, and `#app` is empty in a PHP test.
 *
 * It was found by opening the page in a browser and reading the console — which is
 * the only instrument that was ever going to see it, and the reason "verify in a
 * real browser, not just a green build" is a rule here rather than a preference.
 *
 * ## What this checks
 *
 * The container, not the 113 intros. Fixing it at the wrapper fixes every page at
 * once; requiring 113 files to avoid `<p>` would be a rule that has to be
 * remembered on every new page, and this estate has learned what happens to those.
 */

it('does not wrap a doc intro in a paragraph element', function () {
    $source = (string) file_get_contents(resource_path('js/Pages/Packages/Component.tsx'));

    // `toBeTrue` with a message, not `toContain($needle, $message)` — Pest's
    // `toContain` is VARIADIC, so a message passed as the second argument becomes a
    // second needle and the assertion fails on its own prose. Cost two debugging
    // detours in one session, the second of them after writing it down.
    expect(str_contains($source, 'doc.intro'))->toBeTrue(
        'ExamplesPanel no longer renders doc.intro; this check would assert nothing');

    // The wrapper, read from the opening tag that immediately precedes {doc.intro}.
    expect(preg_match('/<(\w+)[^>]*>\s*\{doc\.intro\}/s', $source, $match))->toBe(1,
        'could not find the element wrapping {doc.intro}; the extraction needs updating');

    $wrapper = $match[1];

    // `Text` renders a <p>. So does any component whose name we know to be a
    // paragraph — keep this list literal rather than clever, because a wrong guess
    // here fails open.
    $paragraphs = ['p', 'Text'];

    expect(in_array($wrapper, $paragraphs, true))->toBeFalse(implode("\n", [
        "doc.intro is wrapped in <{$wrapper}>, which renders a <p>.",
        '',
        'Every ComponentDocs file writes its intro as block markup, so this nests',
        'a <p> inside a <p> on every component page. The HTML parser closes the',
        'outer paragraph at the inner one, the server and client trees differ, and',
        'React logs a hydration error that no PHP test can see.',
        '',
        'Wrap it in a <div> carrying the same type classes instead.',
    ]));
});

it('still writes doc intros as block prose', function () {
    // The other half of the pair. If intros ever became inline, the rule above
    // would be unnecessary rather than merely unenforced — and a check whose
    // premise has quietly expired is worse than no check.
    $files = glob(resource_path('js/Pages/Packages/ComponentDocs/*.tsx')) ?: [];

    expect(count($files))->toBeGreaterThan(50,
        'only '.count($files).' docs files found; the glob is wrong and this would assert nothing');

    $block = 0;

    foreach ($files as $file) {
        $source = (string) file_get_contents($file);

        if (preg_match('/intro:\s*\(\s*<(p|>|ul|ol)/', $source)) {
            $block++;
        }
    }

    expect($block)->toBeGreaterThan(50,
        "only {$block} docs files open their intro with block markup; if intros are now "
        .'inline, the wrapper rule above is obsolete and should be removed rather than left in place');
});

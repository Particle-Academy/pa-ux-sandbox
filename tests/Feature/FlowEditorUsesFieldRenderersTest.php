<?php

use Tests\TestCase;

uses(TestCase::class);

/**
 * Every flow editor on this site gets the react-fancy field renderers.
 *
 * fancy-flow renders a `type: "json"` config field as a bare textarea on
 * purpose — it themes through a `--ff-*` token layer and will not import
 * react-fancy's hardcoded Tailwind primitives. It offers the
 * `/fields/react-fancy` subpath instead, and the host opts in.
 *
 * This app is a react-fancy app, so it opts in everywhere, through
 * `resources/js/components/FlowEditor.tsx`. The wrapper is the whole mechanism:
 * there are fourteen mount sites, and passing the prop at each of them would
 * have been correct exactly until someone added a fifteenth.
 *
 * That failure is invisible by construction — a JSON field falling back to a
 * textarea looks like a styling choice, not a missed prop — so nothing would
 * report it. This test is what reports it.
 */
function jsxFilesImportingFlowEditor(): array
{
    $hits = [];

    $files = new RecursiveIteratorIterator(
        new RecursiveDirectoryIterator(resource_path('js'), FilesystemIterator::SKIP_DOTS)
    );

    foreach ($files as $file) {
        if (! $file->isFile() || ! str_ends_with($file->getFilename(), '.tsx')) {
            continue;
        }

        $source = (string) file_get_contents($file->getPathname());

        // Strip template literals first. The docs pages carry `code:` snippets
        // showing consumers the real public import — which is exactly the line
        // this test hunts for, and exactly right where it appears. Matching
        // documentation as if it were a mount site is a false positive that
        // would have been silenced with an allowlist entry, and an allowlist is
        // where a genuine offender eventually hides.
        //
        // A real import is top-level code and never lives inside a backtick.
        $source = (string) preg_replace('/`[^`]*`/s', '``', $source);

        // An `import { … FlowEditor … } from "@particle-academy/fancy-flow"`.
        // Deliberately not matching `FlowEditorApi` / `FlowEditorProps`: types
        // carry no renderers and importing them directly is fine.
        if (preg_match(
            '/import\s*\{[^}]*\bFlowEditor\b(?!\w)[^}]*\}\s*from\s*"@particle-academy\/fancy-flow"/',
            $source
        )) {
            $hits[] = str_replace(resource_path('js').DIRECTORY_SEPARATOR, '', $file->getPathname());
        }
    }

    return $hits;
}

it('imports FlowEditor through the wrapper, never straight from the package', function () {
    $offenders = jsxFilesImportingFlowEditor();

    // The wrapper is the one file allowed to reach the package directly — that
    // is what it is for.
    $allowed = ['components'.DIRECTORY_SEPARATOR.'FlowEditor.tsx'];

    expect(array_values(array_diff($offenders, $allowed)))->toBe(
        [],
        'these import FlowEditor straight from fancy-flow, so their JSON config '
        .'fields silently fall back to a plain textarea: '.implode(', ', array_diff($offenders, $allowed))
    );
});

it('actually has a wrapper that attaches the renderers', function () {
    // Guards against the vacuous pass: delete the wrapper and the test above
    // reports a clean sweep, because nothing imports it any more either.
    $wrapper = resource_path('js/components/FlowEditor.tsx');

    expect(is_file($wrapper))->toBeTrue('the FlowEditor wrapper is gone');

    $source = (string) file_get_contents($wrapper);
    expect($source)->toContain('@particle-academy/fancy-flow/fields/react-fancy');
    expect($source)->toContain('reactFancyFieldRenderers');
});

it('detects a page that bypasses the wrapper', function () {
    // The discrimination check. Without it a broken matcher would report an
    // empty offender list forever, which is indistinguishable from compliance.
    $bypass = 'import { FlowEditor, type FlowGraph } from "@particle-academy/fancy-flow";';
    $viaWrapper = 'import { FlowEditor } from "../../components/FlowEditor";';
    $typeOnly = 'import { type FlowEditorApi } from "@particle-academy/fancy-flow";';

    $pattern = '/import\s*\{[^}]*\bFlowEditor\b(?!\w)[^}]*\}\s*from\s*"@particle-academy\/fancy-flow"/';

    expect(preg_match($pattern, $bypass))->toBe(1);
    expect(preg_match($pattern, $viaWrapper))->toBe(0);
    expect(preg_match($pattern, $typeOnly))->toBe(0, 'a type-only import carries no renderers and is fine');

    // And a documented snippet is not a mount site.
    $docSnippet = 'code: `import { FlowEditor } from "@particle-academy/fancy-flow";`';
    $stripped = (string) preg_replace('/`[^`]*`/s', '``', $docSnippet);
    expect(preg_match($pattern, $stripped))->toBe(0, 'a docs code snippet is documentation, not a bypass');
});

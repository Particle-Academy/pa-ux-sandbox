<?php

use Tests\TestCase;

uses(TestCase::class);

/*
 * Every public prop and compound part of a component appears in its own examples.
 *
 * ## Why this exists
 *
 * `Card` shipped Flux-parity work in react-fancy 5.30.0 — `Card.Bleed`,
 * `Card.Media`, `sections`, `dividerInset`, `highlight`, `interactive`, inset
 * dividers — and its documentation page demonstrated **none of it**. Built,
 * published, invisible. `Composer`'s `pasteThreshold` was undemonstrated the day
 * after it shipped.
 *
 * A feature nobody can see is, for every consumer who reads the docs to find out
 * what exists, identical to one that was never built. Same reason
 * `McpToolsAreDocumentedTest` and `ReactFancyComponentListTest` exist; this is the
 * same shape one level down, on props rather than whole components.
 *
 * ## Why it RATCHETS instead of gating
 *
 * There is a real backlog: when this was written, 50 documented components had
 * undemonstrated surface and 20 components had no docs file at all. A check that
 * fails 70 times on the day it lands is a check people switch off — and this
 * estate has already learned that a gate which cries wolf teaches everyone to
 * carry `--no-verify`.
 *
 * So the baseline records today's gaps, and the test fails on:
 *
 *   - a NEW gap in a component the baseline says is clean
 *   - a BIGGER gap than the baseline allows
 *   - a baseline entry that is now CLEAN and has not been removed
 *
 * That last one is what makes it a ratchet rather than a licence. The number can
 * only go down, and the file has to be edited to let it.
 *
 * ## What it reads, and why the group
 *
 * The component source is in a SIBLING repo (`repos/react-fancy`), two
 * directories up. That works wherever the suite is developed and nowhere else, so
 * it is `->group('envelope')` — run by the envelope's CI with `--group=envelope`,
 * excluded from this app's own CI, exactly like `CompiledArtifactsAreCurrentTest`.
 *
 * ## What it deliberately does NOT check
 *
 * Whether the example is any GOOD. Prose and design go stale in ways a test cannot
 * judge. A prop that is never named is unambiguous; a prop named badly is a
 * judgement call, and a check that pretends otherwise would be noise.
 */

/** Props every component has and nobody needs an example of. */
const DOCS_COVERAGE_IGNORED_PROPS = [
    'children', 'className', 'style', 'id', 'ref', 'key', 'as', 'role',
    'onClick', 'onChange', 'onKeyDown', 'onBlur', 'onFocus',
];

/**
 * Pull the props declared in the BODY of every `*Props` interface.
 *
 * Only `*Props`, on purpose: a types file also carries `*ContextValue`,
 * `*State` and friends, whose fields are internal plumbing. Counting those is how
 * a first draft of this measurement reported `anchorRef`, `draggedCard` and
 * `setDraggedCard` as undocumented features — which would have been a check that
 * cries wolf on its first run.
 *
 * Reads the interface BODY only, so props inherited from `HTMLAttributes` are not
 * counted. Those are DOM props; they are not ours to demonstrate.
 *
 * @return list<string>
 */
function docsCoverageProps(string $source): array
{
    $props = [];

    // Interface bodies: non-greedy to the first line that closes at column 0.
    preg_match_all('/interface\s+(\w*Props)\s*(?:extends[^{]*)?\{(.*?)^\}/ms', $source, $matches, PREG_SET_ORDER);

    foreach ($matches as $match) {
        // Two-space indent = a direct member. Deeper is a nested object literal.
        preg_match_all('/^  (\w+)\??\s*:/m', $match[2], $members);

        foreach ($members[1] as $name) {
            if (! in_array($name, DOCS_COVERAGE_IGNORED_PROPS, true)) {
                $props[] = $name;
            }
        }
    }

    return array_values(array_unique($props));
}

/**
 * Compound parts, from the `Object.assign(Root, { Part: ... })` the kit uses to
 * attach them. Returns them already qualified — `Card.Bleed`, not `Bleed` — because
 * that is the string a reader greps for and the string an example contains.
 *
 * @return list<string>
 */
function docsCoverageParts(string $source, string $component): array
{
    /*
     * Anchored on `export const <Component> = Object.assign(`, not on the first
     * `Object.assign` in the file.
     *
     * `Editor` has two: a private `ToolbarWithSeparator` that attaches
     * `Separator` to the toolbar, and then the component's own. Matching the
     * first reported the part as `Editor.Separator` — a path that does not
     * exist, since the real one is `Editor.Toolbar.Separator`. The page
     * demonstrated it correctly and the check called it missing, which is the
     * worse direction for a ratchet to be wrong in: it asks someone to document
     * a thing that is already documented, under a name that would be incorrect.
     */
    if (! preg_match('/export\s+const\s+'.preg_quote($component, '/').'\s*=\s*Object\.assign\(\s*\w+\s*,\s*\{(.*?)\}\s*\)/ms', $source, $match)) {
        return [];
    }

    preg_match_all('/^\s*(\w+)\s*:/m', $match[1], $parts);

    return array_map(fn (string $p): string => $component.'.'.$p, $parts[1]);
}

/** Word-boundary, so `src` does not match `description` and `alt` does not match `default`. */
function docsCoverageMentions(string $docs, string $needle): bool
{
    return (bool) preg_match('/\b'.preg_quote($needle, '/').'\b/', $docs);
}

/**
 * The gap per component, measured from source.
 *
 * @return array{missing: array<string, list<string>>, noDocs: list<string>, surface: int, covered: int, visited: int}
 */
function docsCoverageMeasure(): array
{
    $componentsDir = base_path('../react-fancy/src/components');
    $docsDir = resource_path('js/Pages/Packages/ComponentDocs');

    $missing = [];
    $noDocs = [];
    $surface = 0;
    $covered = 0;
    $visited = 0;

    foreach (scandir($componentsDir) ?: [] as $entry) {
        if ($entry === '.' || $entry === '..' || ! is_dir($componentsDir.'/'.$entry)) {
            continue;
        }

        $source = '';

        foreach ([$entry.'.types.ts', 'types.ts', $entry.'.tsx'] as $file) {
            $path = $componentsDir.'/'.$entry.'/'.$file;

            if (is_file($path)) {
                $source .= (string) file_get_contents($path);
            }
        }

        if ($source === '') {
            continue;
        }

        $expected = array_merge(docsCoverageProps($source), docsCoverageParts($source, $entry));

        if ($expected === []) {
            continue;
        }

        $visited++;
        $docPath = $docsDir.'/'.$entry.'.tsx';

        if (! is_file($docPath)) {
            $noDocs[] = $entry;

            continue;
        }

        $docs = (string) file_get_contents($docPath);
        $gaps = [];

        foreach ($expected as $needle) {
            $surface++;

            if (docsCoverageMentions($docs, $needle)) {
                $covered++;
            } else {
                $gaps[] = $needle;
            }
        }

        if ($gaps !== []) {
            sort($gaps);
            $missing[$entry] = $gaps;
        }
    }

    ksort($missing);
    sort($noDocs);

    return compact('missing', 'noDocs', 'surface', 'covered', 'visited');
}

/** @return array{missing: array<string, int>, noDocs: list<string>} */
function docsCoverageBaseline(): array
{
    $path = __DIR__.'/component-docs-baseline.json';

    expect(is_file($path))->toBeTrue("missing baseline at {$path}; run the generator noted in this test");

    /** @var array{missing: array<string, int>, noDocs: list<string>} $baseline */
    $baseline = json_decode((string) file_get_contents($path), true, 512, JSON_THROW_ON_ERROR);

    return $baseline;
}

it('demonstrates every public prop and part, or records the gap in the baseline', function () {
    $measured = docsCoverageMeasure();

    // Vacuity guard. If the sibling checkout is missing or the extraction breaks,
    // every component looks perfectly documented — which is the failure mode this
    // whole file is about, pointed at itself.
    expect($measured['visited'])->toBeGreaterThan(40,
        'only '.$measured['visited'].' components had an extractable surface; '
        .'the sibling react-fancy checkout or the extraction is broken, and a pass here would mean nothing');

    expect($measured['surface'])->toBeGreaterThan(200,
        'extracted only '.$measured['surface'].' props+parts across the kit; the extraction is broken');

    $baseline = docsCoverageBaseline();
    $allowed = $baseline['missing'];

    $regressed = [];
    $improved = [];

    foreach ($measured['missing'] as $component => $gaps) {
        $budget = $allowed[$component] ?? 0;

        if (count($gaps) > $budget) {
            $regressed[] = $component.': '.count($gaps).' undemonstrated, baseline allows '.$budget
                .' — '.implode(', ', $gaps);
        }
    }

    // The ratchet. A component that has been fixed must leave the baseline, or the
    // file stops describing reality and starts licensing a gap that is no longer
    // there — which is how a hand-maintained list rots.
    foreach ($allowed as $component => $budget) {
        $actual = count($measured['missing'][$component] ?? []);

        if ($actual < $budget) {
            $improved[] = $component.': baseline allows '.$budget.', now only '.$actual;
        }
    }

    expect($regressed)->toBe([], implode("\n", array_merge(
        ['These components gained undemonstrated public surface:', ''],
        array_map(fn ($l) => '  '.$l, $regressed),
        [
            '',
            'Add an example to resources/js/Pages/Packages/ComponentDocs/<Component>.tsx.',
            'A prop that appears in no example is, to anyone reading the docs to find out',
            'what the component can do, identical to one that does not exist.',
        ],
    )));

    expect($improved)->toBe([], implode("\n", array_merge(
        ['Good news, and the baseline now overstates the gap:', ''],
        array_map(fn ($l) => '  '.$l, $improved),
        [
            '',
            'Lower those numbers in tests/Feature/Showcase/component-docs-baseline.json.',
            'The baseline only ever ratchets DOWN — a stale allowance is a licence for a',
            'gap that has already been closed.',
        ],
    )));
})->group('envelope');

it('has a docs file for every component, or records the absence', function () {
    $measured = docsCoverageMeasure();
    $baseline = docsCoverageBaseline();

    $unexpected = array_values(array_diff($measured['noDocs'], $baseline['noDocs']));
    $fixed = array_values(array_diff($baseline['noDocs'], $measured['noDocs']));

    expect($unexpected)->toBe([], implode("\n", array_merge(
        ['These components have a public surface and NO documentation page at all:', ''],
        array_map(fn ($c) => '  '.$c, $unexpected),
        [
            '',
            'Create resources/js/Pages/Packages/ComponentDocs/<Component>.tsx and register it.',
            'Until then the component is invisible to every consumer browsing the site.',
        ],
    )));

    expect($fixed)->toBe([], implode("\n", array_merge(
        ['These now HAVE a docs page and should leave the baseline:', ''],
        array_map(fn ($c) => '  '.$c, $fixed),
        ['', 'Remove them from `noDocs` in component-docs-baseline.json.'],
    )));
})->group('envelope');

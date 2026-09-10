<?php

declare(strict_types=1);

use Illuminate\Support\Facades\Route;
use Tests\TestCase;

uses(TestCase::class);

/**
 * Every document package the showcase claims to ship can actually be reached.
 *
 * ## The defect this ratchets
 *
 * `last-word` was listed in `PackageRegistry`, given a family entry in
 * `PackageFamily`, written into a use case and taught in the curriculum — and
 * wired to **no surface at all**. No route, no controller, no demo. Every path a
 * consumer could follow into it dead-ended, and nothing reported that, because
 * "listed" and "reachable" were never compared.
 *
 * Its two siblings had an export endpoint each. So the failure was not that
 * nobody thought about document exports; it was that the third one was added to
 * every LIST and to no ROUTER, and the lists are what people read.
 *
 * That is the estate's most-repeated defect shape, and the cure is always the
 * same: compare the two artifacts rather than trusting either. This is the
 * comparison for document packages.
 *
 * ## Why a smoke request and not just a route lookup
 *
 * A registered route proves a URL resolves, not that the package behind it
 * works. `EveryComponentHasADemoTest` next door makes the same distinction for
 * components. So each surface is actually POSTed a minimal valid document and
 * has to return a real OOXML package — the cheapest possible end-to-end pass
 * through the app, the controller and the writer.
 */
$documentPackages = [
    'holy-sheet' => [
        'route' => 'holy-sheet.export',
        'body' => ['schema' => ['sheets' => [['name' => 'S', 'columns' => [['header' => 'A']], 'rows' => [['x']]]]]],
        'marker' => 'xl/workbook.xml',
    ],
    'dark-slide' => [
        'route' => 'dark-slide.export',
        'body' => ['deck' => [
            'id' => 'd', 'title' => 'T', 'theme' => ['name' => 'default'],
            'slides' => [['id' => 's', 'elements' => [[
                'id' => 'e', 'type' => 'text', 'x' => 0, 'y' => 0, 'w' => 10, 'h' => 10, 'content' => 'x',
            ]]]],
        ]],
        'marker' => 'ppt/presentation.xml',
    ],
    'last-word' => [
        'route' => 'last-word.export',
        'body' => ['doc' => ['blocks' => [['type' => 'paragraph', 'runs' => [['text' => 'x']]]]]],
        'marker' => 'word/document.xml',
    ],
];

it('routes a named export endpoint for every document package', function (string $package, array $spec) {
    expect(Route::has($spec['route']))->toBeTrue(
        "`{$package}` has no `{$spec['route']}` route. It is listed in PackageRegistry and reachable from "
        .'the packages page, so a consumer following either arrives nowhere. Wire a surface or stop listing it.'
    );
})->with(array_map(
    fn (string $name, array $spec) => [$name, $spec],
    array_keys($documentPackages),
    $documentPackages,
));

it('actually produces a document through that endpoint', function (string $package, array $spec) {
    // A registered route proves a URL resolves. This proves the package behind
    // it runs — through the app, the controller and the writer, end to end.
    $response = $this->postJson(route($spec['route'], [], false), $spec['body']);

    $response->assertOk();

    $tmp = tempnam(sys_get_temp_dir(), 'surface-').'.zip';

    try {
        file_put_contents($tmp, (string) $response->getContent());

        $zip = new ZipArchive;
        expect($zip->open($tmp))->toBeTrue("`{$package}` returned a body that is not a readable OOXML package");

        $found = $zip->locateName($spec['marker']) !== false;
        $zip->close();

        expect($found)->toBeTrue(
            "`{$package}` returned a zip with no `{$spec['marker']}` in it — the part that makes it "
            .'the document type it claims to be.'
        );
    } finally {
        @unlink($tmp);
    }
})->with(array_map(
    fn (string $name, array $spec) => [$name, $spec],
    array_keys($documentPackages),
    $documentPackages,
));

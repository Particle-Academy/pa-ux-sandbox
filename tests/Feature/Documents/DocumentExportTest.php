<?php

declare(strict_types=1);

use Illuminate\Testing\TestResponse;
use Tests\TestCase;

/**
 * The document export endpoints, exercised the way a consumer uses them.
 *
 * ## Why this exists
 *
 * `/holy-sheet/export` and `/dark-slide/export` are the sandbox's own
 * controllers over `holy-sheet` and `dark-slide` — the pattern the docblock in
 * each one tells other apps to copy. They have been routed and shipped, and
 * until now **nothing tested either of them.** The showcase is the kit's
 * end-to-end suite, so an untested route here is a first-party integration
 * pattern nobody has ever run.
 *
 * ## The assertions read the ARTIFACT
 *
 * A 200 with a plausible body is the check that passes just as happily for a
 * document with no formatting in it, and "it returned bytes" is not the claim
 * anyone cares about. So these unzip the response and look for the feature in
 * the OOXML.
 *
 * That is not theoretical rigour. This estate has now shipped, twice, a writer
 * that accepted a rich schema and emitted a plain document: `holy-sheet`
 * silently discarded an entire table when a styled cell was added beside it, and
 * `dark-slide` ignored the `theme.fonts.mono` it was given in all three engines.
 * Both produced a 200 and a file that opened.
 */
uses(TestCase::class);

function zipPartsOf(TestResponse $response): array
{
    $tmp = tempnam(sys_get_temp_dir(), 'export-').'.zip';

    try {
        // `getContent()`, not `streamedContent()`: these controllers return a
        // plain `response($bytes)`, and asking a non-streamed response for its
        // streamed content raises rather than falling back.
        file_put_contents($tmp, (string) $response->getContent());

        $zip = new ZipArchive;
        expect($zip->open($tmp))->toBeTrue('the response body is not a readable zip');

        $parts = [];
        for ($i = 0; $i < $zip->numFiles; $i++) {
            $name = (string) $zip->getNameIndex($i);
            $parts[$name] = (string) $zip->getFromName($name);
        }
        $zip->close();

        return $parts;
    } finally {
        @unlink($tmp);
    }
}

describe('POST /holy-sheet/export', function () {
    it('returns a real xlsx package, not merely a 200', function () {
        $response = $this->postJson('/holy-sheet/export', [
            'schema' => ['sheets' => [[
                'name' => 'Q3',
                'columns' => [
                    ['header' => 'Region'],
                    ['header' => 'Revenue', 'type' => 'currency', 'currency' => 'USD'],
                ],
                'rows' => [['EMEA', 2100000.0]],
                'totals' => ['Revenue' => 'sum'],
            ]]],
        ]);

        $response->assertOk();
        $parts = zipPartsOf($response);

        // The parts Excel refuses to open without. A package missing one of
        // these still downloads and still has a plausible size.
        foreach (['[Content_Types].xml', 'xl/workbook.xml', 'xl/worksheets/sheet1.xml', 'xl/styles.xml'] as $part) {
            expect($parts)->toHaveKey($part);
        }

        expect($parts['xl/worksheets/sheet1.xml'])->toContain('EMEA');
    });

    it('keeps the formatting the request asked for', function () {
        // The difference between a premium document and a boring one, through
        // the HTTP layer: $2,100,000.00 rather than 2100000, and a totals row
        // that recalculates rather than a baked number.
        $response = $this->postJson('/holy-sheet/export', [
            'schema' => ['sheets' => [[
                'name' => 'Q3',
                'columns' => [
                    ['header' => 'Region'],
                    ['header' => 'Revenue', 'type' => 'currency', 'currency' => 'USD', 'decimals' => 2],
                ],
                'rows' => [['EMEA', 2100000.0], ['North', 1250000.5]],
                'totals' => ['Revenue' => 'sum'],
                'cells' => ['A5' => ['value' => 'Reviewed', 'format' => ['bold' => true, 'backgroundColor' => '#1F3864']]],
            ]]],
        ]);

        $response->assertOk();
        $parts = zipPartsOf($response);

        expect($parts['xl/styles.xml'])->toContain('$');
        expect($parts['xl/styles.xml'])->toContain('FF1F3864');
        expect($parts['xl/worksheets/sheet1.xml'])->toContain('SUM(');

        // The table survived alongside the styled cell. holy-sheet 2.1.0 fixed
        // exactly this: a `cells` entry used to discard `columns`/`rows`/
        // `totals` entirely, and `validate()` reported no error.
        expect($parts['xl/worksheets/sheet1.xml'])->toContain('North');
    });

    it('refuses an invalid schema by NAMING what is wrong', function () {
        // A 422 is not the interesting part. An app copying this pattern needs
        // the path and the hint to show a person, so the payload shape is the
        // contract, not the status code.
        $response = $this->postJson('/holy-sheet/export', [
            'schema' => ['sheets' => [['columns' => [['header' => 'A']], 'rows' => [['x']]]]],
        ]);

        $response->assertStatus(422);
        $response->assertJsonPath('error', 'validation');
        expect($response->json('errors'))->not->toBeEmpty();
    });

    it('rejects a body with no schema at all', function () {
        $this->postJson('/holy-sheet/export', ['nope' => true])
            ->assertStatus(422)
            ->assertJsonPath('error', 'invalid_request');
    });

    it('sends it as a download, with the extension it promises', function () {
        $response = $this->postJson('/holy-sheet/export', [
            'schema' => ['sheets' => [['name' => 'S', 'columns' => [['header' => 'A']], 'rows' => [['x']]]]],
            'filename' => 'my/report',
        ]);

        $response->assertOk();
        $response->assertHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');

        // The slash is what makes this worth asserting: unsanitised it is a
        // path separator in a Content-Disposition header.
        $disposition = $response->headers->get('Content-Disposition');
        expect($disposition)->toContain('.xlsx');
        expect($disposition)->not->toContain('my/report');
    });
});

describe('POST /dark-slide/export', function () {
    it('returns a real pptx package, not merely a 200', function () {
        $response = $this->postJson('/dark-slide/export', [
            'deck' => [
                'id' => 'd1',
                'title' => 'Q3 Review',
                'theme' => ['name' => 'default'],
                'slides' => [[
                    'id' => 's1',
                    'layout' => 'title',
                    'elements' => [[
                        'id' => 'e1', 'type' => 'text',
                        'x' => 100, 'y' => 100, 'w' => 800, 'h' => 120,
                        'content' => 'Q3 Review',
                    ]],
                ]],
            ],
        ]);

        $response->assertOk();
        $parts = zipPartsOf($response);

        foreach (['[Content_Types].xml', 'ppt/presentation.xml', 'ppt/slides/slide1.xml', 'ppt/theme/theme1.xml'] as $part) {
            expect($parts)->toHaveKey($part);
        }

        expect($parts['ppt/slides/slide1.xml'])->toContain('Q3 Review');
    });

    it('carries the deck theme into the artifact', function () {
        // A deck with the wrong fonts and colours is not broken — it opens,
        // renders, and is simply not yours. Nobody files that as a bug, which
        // is why it is asserted here rather than left to the eye.
        $response = $this->postJson('/dark-slide/export', [
            'deck' => [
                'id' => 'd1',
                'title' => 'Brand',
                'theme' => [
                    'name' => 'brand',
                    'colors' => ['background' => '#101828', 'text' => '#F9FAFB', 'accent' => '#F97316'],
                    'fonts' => ['heading' => 'Playfair Display', 'body' => 'Inter'],
                ],
                'slides' => [[
                    'id' => 's1',
                    'elements' => [[
                        'id' => 'e1', 'type' => 'text',
                        'x' => 0, 'y' => 0, 'w' => 400, 'h' => 80, 'content' => 'Brand',
                    ]],
                ]],
            ],
        ]);

        $response->assertOk();
        $theme = zipPartsOf($response)['ppt/theme/theme1.xml'];

        expect($theme)->toContain('<a:majorFont><a:latin typeface="Playfair Display"/>');
        expect($theme)->toContain('<a:minorFont><a:latin typeface="Inter"/>');
        expect($theme)->toContain('F97316');
    });

    it('refuses an invalid deck by NAMING what is wrong', function () {
        $response = $this->postJson('/dark-slide/export', [
            'deck' => ['id' => 'd1', 'title' => 'T', 'theme' => ['name' => 'default'], 'slides' => [
                ['id' => 's1', 'elements' => [['id' => 'e1', 'type' => 'text', 'x' => 0, 'y' => 0, 'w' => 10, 'h' => 10]]],
            ]],
        ]);

        $response->assertStatus(422);
        $response->assertJsonPath('error', 'validation');
        expect($response->json('errors'))->not->toBeEmpty();
    });

    it('rejects a body with no deck at all', function () {
        $this->postJson('/dark-slide/export', ['nope' => true])
            ->assertStatus(422)
            ->assertJsonPath('error', 'invalid_request');
    });
});

describe('POST /last-word/export', function () {
    it('returns a real docx package, not merely a 200', function () {
        $response = $this->postJson('/last-word/export', [
            'doc' => ['blocks' => [
                ['type' => 'heading', 'level' => 1, 'runs' => [['text' => 'Q3 Revenue Review']]],
                ['type' => 'paragraph', 'runs' => [['text' => 'EMEA led on growth.']]],
            ]],
        ]);

        $response->assertOk();
        $parts = zipPartsOf($response);

        foreach (['[Content_Types].xml', 'word/document.xml', 'word/styles.xml'] as $part) {
            expect($parts)->toHaveKey($part);
        }

        expect($parts['word/document.xml'])->toContain('Q3 Revenue Review');
    });

    it('keeps the formatting the request asked for', function () {
        // A heading that is only a large bold paragraph produces a document
        // with no outline: no navigation pane, no table of contents, nothing
        // for a screen reader to jump between. It looks identical.
        $response = $this->postJson('/last-word/export', [
            'doc' => [
                'defaultFont' => 'Inter',
                'blocks' => [
                    ['type' => 'heading', 'level' => 1, 'runs' => [['text' => 'Q3']]],
                    ['type' => 'paragraph', 'runs' => [
                        ['text' => 'bold ', 'bold' => true],
                        ['text' => 'red', 'color' => '#C00000'],
                    ]],
                    ['type' => 'table', 'rows' => [
                        ['header' => true, 'cells' => [
                            ['blocks' => [['type' => 'paragraph', 'runs' => [['text' => 'Region']]]]],
                        ]],
                        ['cells' => [
                            ['blocks' => [['type' => 'paragraph', 'runs' => [['text' => 'EMEA']]]]],
                        ]],
                    ]],
                ],
            ],
        ]);

        $response->assertOk();
        $parts = zipPartsOf($response);

        expect($parts['word/document.xml'])->toContain('<w:pStyle w:val="Heading1"/>');
        expect($parts['word/document.xml'])->toContain('<w:b/>');
        expect($parts['word/document.xml'])->toContain('C00000');
        // The header row repeats across a page break — a docx-only capability,
        // and the difference between a long table that stays readable and one
        // whose column labels vanish after page one.
        expect($parts['word/document.xml'])->toContain('<w:tblHeader/>');
        expect($parts['word/styles.xml'])->toContain('Inter');
    });

    it('refuses an invalid document by NAMING what is wrong', function () {
        $response = $this->postJson('/last-word/export', [
            'doc' => ['blocks' => [['type' => 'heading', 'level' => 99, 'runs' => [['text' => 'x']]]]],
        ]);

        $response->assertStatus(422);
        $response->assertJsonPath('error', 'validation');
        expect($response->json('errors'))->not->toBeEmpty();
        expect($response->json('errors.0'))->toHaveKeys(['path', 'message']);
    });

    it('rejects a body with no doc at all', function () {
        $this->postJson('/last-word/export', ['nope' => true])
            ->assertStatus(422)
            ->assertJsonPath('error', 'invalid_request');
    });

    it('sends it as a download, with the extension it promises', function () {
        $response = $this->postJson('/last-word/export', [
            'doc' => ['blocks' => [['type' => 'paragraph', 'runs' => [['text' => 'x']]]]],
            'filename' => 'my/report',
        ]);

        $response->assertOk();
        $response->assertHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');

        $disposition = $response->headers->get('Content-Disposition');
        expect($disposition)->toContain('.docx');
        expect($disposition)->not->toContain('my/report');
    });
});

describe('the guard against an assertion that cannot fail', function () {
    it('proves a PLAIN workbook does not contain the premium markers', function () {
        // Without this, every styling assertion above could be matching
        // boilerplate that appears in any workbook, and this file would be
        // green for a document with no formatting whatsoever.
        $response = $this->postJson('/holy-sheet/export', [
            'schema' => ['sheets' => [['name' => 'Plain', 'columns' => [['header' => 'A']], 'rows' => [['just text']]]]],
        ]);

        $response->assertOk();
        $styles = zipPartsOf($response)['xl/styles.xml'];

        expect($styles)->not->toContain('FF1F3864');
        expect($styles)->not->toContain('$');
    });
});

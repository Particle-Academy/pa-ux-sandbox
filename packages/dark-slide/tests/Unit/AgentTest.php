<?php

declare(strict_types=1);

use DarkSlide\Agent;
use DarkSlide\Exceptions\SchemaException;

/**
 * End-to-end smoke tests for Agent::* methods. Each test exercises a real
 * piece of the writer (validate / write / read / repair) so any regression
 * in the OOXML emission gets caught at PR time.
 */

function dsFixture(): array
{
    return [
        'id' => 'test',
        'title' => 'Test deck',
        'theme' => ['name' => 'default'],
        'slides' => [
            [
                'id' => 's1',
                'layout' => 'title',
                'elements' => [
                    [
                        'id' => 'e1',
                        'type' => 'text',
                        'x' => 0.1, 'y' => 0.4, 'w' => 0.8, 'h' => 0.2,
                        'content' => 'Hello, DarkSlide.',
                        'format' => 'plain',
                        'style' => ['fontSize' => 48, 'weight' => 'bold', 'align' => 'center'],
                    ],
                ],
                'notes' => 'These are speaker notes.',
            ],
            [
                'id' => 's2',
                'layout' => 'blank',
                'elements' => [
                    [
                        'id' => 'e2',
                        'type' => 'shape',
                        'shape' => 'rounded-rect',
                        'x' => 0.2, 'y' => 0.2, 'w' => 0.6, 'h' => 0.6,
                        'fill' => '#8B5CF6',
                        'stroke' => '#0F172A',
                        'strokeWidth' => 4,
                        'radius' => 16,
                    ],
                ],
            ],
        ],
    ];
}

it('validates a well-formed deck without errors', function () {
    expect(Agent::validate(dsFixture()))->toBe([]);
});

it('reports missing required keys with structured errors', function () {
    $errors = Agent::validate(['slides' => []]);
    $paths = array_column($errors, 'path');
    expect($paths)->toContain('/id', '/title', '/theme');
});

it('flags bad coords on elements', function () {
    $deck = dsFixture();
    $deck['slides'][0]['elements'][0]['x'] = 'not-a-number';
    $errors = Agent::validate($deck);
    expect($errors)->not->toBeEmpty();
    expect($errors[0]['path'])->toBe('/slides/0/elements/0/x');
});

it('repairs missing ids + clamps out-of-range coords', function () {
    $deck = [
        'slides' => [
            [
                'elements' => [
                    [
                        'type' => 'text',
                        'x' => -0.5, 'y' => 1.5, 'w' => 2.0, 'h' => 0.001,
                        'content' => 'hi',
                    ],
                ],
            ],
        ],
    ];
    $result = Agent::validateAndRepair($deck);
    expect($result['ok'])->toBeTrue();
    $element = $result['schema']['slides'][0]['elements'][0];
    expect($element['x'])->toBe(0.0);
    expect($element['y'])->toBe(1.0);
    expect($element['w'])->toBe(1.0);
    expect($element['h'])->toBeGreaterThanOrEqual(0.02);
    expect($element['id'])->toBeString();
});

it('writes a pptx archive that is a valid zip', function () {
    $bytes = Agent::toBytes(dsFixture());
    expect(strlen($bytes))->toBeGreaterThan(1000);
    // PPTX files start with PK (zip magic).
    expect(substr($bytes, 0, 2))->toBe('PK');
});

it('writes a pptx archive containing the expected parts', function () {
    $bytes = Agent::toBytes(dsFixture());
    $tmp = tempnam(sys_get_temp_dir(), 'darkslide-test-');
    file_put_contents($tmp, $bytes);

    try {
        $zip = new ZipArchive();
        expect($zip->open($tmp))->toBeTrue();

        $expected = [
            '[Content_Types].xml',
            '_rels/.rels',
            'docProps/core.xml',
            'docProps/app.xml',
            'ppt/presentation.xml',
            'ppt/_rels/presentation.xml.rels',
            'ppt/theme/theme1.xml',
            'ppt/slideMasters/slideMaster1.xml',
            'ppt/slideLayouts/slideLayout1.xml',
            'ppt/slides/slide1.xml',
            'ppt/slides/slide2.xml',
            'ppt/slides/_rels/slide1.xml.rels',
            'ppt/slides/_rels/slide2.xml.rels',
            'ppt/notesSlides/notesSlide1.xml', // slide 1 has notes
        ];
        foreach ($expected as $name) {
            expect($zip->locateName($name))->not->toBeFalse(message: "Missing part: {$name}");
        }
        $zip->close();
    } finally {
        @unlink($tmp);
    }
});

it('embeds the text content inside slide1.xml', function () {
    $bytes = Agent::toBytes(dsFixture());
    $tmp = tempnam(sys_get_temp_dir(), 'darkslide-test-');
    file_put_contents($tmp, $bytes);

    try {
        $zip = new ZipArchive();
        $zip->open($tmp);
        $slideXml = $zip->getFromName('ppt/slides/slide1.xml');
        expect($slideXml)->toContain('Hello, DarkSlide.');
        $zip->close();
    } finally {
        @unlink($tmp);
    }
});

it('writes the deck to disk and returns size + slide count', function () {
    $path = tempnam(sys_get_temp_dir(), 'darkslide-out-') . '.pptx';
    try {
        $result = Agent::write(dsFixture(), $path);
        expect($result['slides'])->toBe(2);
        expect($result['bytes'])->toBeGreaterThan(1000);
        expect(is_file($result['path']))->toBeTrue();
    } finally {
        @unlink($path);
    }
});

it('throws SchemaException when writing an invalid deck', function () {
    expect(fn () => Agent::write(['slides' => []], '/tmp/nope.pptx'))
        ->toThrow(SchemaException::class);
});

it('round-trips a deck through write → read', function () {
    $path = tempnam(sys_get_temp_dir(), 'darkslide-out-') . '.pptx';
    try {
        Agent::write(dsFixture(), $path);
        $read = Agent::read($path);
        expect($read['title'])->toBe('Test deck');
        expect(count($read['slides']))->toBe(2);
        // First slide should preserve the text content.
        $first = $read['slides'][0];
        expect(collect($first['elements'])->pluck('content'))->toContain('Hello, DarkSlide.');
        expect($first['notes'])->toContain('speaker notes');
    } finally {
        @unlink($path);
    }
});

it('describes a deck in plain text', function () {
    $summary = Agent::describe(dsFixture());
    expect($summary)->toContain('Deck: Test deck');
    expect($summary)->toContain('Slides: 2');
    expect($summary)->toContain('1 text');
    expect($summary)->toContain('1 shape');
});

it('exports a JSON Schema with the deck top-level keys', function () {
    $schema = Agent::jsonSchema();
    expect($schema['type'])->toBe('object');
    expect($schema['required'])->toContain('id', 'title', 'slides', 'theme');
});

// ─── v0.2 features ─────────────────────────────────────────────────────────

it('renders inline markdown spans as separate drawingML runs', function () {
    $deck = dsFixture();
    $deck['slides'][0]['elements'][0]['content'] = 'A **bold** word and `code` and *italic* too.';
    $deck['slides'][0]['elements'][0]['format'] = 'markdown';

    $bytes = Agent::toBytes($deck);
    $tmp = tempnam(sys_get_temp_dir(), 'darkslide-test-');
    file_put_contents($tmp, $bytes);

    try {
        $zip = new ZipArchive();
        $zip->open($tmp);
        $slideXml = $zip->getFromName('ppt/slides/slide1.xml');
        // Each token should be its own <a:r> with its own <a:rPr>
        expect($slideXml)->toContain('<a:t>A </a:t>');
        expect($slideXml)->toContain('<a:t>bold</a:t>');
        expect($slideXml)->toContain('<a:t> word and </a:t>');
        expect($slideXml)->toContain('<a:t>code</a:t>');
        expect($slideXml)->toContain('<a:t>italic</a:t>');
        // Bold runs should carry b="1"
        expect($slideXml)->toMatch('/<a:rPr[^>]*b="1"[^>]*>.+?bold/s');
        // Code runs should switch to Consolas
        expect($slideXml)->toContain('Consolas');
        $zip->close();
    } finally {
        @unlink($tmp);
    }
});

it('renders bulleted markdown lines with bullet paragraph markup', function () {
    $deck = dsFixture();
    $deck['slides'][0]['elements'][0]['content'] = "- one\n- two with **bold**\n- three";
    $deck['slides'][0]['elements'][0]['format'] = 'markdown';

    $bytes = Agent::toBytes($deck);
    $tmp = tempnam(sys_get_temp_dir(), 'darkslide-test-');
    file_put_contents($tmp, $bytes);

    try {
        $zip = new ZipArchive();
        $zip->open($tmp);
        $slideXml = $zip->getFromName('ppt/slides/slide1.xml');
        // Bullet markup uses <a:buChar/>
        expect(substr_count($slideXml, '<a:buChar char="•"/>'))->toBe(3);
        $zip->close();
    } finally {
        @unlink($tmp);
    }
});

it('emits a real <a:tbl> for table elements', function () {
    $deck = dsFixture();
    $deck['slides'][1]['elements'][] = [
        'id' => 'tbl1',
        'type' => 'table',
        'x' => 0.1, 'y' => 0.7, 'w' => 0.8, 'h' => 0.2,
        'columns' => [
            ['key' => 'name', 'label' => 'Name'],
            ['key' => 'qty', 'label' => 'Qty'],
        ],
        'rows' => [
            ['name' => 'Widget', 'qty' => 12],
            ['name' => 'Sprocket', 'qty' => 4],
        ],
    ];

    $bytes = Agent::toBytes($deck);
    $tmp = tempnam(sys_get_temp_dir(), 'darkslide-test-');
    file_put_contents($tmp, $bytes);

    try {
        $zip = new ZipArchive();
        $zip->open($tmp);
        $slideXml = $zip->getFromName('ppt/slides/slide2.xml');
        expect($slideXml)->toContain('<a:tbl>');
        expect($slideXml)->toContain('<a:tblGrid>');
        // Header + 2 body rows = 3 <a:tr>
        expect(substr_count($slideXml, '<a:tr '))->toBe(3);
        // Header text + first row text both present
        expect($slideXml)->toContain('<a:t>Name</a:t>');
        expect($slideXml)->toContain('<a:t>Widget</a:t>');
        expect($slideXml)->toContain('<a:t>12</a:t>');
        // No placeholder text leaked through
        expect($slideXml)->not->toContain('[table]');
        $zip->close();
    } finally {
        @unlink($tmp);
    }
});

it('emits a gradient background as <a:gradFill> with stops', function () {
    $deck = dsFixture();
    $deck['slides'][0]['background'] = [
        'gradient' => 'linear-gradient(135deg, #fef3c7 0%, #fce7f3 100%)',
    ];

    $bytes = Agent::toBytes($deck);
    $tmp = tempnam(sys_get_temp_dir(), 'darkslide-test-');
    file_put_contents($tmp, $bytes);

    try {
        $zip = new ZipArchive();
        $zip->open($tmp);
        $slideXml = $zip->getFromName('ppt/slides/slide1.xml');
        expect($slideXml)->toContain('<a:gradFill');
        expect($slideXml)->toContain('<a:gsLst>');
        expect($slideXml)->toContain('FEF3C7'); // first stop
        expect($slideXml)->toContain('FCE7F3'); // second stop
        expect($slideXml)->toContain('<a:lin ang=');
        $zip->close();
    } finally {
        @unlink($tmp);
    }
});

it('keeps solid colour bg working alongside gradient support', function () {
    $deck = dsFixture();
    $deck['slides'][0]['background'] = ['color' => '#0b1220'];

    $bytes = Agent::toBytes($deck);
    $tmp = tempnam(sys_get_temp_dir(), 'darkslide-test-');
    file_put_contents($tmp, $bytes);

    try {
        $zip = new ZipArchive();
        $zip->open($tmp);
        $slideXml = $zip->getFromName('ppt/slides/slide1.xml');
        expect($slideXml)->toContain('<a:srgbClr val="0B1220"');
        expect($slideXml)->not->toContain('<a:gradFill');
        $zip->close();
    } finally {
        @unlink($tmp);
    }
});

// ─── v0.3 features ─────────────────────────────────────────────────────────

it('renders markdown headings at larger sizes with bold runs', function () {
    $deck = dsFixture();
    $deck['slides'][0]['elements'][0]['content'] = "# Big heading\n## Medium\n### Small\nbody copy";
    $deck['slides'][0]['elements'][0]['format'] = 'markdown';
    // Use a body size big enough that the heading multipliers land above
    // PPTX's 8pt floor on h3.
    $deck['slides'][0]['elements'][0]['style'] = ['fontSize' => 40];

    $bytes = Agent::toBytes($deck);
    $tmp = tempnam(sys_get_temp_dir(), 'darkslide-test-');
    file_put_contents($tmp, $bytes);

    try {
        $zip = new ZipArchive();
        $zip->open($tmp);
        $slideXml = $zip->getFromName('ppt/slides/slide1.xml');
        // Heading text should appear (without the # prefix)
        expect($slideXml)->toContain('<a:t>Big heading</a:t>');
        expect($slideXml)->toContain('<a:t>Medium</a:t>');
        expect($slideXml)->toContain('<a:t>Small</a:t>');
        expect($slideXml)->not->toContain('<a:t># Big heading</a:t>');
        // The first heading run should be bold + larger than the body run.
        // Body font is 40 → sz=2000 in PPTX; h1 uses 1.8× → sz=3600.
        expect($slideXml)->toMatch('/<a:rPr[^>]*sz="3600"[^>]*b="1"[^>]*>.{0,200}?Big heading/s');
        expect($slideXml)->toMatch('/<a:rPr[^>]*sz="2000"[^>]*>.{0,200}?body copy/s');
        $zip->close();
    } finally {
        @unlink($tmp);
    }
});

it('highlights code blocks with colored token runs', function () {
    $deck = dsFixture();
    $deck['slides'][1]['elements'][] = [
        'id' => 'snippet',
        'type' => 'code',
        'x' => 0.05, 'y' => 0.05, 'w' => 0.9, 'h' => 0.4,
        'code' => "const greet = (name) => `Hello, ${name}`;\n// comment",
        'language' => 'typescript',
    ];

    $bytes = Agent::toBytes($deck);
    $tmp = tempnam(sys_get_temp_dir(), 'darkslide-test-');
    file_put_contents($tmp, $bytes);

    try {
        $zip = new ZipArchive();
        $zip->open($tmp);
        $slideXml = $zip->getFromName('ppt/slides/slide2.xml');
        // The `const` keyword should be its own colored run (violet C084FC).
        expect($slideXml)->toMatch('/<a:srgbClr val="C084FC"\/>.{0,200}?<a:t>const<\/a:t>/s');
        // The comment should be slate grey.
        expect($slideXml)->toMatch('/<a:srgbClr val="64748B"\/>.{0,200}?<a:t>\/\/ comment<\/a:t>/s');
        // String literal should be green.
        expect($slideXml)->toContain('86EFAC');
        // All code runs should use Consolas.
        expect($slideXml)->toContain('Consolas');
        $zip->close();
    } finally {
        @unlink($tmp);
    }
});

it('round-trips a table through write → read', function () {
    $deck = dsFixture();
    $deck['slides'][1]['elements'][] = [
        'id' => 'tbl-rt',
        'type' => 'table',
        'x' => 0.1, 'y' => 0.7, 'w' => 0.8, 'h' => 0.2,
        'columns' => [
            ['key' => 'name', 'label' => 'Name'],
            ['key' => 'qty', 'label' => 'Qty'],
        ],
        'rows' => [
            ['name' => 'Widget', 'qty' => 12],
            ['name' => 'Sprocket', 'qty' => 4],
        ],
    ];

    $path = tempnam(sys_get_temp_dir(), 'darkslide-rt-') . '.pptx';
    try {
        Agent::write($deck, $path);
        $read = Agent::read($path);
        $tables = collect($read['slides'][1]['elements'])->where('type', 'table')->values();
        expect($tables->count())->toBe(1);
        $t = $tables->first();
        expect(collect($t['columns'])->pluck('label')->all())->toBe(['Name', 'Qty']);
        expect(count($t['rows']))->toBe(2);
        // Column keys are normalized to col1, col2 on read (we don't carry
        // the source schema). Verify by position-of-value instead.
        $firstRow = array_values($t['rows'][0]);
        expect($firstRow)->toBe(['Widget', '12']);
    } finally {
        @unlink($path);
    }
});

it('round-trips a gradient background through write → read', function () {
    $deck = dsFixture();
    $deck['slides'][0]['background'] = [
        'gradient' => 'linear-gradient(135deg, #fef3c7 0%, #fce7f3 100%)',
    ];

    $path = tempnam(sys_get_temp_dir(), 'darkslide-rt-') . '.pptx';
    try {
        Agent::write($deck, $path);
        $read = Agent::read($path);
        $bg = $read['slides'][0]['background'] ?? null;
        expect($bg)->toBeArray();
        expect($bg)->toHaveKey('gradient');
        expect($bg['gradient'])->toContain('linear-gradient(');
        // Stop colors should survive — we accept both #hex casings.
        expect(strtolower($bg['gradient']))->toContain('#fef3c7');
        expect(strtolower($bg['gradient']))->toContain('#fce7f3');
    } finally {
        @unlink($path);
    }
});

it('round-trips an embedded image as a data URI', function () {
    // 1x1 PNG — tiniest valid PNG to keep the test cheap.
    $png = base64_decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=');
    $imageDataUri = 'data:image/png;base64,' . base64_encode($png);

    $deck = dsFixture();
    $deck['slides'][0]['elements'][] = [
        'id' => 'img',
        'type' => 'image',
        'x' => 0.1, 'y' => 0.1, 'w' => 0.3, 'h' => 0.3,
        'src' => $imageDataUri,
        'fit' => 'cover',
    ];

    $path = tempnam(sys_get_temp_dir(), 'darkslide-rt-') . '.pptx';
    try {
        Agent::write($deck, $path);
        $read = Agent::read($path);
        $images = collect($read['slides'][0]['elements'])->where('type', 'image')->values();
        expect($images->count())->toBe(1);
        $src = $images->first()['src'];
        expect($src)->toStartWith('data:image/png;base64,');
        expect(strlen($src))->toBeGreaterThan(100);
    } finally {
        @unlink($path);
    }
});

it('round-trips inline markdown spans through write → read', function () {
    $deck = dsFixture();
    $deck['slides'][0]['elements'][0]['content'] = 'This is **bold** and *italic* and `code`.';
    $deck['slides'][0]['elements'][0]['format'] = 'markdown';
    // Round-trip works when the base style is NOT all-bold; otherwise the
    // reader correctly collapses the uniform bold into the paragraph
    // default (see paragraphToMarkdown for the heuristic).
    $deck['slides'][0]['elements'][0]['style'] = ['fontSize' => 24, 'align' => 'left'];

    $path = tempnam(sys_get_temp_dir(), 'darkslide-rt-') . '.pptx';
    try {
        Agent::write($deck, $path);
        $read = Agent::read($path);
        $first = collect($read['slides'][0]['elements'])->where('type', 'text')->first();
        expect($first['format'])->toBe('markdown');
        expect($first['content'])->toContain('**bold**');
        expect($first['content'])->toContain('*italic*');
        expect($first['content'])->toContain('`code`');
    } finally {
        @unlink($path);
    }
});

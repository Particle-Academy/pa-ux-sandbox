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

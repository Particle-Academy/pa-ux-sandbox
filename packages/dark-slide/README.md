# DarkSlide

PHP package for reading and writing presentation files (`.pptx`) from a
JSON-friendly schema. Framework-agnostic core with an optional Laravel
adapter. Designed to round-trip with the
[`@particle-academy/fancy-slides`](https://github.com/Particle-Academy/fancy-slides)
JS package's `Deck` schema — what the JS editor emits, DarkSlide writes
to a real Office Open XML file that opens in PowerPoint, Keynote,
Google Slides, and LibreOffice Impress.

## Why

Sister project to [`holy-sheet`](https://github.com/Particle-Academy/holy-sheet)
(XLSX writer). The two share an "agent emits JSON, PHP writes a real
document" pattern:

| Document type | JS authoring | PHP writing |
|---|---|---|
| Spreadsheets | fancy-sheets | holy-sheet |
| Presentations | fancy-slides | **dark-slide** |

## Quickstart

```php
use DarkSlide\Agent;

$deck = [
    'id' => 'demo',
    'title' => 'My deck',
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
                    'content' => 'Welcome to dark-slide',
                    'format' => 'plain',
                    'style' => ['fontSize' => 56, 'weight' => 'bold', 'align' => 'center'],
                ],
            ],
        ],
    ],
];

// Validate before writing — catches malformed agent output
$errors = Agent::validate($deck);
if (!empty($errors)) {
    foreach ($errors as $e) {
        echo "{$e['path']}: expected {$e['expected']}, got {$e['got']}\n";
    }
    exit(1);
}

// Write to disk
$result = Agent::write($deck, '/tmp/my-deck.pptx');
// $result === ['path' => '/tmp/my-deck.pptx', 'bytes' => 18432, 'slides' => 1]

// Or get the bytes in memory (no temp file)
$bytes = Agent::toBytes($deck);
```

## Laravel

```php
use DarkSlide\Laravel\Facades\DarkSlide;

DarkSlide::write($deck, storage_path('app/decks/demo.pptx'));

return response(DarkSlide::toBytes($deck), 200, [
    'Content-Type' => 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'Content-Disposition' => 'attachment; filename="demo.pptx"',
]);
```

## Schema

Mirrors `@particle-academy/fancy-slides`'s `Deck` shape exactly. Coordinates
are 0..1 fractions; DarkSlide converts to PPTX EMU (914,400 per inch) on
write.

See [`docs/schema.md`](./docs/schema.md) for the full reference.

## Element coverage (v0.1)

| Element | Writer | Reader |
|---|:-:|:-:|
| text   | ✅ | ✅ |
| image  | ✅ | ✅ |
| shape  | ✅ (rect, rounded-rect, ellipse, triangle, line, arrow) | ✅ |
| chart  | placeholder (renders as text fallback) | ⚠ skipped |
| code   | as monospaced text (no syntax highlighting in pptx) | ✅ as text |
| table  | v0.2 | v0.2 |
| embed  | not representable in pptx | n/a |

## Agent tool-use surface

`Agent::validateAndRepair($schema)` returns `['ok' => bool, 'schema' => array, 'errors' => list]` — wire it into your LLM tool to give the agent structured feedback on its emitted decks. Mirrors holy-sheet's pattern.

## License

MIT

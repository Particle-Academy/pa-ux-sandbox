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

## Element coverage (v0.3)

| Element | Writer | Reader |
|---|:-:|:-:|
| text   | ✅ markdown spans + headings (`# / ## / ###`) | ✅ markdown spans reconstructed |
| image  | ✅ (data URI + local path) | ✅ as data URI |
| shape  | ✅ (rect, rounded-rect, ellipse, triangle, line, arrow) | ✅ |
| code   | ✅ syntax-highlighted runs (JS/TS, PHP, JSON, bash, CSS, Python, HTML) | ✅ as text |
| table  | ✅ real `<a:tbl>` (header + striped body rows) | ✅ round-trips columns + rows |
| background | ✅ solid color, gradient (`linear-gradient(…)`), image | ✅ solid, gradient, image-as-data-URI |
| chart  | placeholder (renders as text fallback) — real chart parts on the v0.4 roadmap | ⚠ skipped |
| embed  | not representable in pptx | n/a |

### What's new in v0.3

- **Markdown headings**. `# / ## / ###` paragraph prefixes in `format: "markdown"` text elements emit larger bold runs in the pptx.
- **Syntax-highlighted code blocks**. The `code` element now ships one `<a:r>` per token, colored by kind (keyword / string / comment / number / builtin / punctuation). Pure-PHP tokenizer, zero third-party deps. Languages: `javascript`, `typescript`, `jsx`, `tsx`, `php`, `json`, `bash`, `css`, `python`, `html`.
- **Reader fidelity for v0.2 features**. Tables, gradients, embedded images, and inline bold/italic/code spans now round-trip back to the Deck schema.

## Agent tool-use surface

`Agent::validateAndRepair($schema)` returns `['ok' => bool, 'schema' => array, 'errors' => list]` — wire it into your LLM tool to give the agent structured feedback on its emitted decks. Mirrors holy-sheet's pattern.

## License

MIT

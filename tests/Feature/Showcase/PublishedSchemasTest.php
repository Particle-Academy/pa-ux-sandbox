<?php

use App\Models\FlowNodePackage;
use App\Support\Registry\ConnectorFacet;
use Illuminate\Support\Facades\File;
use Tests\Support\JsonSchema;
use Tests\TestCase;

uses(TestCase::class);

/**
 * Every `$schema` this site publishes resolves, and describes what is served.
 *
 * ## What was wrong
 *
 * `/r/index.json` declared `"$schema": "https://ui.particle.academy/schema/registry.json"`,
 * every bundle declared `…/schema/registry-item.json`, `/r/nodes/index.json`
 * declared `…/schema/node-registry.json`, and fancy-cli writes
 * `…/schema/fancy.json` into every project it initialises. All four were 404s,
 * along with five more on documents nobody maintained a schema for. A `$schema`
 * that does not resolve is a promise the site does not keep: editors report
 * that they cannot load it, and a validator that fetches it fails before it
 * reads a byte of the document.
 *
 * ## Why the schemas are tested against the live responses
 *
 * A schema written once and never checked is a second description of the
 * payload, and second descriptions drift. So every document the registry
 * serves is validated against the schema it names, through the real routes —
 * change the payload without changing the schema and this fails, and the
 * reverse. The drift tests below prove the schemas actually reject things,
 * because a schema that accepts everything would pass all of this.
 *
 * ## fancy-cli
 *
 * fancy-cli is the reference consumer, but it holds these shapes only as
 * TypeScript interfaces and checks almost nothing at run time, so there is no
 * machine-readable definition to reuse. The envelope-scoped test at the bottom
 * binds the two instead: every field the CLI types must be declared here, and
 * every field it requires must be required here.
 */
const SCHEMA_ORIGIN = 'https://ui.particle.academy/schema/';

function schemaAt(string $url): JsonSchema
{
    expect($url)->toStartWith(SCHEMA_ORIGIN);

    return JsonSchema::fromFile(resource_path('schema/'.substr($url, strlen(SCHEMA_ORIGIN))));
}

/**
 * GET a registry document, check it names `$schemaUrl`, and return its violations.
 *
 * @return list<string>
 */
function servedViolations(TestCase $test, string $uri, string $schemaUrl): array
{
    $response = $test->get($uri)->assertOk();
    $document = json_decode((string) $response->getContent(), false, flags: JSON_THROW_ON_ERROR);

    expect($document->{'$schema'} ?? null)->toBe($schemaUrl, "{$uri} names a different schema");

    return array_map(fn (string $e) => "{$uri} {$e}", schemaAt($schemaUrl)->validate($document));
}

it('enforces every keyword it accepts and refuses the ones it does not implement', function () {
    $schema = new JsonSchema([
        'type' => 'object',
        'required' => ['name', 'tags'],
        'additionalProperties' => false,
        'properties' => [
            'name' => ['$ref' => '#/$defs/slug'],
            'kind' => ['enum' => ['a', 'b']],
            'marker' => ['const' => true],
            'count' => ['type' => 'integer', 'minimum' => 0],
            'tags' => ['type' => 'array', 'minItems' => 1, 'items' => ['type' => 'string', 'minLength' => 2]],
        ],
        '$defs' => ['slug' => ['type' => 'string', 'pattern' => '^[a-z]+$']],
    ]);

    $valid = fn (): stdClass => json_decode('{"name":"ok","kind":"a","marker":true,"count":3,"tags":["xy"]}');

    expect($schema->validate($valid()))->toBe([]);

    $broken = [
        'required' => fn (stdClass $d) => $d->tags = null,
        'missing' => function (stdClass $d) {
            unset($d->name);
        },
        'additionalProperties' => fn (stdClass $d) => $d->extra = 1,
        '$ref pattern' => fn (stdClass $d) => $d->name = 'NOT-A-SLUG',
        'enum' => fn (stdClass $d) => $d->kind = 'c',
        'const' => fn (stdClass $d) => $d->marker = false,
        'type integer' => fn (stdClass $d) => $d->count = '3',
        'minimum' => fn (stdClass $d) => $d->count = -1,
        'minItems' => fn (stdClass $d) => $d->tags = [],
        'items minLength' => fn (stdClass $d) => $d->tags = ['x'],
        'object vs list' => fn (stdClass $d) => $d->tags = new stdClass,
    ];

    foreach ($broken as $label => $break) {
        $document = $valid();
        $break($document);

        expect($schema->validate($document))->not->toBe([], "the validator accepted a document breaking `{$label}`");
    }

    // Anywhere in the tree, referenced or not: an unreferenced `$defs` entry is
    // exactly where an unenforced keyword would hide.
    expect(fn () => new JsonSchema(['$defs' => ['x' => ['format' => 'uri']]]))
        ->toThrow(LogicException::class, 'format');
    expect(fn () => new JsonSchema(['properties' => ['a' => ['oneOf' => []]]]))
        ->toThrow(LogicException::class, 'oneOf');
});

it('serves every published schema at the URL it declares as its $id', function () {
    $files = File::glob(resource_path('schema/*.json'));

    expect($files)->toHaveCount(4);

    foreach ($files as $path) {
        $name = basename($path);
        $schema = json_decode(File::get($path), true, flags: JSON_THROW_ON_ERROR);

        expect($schema['$schema'] ?? null)->toBe('https://json-schema.org/draft/2020-12/schema', $name);
        expect($schema['$id'] ?? null)->toBe(SCHEMA_ORIGIN.$name, "{$name} declares an \$id it is not served at");

        // Throws on any keyword the validator would otherwise ignore.
        new JsonSchema($schema);

        $response = $this->get("/schema/{$name}")->assertOk();

        expect($response->headers->get('Content-Type'))->toStartWith('application/schema+json');
        expect($response->headers->get('Access-Control-Allow-Origin'))->toBe('*');
        expect(json_decode((string) $response->getContent(), true))->toBe($schema);
    }
});

it('answers a schema it does not publish with a 404', function () {
    $this->get('/schema/nope.json')->assertNotFound();
    $this->get('/schema/registry')->assertNotFound();
});

it('never names a schema URL on this site that it does not serve', function () {
    // The class of bug, not the nine instances: a new `$schema` pointing at a
    // file nobody wrote fails here rather than in a consumer's editor.
    $sources = [
        ...File::allFiles(app_path()),
        ...File::allFiles(resource_path('docs')),
        ...File::glob(resource_path('registry/*.json')),
    ];

    $named = [];

    foreach ($sources as $file) {
        $path = is_string($file) ? $file : $file->getPathname();
        preg_match_all('#https://ui\.particle\.academy/schema/[A-Za-z0-9._-]+#', File::get($path), $matches);

        foreach ($matches[0] as $url) {
            $named[$url][] = str_replace(base_path().DIRECTORY_SEPARATOR, '', $path);
        }
    }

    expect($named)->not->toBeEmpty();

    foreach ($named as $url => $where) {
        expect(is_file(resource_path('schema/'.substr($url, strlen(SCHEMA_ORIGIN)))))
            ->toBeTrue("{$url} is named in ".implode(', ', array_unique($where)).' but no schema is published there');
    }
});

it('validates the component index against its schema, current and versioned', function () {
    $url = SCHEMA_ORIGIN.'registry.json';

    expect(count($this->get('/r/index.json')->json('items')))->toBeGreaterThan(100);

    expect([
        ...servedViolations($this, '/r/index.json', $url),
        ...servedViolations($this, '/r/index.json?version=0.4', $url),
    ])->toBe([]);
});

it('validates every component bundle against its schema', function () {
    $items = $this->get('/r/index.json')->json('items');

    expect(count($items))->toBeGreaterThan(100);

    $violations = [];

    foreach ($items as $item) {
        array_push($violations, ...servedViolations($this, $item['url'], SCHEMA_ORIGIN.'registry-item.json'));
    }

    expect($violations)->toBe([], implode("\n", array_slice($violations, 0, 20)));
});

it('validates the node index against its schema, filtered and not', function () {
    // A community submission, so the optional `name` path is exercised too:
    // first-party nodes have no package and never carry one.
    FlowNodePackage::create([
        'kind' => '@acme/crm_sync',
        'name' => 'acme/crm-sync-node',
        'title' => 'CRM Sync',
        'category' => 'io',
        'status' => FlowNodePackage::LISTED,
        'verified' => false,
        'runtimes' => ['ts'],
        'manifest' => ['kind' => '@acme/crm_sync', 'connector' => ['service' => 'acme', 'domain' => 'crm', 'role' => 'action']],
    ]);

    $index = $this->get('/r/nodes/index.json')->json();

    expect(count($index['items']))->toBeGreaterThan(20);
    expect(collect($index['items'])->pluck('name')->filter()->all())->toContain('acme/crm-sync-node');
    expect(collect($index['items'])->where('connector', true)->count())->toBeGreaterThan(1);

    $url = SCHEMA_ORIGIN.'node-registry.json';

    expect([
        ...servedViolations($this, '/r/nodes/index.json', $url),
        ...servedViolations($this, '/r/nodes/index.json?connectors=only', $url),
        ...servedViolations($this, '/r/nodes/index.json?connectors=exclude', $url),
        ...servedViolations($this, '/r/nodes/index.json?service=stripe', $url),
    ])->toBe([]);
});

it('keeps the node schema domain list in step with ConnectorFacet', function () {
    $schema = json_decode(File::get(resource_path('schema/node-registry.json')), true);

    expect($schema['$defs']['domain']['enum'])->toBe([...array_keys(ConnectorFacet::DOMAINS), 'other']);
});

it('rejects registry documents that drift from their schemas', function () {
    $index = json_decode((string) $this->get('/r/index.json')->getContent(), false);
    $indexSchema = schemaAt(SCHEMA_ORIGIN.'registry.json');

    $withExtra = clone $index;
    $withExtra->mirrors = [];
    expect($indexSchema->validate($withExtra))->not->toBe([]);

    $withoutItems = clone $index;
    unset($withoutItems->items);
    expect($indexSchema->validate($withoutItems))->not->toBe([]);

    $bundle = json_decode((string) $this->get('/r/card.json')->getContent(), false);
    $bundle->files[0]->target = 'src/Card.tsx';
    expect(schemaAt(SCHEMA_ORIGIN.'registry-item.json')->validate($bundle))->not->toBe([]);

    $nodes = json_decode((string) $this->get('/r/nodes/index.json')->getContent(), false);
    $nodes->items[0]->runtimes = 'ts';
    expect(schemaAt(SCHEMA_ORIGIN.'node-registry.json')->validate($nodes))->not->toBe([]);
});

it('validates the fancy.json fancy-cli writes and the one the docs show', function () {
    $schema = schemaAt(SCHEMA_ORIGIN.'fancy.json');

    // Byte for byte what `npx fancy-cli@0.8.2 init --yes` wrote into an empty project.
    $written = <<<'JSON'
    {
      "$schema": "https://ui.particle.academy/schema/fancy.json",
      "registry": "https://ui.particle.academy",
      "aliases": {
        "components": "@/components/fancy",
        "utils": "@/lib/utils"
      },
      "rsc": false,
      "tsx": true,
      "tailwind": {
        "css": "src/index.css"
      },
      "dirs": {
        "components": "src/components/fancy"
      }
    }
    JSON;

    expect($schema->validate(json_decode($written, false)))->toBe([]);

    preg_match('/```json\s*(\{\s*"\$schema": "https:\/\/ui\.particle\.academy\/schema\/fancy\.json".*?)```/s', File::get(resource_path('docs/cli.md')), $documented);

    expect($documented[1] ?? null)->not->toBeNull('docs/cli.md no longer shows a fancy.json');
    expect($schema->validate(json_decode($documented[1], false, flags: JSON_THROW_ON_ERROR)))->toBe([]);

    // A config file is where a schema earns its keep: it catches the typo.
    expect($schema->validate(json_decode('{"alias": {"components": "@/x"}}', false)))->not->toBe([]);
});

/**
 * The fields of a TypeScript interface, as `path => optional`.
 *
 * Nested object literals flatten to `parent.child`. Enough TypeScript for the
 * interfaces fancy-cli declares, and no more.
 *
 * @return array<string,bool>
 */
function tsInterfaceFields(string $source, string $interface): array
{
    $source = preg_replace('#/\*.*?\*/#s', '', $source) ?? $source;
    $source = preg_replace('#//[^\n]*#', '', $source) ?? $source;

    if (preg_match('/interface\s+'.$interface.'\s*\{/', $source, $m, PREG_OFFSET_CAPTURE) !== 1) {
        throw new RuntimeException("interface {$interface} not found");
    }

    $start = $m[0][1] + strlen($m[0][0]);

    return tsObjectFields(substr($source, $start, tsClosingBrace($source, $start) - $start), '');
}

/** Offset of the `}` closing the brace opened just before `$from`. */
function tsClosingBrace(string $source, int $from): int
{
    for ($depth = 1, $i = $from; $i < strlen($source); $i++) {
        $depth += match ($source[$i]) {
            '{' => 1, '}' => -1, default => 0
        };

        if ($depth === 0) {
            return $i;
        }
    }

    throw new RuntimeException('unbalanced braces');
}

/** @return array<string,bool> */
function tsObjectFields(string $body, string $prefix): array
{
    $fields = [];
    $i = 0;

    while (preg_match('/\G[\s;,]*(\$?[A-Za-z_]\w*)(\??)\s*:\s*/', $body, $m, 0, $i) === 1) {
        $key = $prefix.$m[1];
        $fields[$key] = $m[2] === '?';
        $i += strlen($m[0]);

        if (($body[$i] ?? '') === '{') {
            $close = tsClosingBrace($body, $i + 1);
            $fields += tsObjectFields(substr($body, $i + 1, $close - $i - 1), $key.'.');
            $i = $close + 1;

            continue;
        }

        // Skip the type to the end of the member, stepping over nested brackets.
        for ($depth = 0; $i < strlen($body); $i++) {
            $char = $body[$i];
            $depth += match ($char) {
                '{', '(', '[', '<' => 1, '}', ')', ']', '>' => -1, default => 0
            };

            if ($depth <= 0 && ($char === ';' || $char === "\n")) {
                break;
            }
        }
    }

    return $fields;
}

/** The subschema at a dotted property path, following local `$ref`s. */
function schemaNodeAt(array $root, array $node, string $path): ?array
{
    foreach ($path === '' ? [] : explode('.', $path) as $segment) {
        while (isset($node['$ref'])) {
            $node = $root['$defs'][substr($node['$ref'], strlen('#/$defs/'))];
        }

        $node = $node['properties'][$segment] ?? null;

        if ($node === null) {
            return null;
        }
    }

    while (isset($node['$ref'])) {
        $node = $root['$defs'][substr($node['$ref'], strlen('#/$defs/'))];
    }

    return $node;
}

it('declares every field fancy-cli reads, and requires every field it relies on', function () {
    $cli = dirname(base_path()).'/fancy-ui-cli/src';

    // [schema, subschema path inside it, CLI file, interface, whether CLI-required means schema-required]
    $bindings = [
        ['registry.json', '', 'registry.ts', 'RegistryIndex', true],
        ['registry.json', 'items[]', 'registry.ts', 'RegistryIndexItem', true],
        ['registry-item.json', '', 'registry.ts', 'RegistryItem', true],
        ['registry-item.json', 'files[]', 'registry.ts', 'RegistryFile', true],
        ['node-registry.json', '', 'nodes.ts', 'NodeIndex', true],
        ['node-registry.json', 'items[]', 'nodes.ts', 'NodeIndexItem', true],
        // A config file the CLI fills defaults into: nothing in it is required,
        // but everything it reads has to be declared or an editor flags it.
        ['fancy.json', '', 'config.ts', 'FancyConfig', false],
    ];

    foreach ($bindings as [$file, $at, $source, $interface, $requiredBinds]) {
        $root = json_decode(File::get(resource_path("schema/{$file}")), true);
        $base = $at === '' ? $root : schemaNodeAt($root, $root, rtrim($at, '[]'))['items'];

        while (isset($base['$ref'])) {
            $base = $root['$defs'][substr($base['$ref'], strlen('#/$defs/'))];
        }

        $fields = tsInterfaceFields(File::get("{$cli}/{$source}"), $interface);

        expect($fields)->not->toBeEmpty("{$interface} parsed to nothing");

        foreach ($fields as $path => $optional) {
            $parent = str_contains($path, '.') ? substr($path, 0, strrpos($path, '.')) : '';
            $leaf = str_contains($path, '.') ? substr($path, strrpos($path, '.') + 1) : $path;

            expect(schemaNodeAt($root, $base, $path))
                ->not->toBeNull("fancy-cli's {$interface}.{$path} is not declared in schema/{$file}");

            // `in_array` + `toBeTrue`, never `toContain($leaf, $message)`: Pest
            // reads every argument to `toContain` as a needle, so the message
            // would be asserted as a second required key.
            if ($requiredBinds && ! $optional) {
                expect(in_array($leaf, schemaNodeAt($root, $base, $parent)['required'] ?? [], true))
                    ->toBeTrue("fancy-cli relies on {$interface}.{$path}, but schema/{$file} lets a registry omit it");
            }
        }
    }
})->group('envelope');

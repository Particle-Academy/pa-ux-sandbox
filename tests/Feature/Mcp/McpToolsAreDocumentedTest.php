<?php

use App\Mcp\Servers\FancyUiRegistry;
use Illuminate\Support\Str;
use Tests\TestCase;

uses(TestCase::class);

/*
 * Every tool the install-MCP serves is listed on /docs/mcp.
 *
 * ## Why this is a test
 *
 * The table in `mcp.md` is a hand-maintained mirror of `FancyUiRegistry::$tools`,
 * and nothing checked the two agreed. They had already drifted: `upgrade-kit`,
 * `search-backend-packages` and `list-connector-services` were all registered,
 * shipped and serving, and named nowhere in the docs — found only because
 * someone added a fourth tool and happened to read the table.
 *
 * This is the same shape as `ReactFancyComponentListTest`, and it fails for the
 * same reason that one does: a capability that exists but is documented nowhere
 * is, for every consumer who reads the docs to find out what exists, identical
 * to one that was never built.
 *
 * It deliberately checks only that the tool is NAMED. Prose goes stale in ways a
 * test cannot judge; a missing row is unambiguous.
 */

it('names every registered MCP tool in the docs', function () {
    // Read the declared property rather than constructing the server: it takes
    // a Transport, and this check has nothing to do with transports.
    $tools = (new ReflectionClass(FancyUiRegistry::class))->getDefaultProperties()['tools'] ?? [];

    expect($tools)->not->toBeEmpty('no tools found on the server; this check would assert nothing');

    $docs = (string) file_get_contents(resource_path('docs/mcp.md'));

    $undocumented = [];

    foreach ($tools as $tool) {
        // Laravel MCP derives the wire name from the class name.
        $name = Str::kebab(class_basename($tool));

        if (! str_contains($docs, $name)) {
            $undocumented[] = $name;
        }
    }

    expect($undocumented)->toBe([], implode("\n", [
        'These MCP tools are registered and served but appear nowhere in resources/docs/mcp.md:',
        '  '.implode("\n  ", $undocumented),
        '',
        'Add a row to the install-MCP table. An agent that reads the docs to learn',
        'what this server offers cannot tell an undocumented tool from one that was',
        'never built.',
    ]));
});

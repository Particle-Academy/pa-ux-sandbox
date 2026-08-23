<?php

/**
 * The MCP's backend advice has to track what is actually published.
 *
 * It did not. Six Python packages went live on PyPI and `start_project` kept
 * routing Python into the "other" bucket, whose guidance is *"run the Node
 * packages from a small JS sidecar service"* — advice that was true when it was
 * written and false by the time anyone read it. Nothing failed; the tool
 * answered confidently and wrongly, which is the worst shape a docs surface can
 * take because a consumer has no way to know.
 *
 * The rule this pins: **a language becomes an MCP backend in the same change
 * that publishes its first package.**
 */

use App\Mcp\Tools\StartProject;
use App\Support\PackageFamily;
use App\Support\PackageRegistry;

/** Reach a private method without standing the whole MCP request up. */
function callPrivate(string $method, mixed ...$args): mixed
{
    $r = new ReflectionClass(StartProject::class);
    $m = $r->getMethod($method);
    $m->setAccessible(true);

    return $m->invoke($r->newInstanceWithoutConstructor(), ...$args);
}

it('routes every Python framework to the Python backend, not "other"', function () {
    foreach (['python', 'py', 'django', 'fastapi', 'flask'] as $input) {
        expect(callPrivate('normalizeBackend', $input))->toBe('python', "'{$input}' should route to python");
    }
});

it('still routes genuinely unsupported languages to "other"', function () {
    // Guards the fix from overreaching — "other" is honest for these.
    foreach (['go', 'rails', 'dotnet', 'rust'] as $input) {
        expect(callPrivate('normalizeBackend', $input))->toBe('other');
    }
});

it('offers only Python packages that are really on PyPI', function () {
    $offered = array_values(callPrivate('python')['server_packages']);

    expect($offered)->not->toBeEmpty();

    // Every name must trace to a registry entry with a `pypi` field. Advice to
    // `pip install` something we never published is the failure this whole test
    // file exists to prevent.
    $published = collect([...PackageRegistry::all(), ...PackageRegistry::companions()])
        ->pluck('pypi')
        ->filter()
        ->values()
        ->all();

    foreach ($offered as $name) {
        expect($published)->toContain($name);
    }
});

it('carries Python through the shared mirror table', function () {
    // mcpPairs() is the ONE source shared with /packages, so a mirror added
    // there shows up in both or in neither.
    $withPython = collect(PackageFamily::mcpPairs())->filter(fn (array $p) => ($p['python'] ?? null) !== null);

    expect($withPython)->toHaveCount(6);
});

it('names the framework-coupled gap instead of implying full parity', function () {
    // Python has the framework-free cores and not the rest. Saying so is the
    // difference between a useful answer and one that sends someone looking for
    // a package that does not exist.
    $notes = implode(' ', callPrivate('python')['notes']);

    expect($notes)->toContain('NOT YET on PyPI');
});

it('stops telling Python users their only option is a JS sidecar', function () {
    $other = callPrivate('other');

    expect($other['label'])->not->toContain('Python,');
    expect($other['pick_when'])->toContain('Python');
});

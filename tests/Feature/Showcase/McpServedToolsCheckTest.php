<?php

use App\Mcp\Servers\FancyUiRegistry;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

uses(TestCase::class);

/*
 * `mcp:served` — does the live endpoint serve what this server declares?
 *
 * `search-backend-packages` was committed 2026-08-22, merged, deployed, and
 * never served. A month later the public `tools/list` returned 15 against the
 * 18 declared. Nothing caught it because nothing compared the two: the site was
 * current, the MCP's DATA was current, and a cache-busted `tools/list` still
 * returned 15 — every signal anyone would think to check said "deployed".
 *
 * So the interesting assertions here are the failure ones, and especially the
 * ones where the command must refuse to pass: an unreachable endpoint and an
 * empty declared list both look like agreement if you only compare two lists.
 *
 * Every request is faked. A test that reached the real endpoint would measure
 * the network and go red on a Tuesday for reasons having nothing to do with
 * this repo — and would pass or fail depending on a deploy, which is the thing
 * under test rather than a precondition of it.
 */

/** A `tools/list` response carrying exactly these names. */
function toolsListResponse(array $names): array
{
    return [
        'jsonrpc' => '2.0',
        'id' => 1,
        'result' => ['tools' => array_map(fn (string $n) => ['name' => $n], $names)],
    ];
}

/** Every tool name this server declares, asked the way the server asks. */
function declaredNames(): array
{
    $reflection = new ReflectionClass(FancyUiRegistry::class);
    $property = $reflection->getProperty('tools');
    $property->setAccessible(true);

    $names = [];
    foreach ((array) $property->getValue($reflection->newInstanceWithoutConstructor()) as $class) {
        $names[] = app($class)->name();
    }

    // Guard the guard: an empty list would make every case below pass for the
    // wrong reason, which is the exact failure this command exists to remove.
    expect($names)->not->toBeEmpty('the server declares no tools; these cases would assert nothing');

    return $names;
}

it('passes when the endpoint serves exactly what is declared', function () {
    Http::fake(['*' => Http::response(toolsListResponse(declaredNames()), 200)]);

    $this->artisan('mcp:served')->assertSuccessful();
});

it('FAILS when a declared tool is not served', function () {
    // The real incident, reduced: the last three appended to $tools were
    // registered and unreachable, and every other signal read as healthy.
    $served = declaredNames();
    $dropped = array_pop($served);

    Http::fake(['*' => Http::response(toolsListResponse($served), 200)]);

    $this->artisan('mcp:served')
        ->expectsOutputToContain($dropped)
        ->assertFailed();
});

it('FAILS when the endpoint serves something this build does not declare', function () {
    // The other direction: the endpoint is running a different build. Reported
    // separately because the remedy is the opposite one.
    Http::fake(['*' => Http::response(toolsListResponse([...declaredNames(), 'ghost-tool']), 200)]);

    $this->artisan('mcp:served')
        ->expectsOutputToContain('ghost-tool')
        ->assertFailed();
});

it('FAILS on an unreachable endpoint rather than counting it as agreement', function () {
    // A 500 is not a "yes" and not a "no" — it is the absence of an answer, and
    // a check that reassures on failure is worse than no check.
    Http::fake(['*' => Http::response('upstream exploded', 500)]);

    $this->artisan('mcp:served')->assertFailed();
});

it('FAILS on a malformed response rather than reading it as zero tools', function () {
    // 200 with no `result.tools` is not "it serves nothing". Treating it that
    // way would report every declared tool as missing — a loud wrong answer,
    // which is still a wrong answer.
    Http::fake(['*' => Http::response(['jsonrpc' => '2.0', 'id' => 1], 200)]);

    $this->artisan('mcp:served')->assertFailed();
});

it('compares NAMES, not a count', function () {
    // One tool added and another removed keeps the count identical. A count
    // check passes there, for the wrong reason.
    $served = declaredNames();
    $served[0] = 'renamed-tool';

    Http::fake(['*' => Http::response(toolsListResponse($served), 200)]);

    $this->artisan('mcp:served')->assertFailed();
});

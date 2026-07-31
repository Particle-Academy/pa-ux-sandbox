<?php

declare(strict_types=1);

use FancyFlow\Nodes\UiEffect\NullUiEffectHost;
use FancyFlow\Nodes\UiEffect\UiEffect;
use FancyFlow\Nodes\UiEffect\UiEffectExecutor;
use FancyFlow\Runtime\ExecutionContext;
use FancyFlow\Schema\FlowNode;

/**
 * The PHP backend, against the SAME golden fixtures the TypeScript one runs.
 *
 * That is the whole point of the fixtures being in the manifest rather than in
 * a test file: cross-runtime drift does not fail loudly — a node just behaves
 * differently on one runtime and both runs report success — so it has to be
 * caught by something that executes, on both.
 */
function ctx(array $config, mixed $input = null): ExecutionContext
{
    return new ExecutionContext(
        node: new FlowNode(
            id: 'fx',
            type: '@particle-academy/ui_effect',
            config: $config,
        ),
        inputs: ['in' => $input],
        emit: static fn () => null,
    );
}

/** @return array<string,mixed> */
function fixtures(): array
{
    return json_decode(
        (string) file_get_contents(__DIR__.'/../../../resources/flow-nodes/ui-effect/fixtures/ui-effect.json'),
        true,
    );
}

it('runs every golden fixture the TypeScript backend runs', function () {
    $file = fixtures();

    foreach ($file['cases'] as $case) {
        $host = new NullUiEffectHost;
        $executor = new UiEffectExecutor($host);
        $expected = $case['expect'];

        if (isset($expected['error'])) {
            $thrown = null;
            try {
                $executor->execute(ctx($case['config'] ?? []));
            } catch (Throwable $e) {
                $thrown = $e;
            }

            // Assert on the fixture's own substring, not merely "it threw".
            // Both runtimes producing the SAME message is the parity claim; two
            // different explanations for one bad config is drift.
            expect($thrown)->not->toBeNull("case: {$case['name']} did not throw");
            expect($thrown->getMessage())->toContain($expected['error']);

            // And it must have thrown BEFORE reaching the host — a node that
            // validates after applying has already changed the surface.
            expect($host->applied())->toBe([]);

            continue;
        }

        $out = $executor->execute(ctx($case['config'] ?? [], $case['inputs'] ?? null));

        if (isset($expected['value'])) {
            expect($out)->toEqual($expected['value']);
        }

        expect($host->applied())->toHaveCount(1);
    }
});

it('refuses to run with no host bound', function () {
    // PHP has no DOM. Shrugging here would mean a queue worker delivering
    // nothing and reporting success, with nobody watching to notice.
    $executor = new UiEffectExecutor;

    expect(fn () => $executor->execute(ctx(['target' => 'page', 'op' => 'add-class', 'value' => 'x'])))
        ->toThrow(RuntimeException::class, 'no UI host bound');
});

it('carries the same wire shape as the TypeScript type', function () {
    // The browser applies this payload with the same code an in-browser run
    // uses, so the key names are a contract, not an implementation detail.
    $effect = UiEffect::fromConfig(['target' => 'card', 'op' => 'add-class', 'value' => 'glow', 'durationMs' => 1200]);

    expect($effect->toArray())->toBe([
        'target' => 'card',
        'op' => 'add-class',
        'value' => 'glow',
        'name' => '',
        'durationMs' => 1200,
    ]);
});

it('defaults the target to the page', function () {
    expect(UiEffect::fromConfig(['op' => 'add-class', 'value' => 'x'])->target)->toBe('page');
    expect(UiEffect::fromConfig(['target' => '   ', 'op' => 'add-class', 'value' => 'x'])->target)->toBe('page');
});

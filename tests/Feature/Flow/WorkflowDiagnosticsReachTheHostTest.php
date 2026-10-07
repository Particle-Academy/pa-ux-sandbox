<?php

declare(strict_types=1);

use FancyFlow\Laravel\FancyFlowManager;
use Illuminate\Support\Facades\Log;
use Tests\TestCase;

uses(TestCase::class);

/**
 * fancy-flow's silent-failure warnings must reach THIS application.
 *
 * Asserted through the listener and the log, never by calling the emitter. That
 * distinction is the whole point: the engine's own suites already prove the
 * warning is emitted, and `fancy-flow-php` proves it is dispatched as a Laravel
 * event on both queue drivers. What nothing checked was whether a
 * consumer-shaped app receives it — and this one did not, because the event had
 * no subscriber. A test that called the emitter would have passed throughout.
 *
 * The graph is `flow/run-diagnostics` row 0008: an edge whose `sourceHandle`
 * names a port its completed source never publishes. Nothing reaches the target
 * at run time, the run still reports success, and the warning is the only thing
 * that distinguishes it from a workflow that worked.
 *
 * pa-ux-sandbox#1.
 */
it('writes a fancy-flow warning to the log when an edge delivers nothing', function (): void {
    Log::spy();

    $result = app(FancyFlowManager::class)->run([
        '$schema' => 'https://particle.academy/schemas/workflow/v1.json',
        'version' => 1,
        'graph' => [
            'nodes' => [
                ['id' => 't', 'kind' => 'manual_trigger', 'position' => ['x' => 0, 'y' => 0]],
                ['id' => 'tf', 'kind' => 'transform', 'position' => ['x' => 0, 'y' => 0], 'config' => ['expression' => '{{ $json.name }}']],
                ['id' => 'o', 'kind' => 'output', 'position' => ['x' => 0, 'y' => 0]],
            ],
            'edges' => [
                ['id' => 'e1', 'source' => 't', 'target' => 'tf'],
                // `result` is not a port of `transform`. The source completes,
                // so this can never bind on any run.
                ['id' => 'e2', 'source' => 'tf', 'target' => 'o', 'sourceHandle' => 'result'],
            ],
        ],
    ], ['t' => ['name' => 'Ada']]);

    // The run succeeding is the premise, not an aside: a failure would be
    // visible on its own and would need no diagnostic.
    expect($result->ok)->toBeTrue();

    Log::shouldHaveReceived('log')
        ->withArgs(function (string $level, string $message, array $context = []): bool {
            return $level === 'warning'
                && str_contains($message, 'e2')
                && ($context['detail']['edge'] ?? null) === 'e2';
        })
        ->atLeast()->once();
});

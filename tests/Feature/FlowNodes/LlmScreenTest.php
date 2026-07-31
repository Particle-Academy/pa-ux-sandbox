<?php

declare(strict_types=1);

use FancyFlow\Nodes\LlmScreen\GeneratedScreen;
use FancyFlow\Nodes\LlmScreen\LlmScreenExecutor;
use FancyFlow\Nodes\LlmScreen\LlmScreenHost;
use FancyFlow\Runtime\ExecutionContext;
use FancyFlow\Schema\FlowNode;

/**
 * The PHP backend, against the SAME golden fixtures the TypeScript one runs.
 *
 * The case that earns this file is the unknown-component one: fancy-screens
 * renders an unregistered name as a visible placeholder, so a workflow that
 * emits one completes, reports success, and delivers an error message to a
 * person. Both runtimes have to refuse it, with the same words.
 */
function llmScreenCtx(array $config, mixed $input = null): ExecutionContext
{
    return new ExecutionContext(
        node: new FlowNode(
            id: 'fx',
            type: '@particle-academy/llm_screen',
            config: $config,
        ),
        inputs: ['in' => $input],
        emit: static fn () => null,
    );
}

const LLM_SCREEN_COMPONENTS = ['Card', 'Text', 'Stack'];

/** A tree that nests past the depth limit. */
function nested(int $depth): array
{
    return $depth === 0
        ? ['type' => 'Text', 'children' => ['deep']]
        : ['type' => 'Stack', 'children' => [nested($depth - 1)]];
}

function llmScreenHost(array &$presented): LlmScreenHost
{
    return new class($presented) implements LlmScreenHost
    {
        public function __construct(private array &$presented) {}

        public function components(): array
        {
            return LLM_SCREEN_COMPONENTS;
        }

        public function generate(array $request): array
        {
            return match ($request['purpose']) {
                'use an unknown component' => ['schema' => [
                    'type' => 'Card',
                    'children' => [['type' => 'DataGrid'], ['type' => 'DataGrid']],
                ]],
                'nest forever' => ['schema' => nested(20)],
                'return junk' => ['schema' => ['children' => []]],
                default => [
                    'title' => 'Generated',
                    'schema' => [
                        'type' => 'Card',
                        'props' => ['title' => 'Deploy summary'],
                        'children' => [['type' => 'Text', 'children' => ['3 services moved.']]],
                    ],
                ],
            };
        }

        public function present(array $screen): void
        {
            $this->presented[] = $screen;
        }
    };
}

/** @return array<string,mixed> */
function llmScreenFixtures(): array
{
    return json_decode(
        (string) file_get_contents(__DIR__.'/../../../resources/flow-nodes/llm-screen/fixtures/llm-screen.json'),
        true,
    );
}

it('runs every golden fixture the TypeScript backend runs', function () {
    $file = llmScreenFixtures();

    foreach ($file['cases'] as $case) {
        $presented = [];
        $executor = new LlmScreenExecutor(llmScreenHost($presented));
        $expected = $case['expect'];

        if (isset($expected['error'])) {
            $thrown = null;
            try {
                $executor->execute(llmScreenCtx($case['config'] ?? []));
            } catch (Throwable $e) {
                $thrown = $e;
            }

            expect($thrown)->not->toBeNull("case: {$case['name']} did not throw");
            expect($thrown->getMessage())->toContain($expected['error']);

            // And it must have thrown BEFORE presenting — a node that validates
            // after presenting has already put the placeholder on the screen.
            expect($presented)->toBe([]);

            continue;
        }

        $out = $executor->execute(llmScreenCtx($case['config'] ?? [], $case['inputs'] ?? null));

        if (isset($expected['value'])) {
            expect($out)->toEqual($expected['value']);
        }

        expect($presented)->toHaveCount(1);
    }
});

it('refuses to run with no host bound', function () {
    $presented = [];
    $executor = new LlmScreenExecutor;

    expect(fn () => $executor->execute(llmScreenCtx(['purpose' => 'x', 'screenId' => 'y'])))
        ->toThrow(RuntimeException::class);

    expect($presented)->toBe([]);
});

it('returns the schema without presenting when asked not to show it', function () {
    // A workflow may want the schema as data — to store, diff, or hand to a
    // later step — and forcing a presentation step would make that impossible.
    $presented = [];
    $executor = new LlmScreenExecutor(llmScreenHost($presented));

    $out = $executor->execute(llmScreenCtx([
        'purpose' => 'Show the deploy result.',
        'screenId' => 'deploy-summary',
        'present' => false,
    ]));

    expect($presented)->toBe([]);
    expect($out['screenId'])->toBe('deploy-summary');
});

it('reports an unknown component once, not once per occurrence', function () {
    // A model that gets a name wrong usually uses it a dozen times, and a dozen
    // identical lines buries every other problem in the list.
    $problems = GeneratedScreen::problems(
        ['type' => 'Card', 'children' => [['type' => 'DataGrid'], ['type' => 'DataGrid']]],
        LLM_SCREEN_COMPONENTS,
    );

    expect(array_filter($problems, fn ($p) => str_contains($p, 'unknown component "DataGrid"')))->toHaveCount(1);
    expect(end($problems))->toContain('registered components are: Card, Text, Stack');
});

it('names the empty registry rather than an empty list', function () {
    // "registered components are: " with nothing after it reads as a bug in
    // the error, not as the actual diagnosis.
    $problems = GeneratedScreen::problems(['type' => 'Card'], []);

    expect(end($problems))->toContain('(none — the host registered nothing)');
});

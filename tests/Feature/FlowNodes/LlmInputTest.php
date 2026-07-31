<?php

declare(strict_types=1);

use FancyFlow\Nodes\LlmInput\GeneratedForm;
use FancyFlow\Nodes\LlmInput\LlmFormHost;
use FancyFlow\Nodes\LlmInput\LlmInputExecutor;
use FancyFlow\Runtime\ExecutionContext;
use FancyFlow\Runtime\Pause;
use FancyFlow\Schema\FlowNode;

/**
 * The PHP backend, against the SAME golden fixtures the TypeScript one runs.
 *
 * That is the whole point of the fixtures living in the manifest rather than a
 * test file: cross-runtime drift does not fail loudly — a node behaves
 * differently on one runtime and both runs report success — so it has to be
 * caught by something that executes, on both.
 */
function llmInputCtx(array $config, mixed $input = null): ExecutionContext
{
    return new ExecutionContext(
        node: new FlowNode(
            id: 'fx',
            type: '@particle-academy/llm_input',
            config: $config,
        ),
        inputs: ['in' => $input],
        emit: static fn () => null,
    );
}

/**
 * A host that answers from the purpose string, mirroring the TS test's.
 *
 * Keyed on purpose rather than a call counter so the cases stay independent —
 * a counter makes every case depend on the order of the ones before it.
 */
function llmFormHost(array &$asked): LlmFormHost
{
    return new class($asked) implements LlmFormHost
    {
        public function __construct(private array &$asked) {}

        public function generate(array $request): array
        {
            $this->asked[] = $request;

            return match ($request['purpose']) {
                'return nothing' => ['fields' => []],
                'return duplicates' => ['fields' => [
                    ['key' => 'reason', 'label' => 'Why', 'type' => 'text'],
                    ['key' => 'reason', 'label' => 'Why again', 'type' => 'text'],
                ]],
                'return three' => ['fields' => [
                    ['key' => 'a', 'label' => 'A', 'type' => 'text'],
                    ['key' => 'b', 'label' => 'B', 'type' => 'text'],
                    ['key' => 'c', 'label' => 'C', 'type' => 'text'],
                ]],
                default => [
                    'title' => 'Refund details',
                    'fields' => [
                        ['key' => 'reason', 'label' => 'Why the refund', 'type' => 'textarea', 'required' => true],
                        ['key' => 'amount', 'label' => 'Amount', 'type' => 'number'],
                    ],
                ],
            };
        }
    };
}

/** @return array<string,mixed> */
function llmInputFixtures(): array
{
    return json_decode(
        (string) file_get_contents(__DIR__.'/../../../resources/flow-nodes/llm-input/fixtures/llm-input.json'),
        true,
    );
}

it('runs every golden fixture the TypeScript backend runs', function () {
    $file = llmInputFixtures();

    foreach ($file['cases'] as $case) {
        $asked = [];
        $executor = new LlmInputExecutor(llmFormHost($asked));
        $expected = $case['expect'];

        $thrown = null;
        try {
            $executor->execute(llmInputCtx($case['config'] ?? [], $case['inputs'] ?? null));
        } catch (Throwable $e) {
            $thrown = $e;
        }

        // This node ALWAYS aborts: a pause travels the same channel as a
        // failure, by design, so the assertion is on which one it was.
        expect($thrown)->not->toBeNull("case: {$case['name']} neither paused nor failed");

        if (isset($expected['error'])) {
            // Assert on the fixture's own substring, not merely "it threw".
            // Both runtimes producing the SAME message is the parity claim; two
            // different explanations for one bad form is drift.
            expect($thrown->getMessage())->toContain($expected['error']);

            continue;
        }

        $pause = Pause::decode($thrown->getMessage());

        expect($pause)->not->toBeNull("case: {$case['name']} failed instead of pausing: {$thrown->getMessage()}");
        expect($pause->awaiting)->toBe($expected['pause']['awaiting']);

        if (isset($expected['pause']['detail'])) {
            expect($pause->detail)->toEqual($expected['pause']['detail']);
        }
    }
});

it('never reaches the model for a case rejected on config alone', function () {
    // A node that validates after the call bills the consumer for its own bug.
    $asked = [];
    $executor = new LlmInputExecutor(llmFormHost($asked));

    try {
        $executor->execute(llmInputCtx([]));
    } catch (Throwable) {
        // expected
    }

    expect($asked)->toBe([]);
});

it('refuses to run with no host bound', function () {
    // Shrugging here would park a run on an empty form — indistinguishable
    // from one waiting for a person who never comes.
    $executor = new LlmInputExecutor;

    expect(fn () => $executor->execute(llmInputCtx(['purpose' => 'anything'])))
        ->toThrow(RuntimeException::class);
});

it('reports every problem with a form at once, not just the first', function () {
    // An author fixing a prompt wants the whole list; a checker that reveals
    // one defect per run turns a five-minute fix into five round trips.
    $problems = GeneratedForm::problems([
        ['label' => 'No key'],
        ['key' => 'a'],
        ['key' => 'a', 'label' => 'Dup', 'type' => 'nope'],
    ], ['missing']);

    expect($problems)->toHaveCount(5);
    expect(implode(' | ', $problems))->toContain('missing required key: missing');
});

it('defaults a type rather than dropping the field', function () {
    // `text` is the only default that cannot lose information: a textarea
    // rendered as text still accepts the answer, a switch does not.
    expect(GeneratedForm::normalize([['key' => 'a', 'label' => 'A']]))
        ->toBe([['key' => 'a', 'label' => 'A', 'type' => 'text', 'required' => false]]);
});

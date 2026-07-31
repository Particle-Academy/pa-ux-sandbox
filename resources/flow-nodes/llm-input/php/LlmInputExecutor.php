<?php

declare(strict_types=1);

namespace FancyFlow\Nodes\LlmInput;

use FancyFlow\Attributes\FlowNode;
use FancyFlow\Contracts\NodeExecutor;
use FancyFlow\Runtime\ExecutionContext;
use FancyFlow\Runtime\RunEvent;

/**
 * The PHP backend for `@particle-academy/llm_input`.
 *
 * The same shape as `../js/executor.ts`: resolve config, ask the host for a
 * form, check it HERE, then pause on it. Validation lives in the executor on
 * both runtimes so a bad form produces the identical error whichever one ran
 * it — which is what the shared golden fixtures assert.
 *
 * ## Why the pause detail matches the builtin
 *
 * `DurableUserInputExecutor` already pauses with `['title' => …, 'fields' => …]`
 * and every host that renders a paused run knows that shape. Emitting the same
 * one means a generated form needs nothing new wired: it is a form, not a new
 * kind of wait. `generated: true` is the only addition, so a UI can say the
 * questions were written by a model rather than implying a person wrote them.
 */
#[FlowNode(
    name: '@particle-academy/llm_input',
    category: 'human',
    label: 'AI Form',
    description: 'Ask a model to write the form this step pauses on, from the run\'s own data — for the steps whose questions are not known in advance.',
    icon: '✦',
    inputs: [['id' => 'in']],
    outputs: [['id' => 'out', 'label' => 'values']],
    aliases: ['llm_input'],
)]
final class LlmInputExecutor implements NodeExecutor
{
    public function __construct(private readonly ?LlmFormHost $host = null) {}

    public function execute(ExecutionContext $ctx): mixed
    {
        if ($this->host === null) {
            // Refuse rather than pause on an empty form. A run parked on
            // nothing is indistinguishable from one waiting for a person who
            // never comes — and on a queue worker nobody is watching to notice.
            throw new \RuntimeException(
                'llm_input: no form host bound. Bind '.LlmFormHost::class.' to your provider adapter — '
                .'this node ships the form contract and the pause, not the model call.'
            );
        }

        $config = $ctx->config();
        $purpose = trim((string) ($config['purpose'] ?? ''));

        if ($purpose === '') {
            throw new \InvalidArgumentException('llm_input: needs a `purpose` — what the form is for.');
        }

        $requiredKeys = self::keys($config['requiredKeys'] ?? null);
        $maxFields = isset($config['maxFields']) ? (int) $config['maxFields'] : null;

        $ctx->emit(RunEvent::log('info', "Generating a form: {$purpose}", $ctx->node->id));

        $result = $this->host->generate([
            'purpose' => $purpose,
            // The run's own data. A form generated blind asks for what the run
            // already knows, which is what makes a dynamic form worse than a
            // static one.
            'context' => ($config['includeContext'] ?? true) === false ? null : $ctx->input(),
            'requiredKeys' => $requiredKeys,
            'maxFields' => $maxFields,
            'provider' => isset($config['provider']) ? (string) $config['provider'] : null,
            'model' => isset($config['model']) ? (string) $config['model'] : null,
            'credential' => isset($config['credential']) ? (string) $config['credential'] : null,
        ]);

        $problems = GeneratedForm::problems($result['fields'] ?? null, $requiredKeys, $maxFields);

        if ($problems !== []) {
            throw new \RuntimeException('llm_input: the generated form is not usable — '.implode('; ', $problems).'.');
        }

        $fields = GeneratedForm::normalize($result['fields']);
        $count = count($fields);

        $ctx->emit(RunEvent::log(
            'info',
            "Pausing on {$count} generated field".($count === 1 ? '' : 's'),
            $ctx->node->id,
        ));

        // Never returns. The run job parks the run; the submitted values arrive
        // as this node's output on resume.
        $ctx->pauseForHuman('input', [
            'title' => (string) ($config['title'] ?? $result['title'] ?? 'Need your input'),
            'fields' => $fields,
            'generated' => true,
        ]);
    }

    /**
     * @return list<string>
     */
    private static function keys(mixed $value): array
    {
        if (is_array($value)) {
            return array_values(array_filter(array_map(fn ($v) => trim((string) $v), $value), fn ($v) => $v !== ''));
        }
        if (is_string($value)) {
            return array_values(array_filter(array_map('trim', explode(',', $value)), fn ($v) => $v !== ''));
        }

        return [];
    }
}

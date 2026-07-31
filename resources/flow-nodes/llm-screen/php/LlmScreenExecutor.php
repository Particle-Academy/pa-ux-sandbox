<?php

declare(strict_types=1);

namespace FancyFlow\Nodes\LlmScreen;

use FancyFlow\Attributes\FlowNode;
use FancyFlow\Contracts\NodeExecutor;
use FancyFlow\Runtime\ExecutionContext;
use FancyFlow\Runtime\RunEvent;

/**
 * The PHP backend for `@particle-academy/llm_screen`.
 *
 * The same shape as `../js/executor.ts`: ask the host what components exist,
 * ask it for a schema, check the schema HERE, then present it. Validation lives
 * in the executor on both runtimes so a bad schema produces the identical error
 * whichever one ran it — which is what the shared golden fixtures assert.
 *
 * ## Why a bad schema is a failed run
 *
 * fancy-screens renders an unregistered component name as a visible orange
 * placeholder. That is the right call for a developer typing a schema by hand
 * and the wrong outcome for a workflow: the run completes, reports success, and
 * what arrives on someone's screen is an error message. On a queue worker there
 * is nobody watching to notice, so the node refuses instead.
 */
#[FlowNode(
    name: '@particle-academy/llm_screen',
    category: 'io',
    label: 'AI Screen',
    description: 'Let a model build the interface this step shows, from the components the host registered — rendered by fancy-screens\' schema surface.',
    icon: '▦',
    inputs: [['id' => 'in']],
    outputs: [['id' => 'out', 'label' => 'schema']],
    aliases: ['llm_screen'],
)]
final class LlmScreenExecutor implements NodeExecutor
{
    public function __construct(private readonly ?LlmScreenHost $host = null) {}

    public function execute(ExecutionContext $ctx): mixed
    {
        if ($this->host === null) {
            throw new \RuntimeException(
                'llm_screen: no screen host bound. Bind '.LlmScreenHost::class.' to your provider adapter and '
                .'your registered component list — this node ships the contract and the checks, not the model call.'
            );
        }

        $config = $ctx->config();
        $purpose = trim((string) ($config['purpose'] ?? ''));

        if ($purpose === '') {
            throw new \InvalidArgumentException('llm_screen: needs a `purpose` — what the interface is for.');
        }

        $screenId = trim((string) ($config['screenId'] ?? ''));

        if ($screenId === '') {
            // Required rather than defaulted. A generated screen with a guessed
            // id collides with whatever else claimed it, and fancy-screens keys
            // its registry — and its store prefixes — on exactly this string.
            throw new \InvalidArgumentException('llm_screen: needs a `screenId` — the fancy-screens id this renders into.');
        }

        $components = $this->host->components();
        $count = count($components);

        $ctx->emit(RunEvent::log(
            'info',
            "Generating a screen for \"{$screenId}\" from {$count} registered component".($count === 1 ? '' : 's'),
            $ctx->node->id,
        ));

        $result = $this->host->generate([
            'purpose' => $purpose,
            'components' => $components,
            'context' => ($config['includeContext'] ?? true) === false ? null : $ctx->input(),
            'provider' => isset($config['provider']) ? (string) $config['provider'] : null,
            'model' => isset($config['model']) ? (string) $config['model'] : null,
            'credential' => isset($config['credential']) ? (string) $config['credential'] : null,
        ]);

        $problems = GeneratedScreen::problems($result['schema'] ?? null, $components);

        if ($problems !== []) {
            throw new \RuntimeException('llm_screen: the generated screen will not render — '.implode('; ', $problems).'.');
        }

        $title = isset($config['title']) ? (string) $config['title'] : ($result['title'] ?? null);
        $screen = ['screenId' => $screenId, 'title' => $title, 'schema' => $result['schema']];

        // Presenting is optional: a workflow may want the schema as data — to
        // store, diff, or hand to a later step — and forcing a presentation
        // step would make that impossible.
        if (($config['present'] ?? true) !== false) {
            $this->host->present($screen);
        }

        return $screen;
    }
}

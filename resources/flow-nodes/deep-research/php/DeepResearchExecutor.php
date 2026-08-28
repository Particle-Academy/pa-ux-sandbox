<?php

declare(strict_types=1);

namespace FancyFlow\Nodes\DeepResearch;

use FancyFlow\Attributes\FlowNode;
use FancyFlow\Contracts\NodeExecutor;
use FancyFlow\Runtime\ExecutionContext;
use FancyFlow\Runtime\RunEvent;

#[FlowNode(
    name: '@particle-academy/deep_research',
    category: 'ai',
    label: 'Deep Research',
    description: 'Run a long-form, cited research task through the host research provider.',
    icon: '⌕',
    inputs: [['id' => 'in', 'label' => 'context']],
    outputs: [['id' => 'out', 'label' => 'research']],
    aliases: ['deep_research'],
)]
final class DeepResearchExecutor implements NodeExecutor
{
    public function __construct(private readonly ?DeepResearchHost $host = null) {}

    public function execute(ExecutionContext $ctx): mixed
    {
        $config = $ctx->config();
        $query = trim((string) ($config['query'] ?? ''));
        if ($query === '') {
            throw new \InvalidArgumentException('deep_research: needs a `query` to investigate.');
        }

        $host = $this->host ?? throw new \RuntimeException(
            'deep_research: no research host bound. Bind '.DeepResearchHost::class.' to a provider adapter.'
        );
        $maxSources = (int) ($config['maxSources'] ?? 8);
        if ($maxSources < 1) {
            throw new \InvalidArgumentException('deep_research: `maxSources` must be a positive integer.');
        }

        $ctx->emit(RunEvent::log('info', "Researching: {$query}", $ctx->node->id));
        $result = $host->research([
            'query' => $query,
            'instructions' => self::optionalString($config['instructions'] ?? null),
            'context' => ($config['includeContext'] ?? true) === false ? null : $ctx->input(),
            'depth' => (string) ($config['depth'] ?? 'deep'),
            'maxSources' => $maxSources,
            'provider' => self::optionalString($config['provider'] ?? null),
            'model' => self::optionalString($config['model'] ?? null),
            'credential' => self::optionalString($config['credential'] ?? null),
        ]);
        $answer = trim((string) ($result['answer'] ?? ''));
        if ($answer === '') {
            throw new \RuntimeException('deep_research: the host returned no answer.');
        }

        $result['answer'] = $answer;
        $result['citations'] = array_values(array_filter(
            is_array($result['citations'] ?? null) ? $result['citations'] : [],
            static fn ($citation): bool => is_array($citation) && trim((string) ($citation['url'] ?? '')) !== '',
        ));

        return $result;
    }

    private static function optionalString(mixed $value): ?string
    {
        $resolved = trim((string) ($value ?? ''));

        return $resolved === '' ? null : $resolved;
    }
}

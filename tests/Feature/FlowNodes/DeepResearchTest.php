<?php

declare(strict_types=1);

use FancyFlow\Attributes\FlowNode as FlowNodeAttribute;
use FancyFlow\Nodes\DeepResearch\DeepResearchExecutor;
use FancyFlow\Nodes\DeepResearch\DeepResearchHost;
use FancyFlow\Runtime\ExecutionContext;
use FancyFlow\Schema\FlowNode;

function deepResearchContext(array $config, mixed $input = null): ExecutionContext
{
    return new ExecutionContext(
        node: new FlowNode(id: 'research', type: '@particle-academy/deep_research', config: $config),
        inputs: ['in' => $input],
        emit: static fn () => null,
    );
}

it('matches the deep research marketplace fixture contract', function () {
    $requests = [];
    $host = new class($requests) implements DeepResearchHost
    {
        public function __construct(private array &$requests) {}

        public function research(array $request): array
        {
            $this->requests[] = $request;

            return [
                'answer' => 'Researched: '.$request['query'],
                'citations' => [['url' => 'https://example.test/source', 'title' => 'Primary source', 'excerpt' => 'Evidence']],
                'provider' => 'perplexity',
                'model' => 'sonar-deep-research',
                'usage' => ['inputTokens' => 12, 'outputTokens' => 34],
            ];
        }
    };

    $executor = new DeepResearchExecutor($host);
    $result = $executor->execute(deepResearchContext([
        'query' => 'How do durable workflows recover?',
        'depth' => 'deep',
        'maxSources' => 8,
        'includeContext' => true,
    ], ['topic' => 'workflow engines']));

    expect($result['answer'])->toBe('Researched: How do durable workflows recover?')
        ->and($result['citations'])->toHaveCount(1)
        ->and($requests[0]['context'])->toEqual(['topic' => 'workflow engines']);
});

it('fails before calling a host when no research question exists', function () {
    $host = new class implements DeepResearchHost
    {
        public function research(array $request): array
        {
            throw new RuntimeException('must not be called');
        }
    };

    expect(fn () => (new DeepResearchExecutor($host))->execute(deepResearchContext([])))
        ->toThrow(InvalidArgumentException::class, 'needs a `query`');
});

it('requires an explicitly bound research host', function () {
    expect(fn () => (new DeepResearchExecutor)->execute(deepResearchContext(['query' => 'Anything'])))
        ->toThrow(RuntimeException::class, 'no research host bound');
});

it('advertises the complete authoring schema through PHP discovery', function () {
    $attribute = (new ReflectionClass(DeepResearchExecutor::class))
        ->getAttributes(FlowNodeAttribute::class)[0]
        ->newInstance();

    expect(array_column($attribute->configSchema, 'key'))->toBe([
        'query',
        'instructions',
        'depth',
        'maxSources',
        'includeContext',
        'provider',
        'model',
        'credential',
    ])->and(collect($attribute->configSchema)->keyBy('key')->get('depth')['default'])->toBe('deep')
        ->and(collect($attribute->configSchema)->keyBy('key')->get('maxSources')['default'])->toBe(8)
        ->and(collect($attribute->configSchema)->keyBy('key')->get('includeContext')['default'])->toBeTrue();
});

it('never forwards a legacy `metadata` config field to the host, and runs without error', function () {
    // Perplexity's Agent API dropped `metadata`, and prism 0.141.0 rejects it
    // before the call (Particle-Academy/prism#103). A saved graph that still
    // carries the field must run, and must not leak it into the request.
    $requests = [];
    $host = new class($requests) implements DeepResearchHost
    {
        public function __construct(private array &$requests) {}

        public function research(array $request): array
        {
            $this->requests[] = $request;

            return ['answer' => 'ok', 'citations' => []];
        }
    };

    $result = (new DeepResearchExecutor($host))->execute(deepResearchContext([
        'query' => 'Legacy graph',
        'metadata' => ['source' => 'saved-graph'],
    ]));

    expect($result['answer'])->toBe('ok')
        ->and($requests)->toHaveCount(1)
        ->and($requests[0])->not->toHaveKey('metadata')
        ->and(array_keys($requests[0]))->toBe([
            'query', 'instructions', 'context', 'depth', 'maxSources', 'provider', 'model', 'credential',
        ]);
});

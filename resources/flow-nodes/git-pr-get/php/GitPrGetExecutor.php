<?php

declare(strict_types=1);

namespace FancyFlow\Nodes\GitPrGet;

use FancyFlow\Attributes\FlowNode;
use FancyFlow\Contracts\NodeExecutor;
use FancyFlow\Runtime\ExecutionContext;

/** Read one pull request in full — body, state, mergeability, timestamps. */
#[FlowNode(
    name: '@particle-academy/git_pr_get',
    category: 'io',
    label: 'Get Pull Request',
    description: 'Read one pull request — body, state, mergeability, timestamps.',
    icon: '◎',
    inputs: [['id' => 'in']],
    outputs: [['id' => 'out']],
    aliases: ['git_pr_get'],
)]
final class GitPrGetExecutor implements NodeExecutor
{
    public function __construct(private readonly ?GitHost $host = null) {}

    public function execute(ExecutionContext $ctx): mixed
    {
        $config = $ctx->config();
        $host = $this->host ?? throw new \RuntimeException(
            'git_pr: no Git host bound. Bind '.GitHost::class.' with a particle-academy/fancy-git ProviderRegistry.'
        );
        [$provider, $ref] = $host->resolve($config);

        // Accept the number from the node's input as well as its config, so
        // this drops straight after git_pr_list or git_pr_open with no
        // transform in between.
        $incoming = is_array($ctx->input()) ? $ctx->input() : [];
        $raw = $config['number'] ?? $incoming['number'] ?? ($incoming['review']['number'] ?? null);
        $number = (int) $raw;

        if ($number <= 0) {
            throw new \InvalidArgumentException(
                'git_pr_get: needs a pull request `number`, on the node or from its input.'
            );
        }

        $review = $provider->getReview($ref, $number);

        return [
            'review' => $review,
            'number' => $review['number'] ?? $number,
            'url' => $review['webUrl'] ?? null,
            'state' => $review['state'] ?? null,
        ];
    }
}

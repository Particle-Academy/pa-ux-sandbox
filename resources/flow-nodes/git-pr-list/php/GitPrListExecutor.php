<?php

declare(strict_types=1);

namespace FancyFlow\Nodes\GitPrList;

use FancyFlow\Attributes\FlowNode;
use FancyFlow\Contracts\NodeExecutor;
use FancyFlow\Runtime\ExecutionContext;
use FancyFlow\Runtime\Port;
use FancyFlow\Runtime\RunEvent;

/**
 * List pull requests, routed on whether there are any.
 *
 * Two ports rather than one: "no open PRs" is a decision in nearly every
 * workflow that asks, and a downstream count check is one somebody forgets.
 */
#[FlowNode(
    name: '@particle-academy/git_pr_list',
    category: 'io',
    label: 'List Pull Requests',
    description: 'List a repository\'s pull requests, branching on whether any matched.',
    icon: '☰',
    inputs: [['id' => 'in']],
    outputs: [['id' => 'found', 'label' => 'found'], ['id' => 'none', 'label' => 'none']],
    aliases: ['git_pr_list'],
)]
final class GitPrListExecutor implements NodeExecutor
{
    public function __construct(private readonly ?GitHost $host = null) {}

    public function execute(ExecutionContext $ctx): mixed
    {
        $config = $ctx->config();
        $host = $this->host ?? throw new \RuntimeException(
            'git_pr: no Git host bound. Bind '.GitHost::class.' with a particle-academy/fancy-git ProviderRegistry.'
        );
        [$provider, $ref] = $host->resolve($config);

        $state = (string) ($config['state'] ?? 'open');
        $limit = (int) ($config['limit'] ?? 20) ?: 20;

        $page = $provider->listReviews($ref, array_filter([
            'state' => $state === 'any' ? null : $state,
            'limit' => $limit,
        ], fn ($v) => $v !== null));

        $reviews = $page['items'] ?? [];
        $count = count($reviews);

        $ctx->emit(RunEvent::log('info', "{$count} {$state} pull request(s) in {$ref['owner']}/{$ref['name']}", $ctx->node->id));

        return Port::only($count > 0 ? 'found' : 'none', [
            'reviews' => $reviews,
            'count' => $count,
            'nextCursor' => $page['nextCursor'] ?? null,
        ]);
    }
}

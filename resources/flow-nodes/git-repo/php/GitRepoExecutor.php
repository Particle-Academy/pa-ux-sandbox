<?php

declare(strict_types=1);

namespace FancyFlow\Nodes\GitRepo;

use FancyFlow\Attributes\FlowNode;
use FancyFlow\Contracts\NodeExecutor;
use FancyFlow\Runtime\ExecutionContext;
use FancyFlow\Runtime\Port;
use FancyFlow\Runtime\RunEvent;

/**
 * Hosted repository metadata — default branch, visibility, URLs.
 *
 * Every git_pr_* node takes a target branch, and hardcoding "main" in a graph is
 * how a workflow silently targets the wrong branch on a repo that uses master,
 * develop or trunk. This is the node that answers it, so a graph can read the
 * default branch instead of assuming it.
 */
#[FlowNode(
    name: '@particle-academy/git_repo',
    category: 'io',
    label: 'Repository',
    description: 'Hosted repository metadata — default branch, visibility, URLs.',
    icon: '◈',
    inputs: [['id' => 'in']],
    outputs: [['id' => 'out']],
    aliases: ['git_repo'],
)]
final class GitRepoExecutor implements NodeExecutor
{
    public function __construct(private readonly ?GitHost $host = null) {}

    public function execute(ExecutionContext $ctx): mixed
    {
        $config = $ctx->config();
        $host = $this->host ?? throw new \RuntimeException(
            'git: no Git host bound. Bind '.GitHost::class.' with a particle-academy/fancy-git ProviderRegistry.'
        );
        [$provider, $ref] = $host->resolve($config);

        $repository = $provider->repository($ref);
        $default = $repository['defaultBranch'] ?? '(unknown)';

        $ctx->emit(RunEvent::log('info', "{$ref['owner']}/{$ref['name']} — default branch {$default}", $ctx->node->id));

        return Port::only('out', $repository);
    }
}

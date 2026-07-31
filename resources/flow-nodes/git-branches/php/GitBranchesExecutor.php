<?php

declare(strict_types=1);

namespace FancyFlow\Nodes\GitBranches;

use FancyFlow\Attributes\FlowNode;
use FancyFlow\Contracts\NodeExecutor;
use FancyFlow\Runtime\ExecutionContext;
use FancyFlow\Runtime\Port;
use FancyFlow\Runtime\RunEvent;

/**
 * Branches, with the current one lifted out.
 *
 * Almost every workflow that lists branches then asks which one it is on, and
 * finding it means scanning for `current` — a loop each consumer would
 * otherwise rewrite.
 */
#[FlowNode(
    name: '@particle-academy/git_branches',
    category: 'io',
    label: 'Branches',
    description: 'List a working copy\'s branches and report which one is checked out.',
    icon: '⑂',
    inputs: [['id' => 'in']],
    outputs: [['id' => 'out']],
    aliases: ['git_branches'],
)]
final class GitBranchesExecutor implements NodeExecutor
{
    public function __construct(private readonly ?RepoHost $host = null) {}

    public function execute(ExecutionContext $ctx): mixed
    {
        $config = $ctx->config();
        $host = $this->host ?? throw new \RuntimeException(
            'git: no repository host bound. Bind '.RepoHost::class.' with a particle-academy/fancy-git GitRepository factory.'
        );

        $all = array_map(fn ($b) => is_array($b) ? $b : (array) $b, $host->workingCopy($config)->branches());
        $includeRemote = ($config['includeRemote'] ?? false) === true;

        $branches = $includeRemote ? $all : array_values(array_filter($all, fn ($b) => ! ($b['remote'] ?? false)));
        $currentRow = null;
        foreach ($all as $b) {
            if ($b['current'] ?? false) {
                $currentRow = $b;
                break;
            }
        }
        $current = $currentRow['name'] ?? null;

        $ctx->emit(RunEvent::log('info', count($branches).' branch(es), on '.($current ?? '(detached)'), $ctx->node->id));

        return Port::only('out', [
            'branches' => $branches,
            'count' => count($branches),
            'current' => $current,
            'names' => array_values(array_map(fn ($b) => $b['name'] ?? null, $branches)),
        ]);
    }
}

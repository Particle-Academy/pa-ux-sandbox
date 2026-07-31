<?php

declare(strict_types=1);

namespace FancyFlow\Nodes\GitPrCompare;

use FancyFlow\Attributes\FlowNode;
use FancyFlow\Contracts\NodeExecutor;
use FancyFlow\Runtime\ExecutionContext;
use FancyFlow\Runtime\Port;
use FancyFlow\Runtime\RunEvent;

/**
 * Compare two refs — how far ahead or behind, and the commits between.
 *
 * Routes on whether there is anything to merge. "0 commits ahead" is the answer
 * that most often should stop a workflow before it opens an empty pull request.
 */
#[FlowNode(
    name: '@particle-academy/git_pr_compare',
    category: 'logic',
    label: 'Compare Refs',
    description: 'Compare two branches or SHAs — commits between them, and which way they diverge.',
    icon: '⇄',
    inputs: [['id' => 'in']],
    outputs: [['id' => 'ahead', 'label' => 'ahead'], ['id' => 'same', 'label' => 'nothing to merge']],
    aliases: ['git_pr_compare'],
)]
final class GitPrCompareExecutor implements NodeExecutor
{
    public function __construct(private readonly ?GitHost $host = null) {}

    public function execute(ExecutionContext $ctx): mixed
    {
        $config = $ctx->config();
        $host = $this->host ?? throw new \RuntimeException(
            'git_pr: no Git host bound. Bind '.GitHost::class.' with a particle-academy/fancy-git ProviderRegistry.'
        );
        [$provider, $ref] = $host->resolve($config);

        $base = trim((string) ($config['base'] ?? 'main'));
        $head = trim((string) ($config['head'] ?? ''));

        if ($head === '') {
            throw new \InvalidArgumentException('git_pr_compare: needs a `head` ref to compare against `base`.');
        }
        if ($base === $head) {
            throw new \InvalidArgumentException("git_pr_compare: base and head are both \"{$base}\".");
        }

        $comparison = $provider->compare($ref, $base, $head);
        $aheadBy = (int) ($comparison['aheadBy'] ?? 0);
        $behindBy = (int) ($comparison['behindBy'] ?? 0);

        $ctx->emit(RunEvent::log('info', "{$head} is {$aheadBy} ahead / {$behindBy} behind {$base}", $ctx->node->id));

        return Port::only($aheadBy > 0 ? 'ahead' : 'same', [
            'comparison' => $comparison,
            'base' => $base,
            'head' => $head,
            'aheadBy' => $aheadBy,
            'behindBy' => $behindBy,
        ]);
    }
}

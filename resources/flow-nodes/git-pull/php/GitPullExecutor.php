<?php

declare(strict_types=1);

namespace FancyFlow\Nodes\GitPull;

use FancyFlow\Attributes\FlowNode;
use FancyFlow\Contracts\NodeExecutor;
use FancyFlow\Runtime\ExecutionContext;
use FancyFlow\Runtime\Port;
use FancyFlow\Runtime\RunEvent;

/**
 * Pull from a remote.
 *
 * Mutating and propose-aware for the same reason as push: a pull can conflict,
 * and a workflow that discovers that on a queue worker at 3am should have been
 * able to stage it for a human first.
 */
#[FlowNode(
    name: '@particle-academy/git_pull',
    category: 'io',
    label: 'Pull',
    description: 'Pull a working copy from a remote — or propose it for approval.',
    icon: '↧',
    inputs: [['id' => 'in']],
    outputs: [['id' => 'done', 'label' => 'done'], ['id' => 'proposed', 'label' => 'proposed']],
    aliases: ['git_pull'],
)]
final class GitPullExecutor implements NodeExecutor
{
    public function __construct(private readonly ?RepoHost $host = null) {}

    public function execute(ExecutionContext $ctx): mixed
    {
        $config = $ctx->config();
        $host = $this->host ?? throw new \RuntimeException(
            'git: no repository host bound. Bind '.RepoHost::class.' with a particle-academy/fancy-git GitRepository factory.'
        );

        $remote = isset($config['remote']) && $config['remote'] !== '' ? (string) $config['remote'] : null;
        $branch = isset($config['branch']) && $config['branch'] !== '' ? (string) $config['branch'] : null;
        $propose = ($config['propose'] ?? false) === true;

        $result = $host->workingCopy($config)->pull($remote, $branch, $propose);
        $where = ($remote ?? 'origin').($branch ? "/{$branch}" : '');

        if ($propose) {
            $ctx->emit(RunEvent::log('info', "proposed pull from {$where} (not performed)", $ctx->node->id));

            return Port::only('proposed', ['remote' => $remote, 'branch' => $branch, 'proposal' => $result]);
        }

        $ctx->emit(RunEvent::log('info', "pulled from {$where}", $ctx->node->id));

        return Port::only('done', ['remote' => $remote, 'branch' => $branch]);
    }
}

<?php

declare(strict_types=1);

namespace FancyFlow\Nodes\GitPush;

use FancyFlow\Attributes\FlowNode;
use FancyFlow\Contracts\NodeExecutor;
use FancyFlow\Runtime\ExecutionContext;
use FancyFlow\Runtime\Port;
use FancyFlow\Runtime\RunEvent;

/**
 * Push to a remote.
 *
 * Declared unsafe-to-replay, and propose-aware. A durable run retries, and a
 * retried push is usually harmless but occasionally is not — so the manifest
 * tells the truth and lets the host scope the retry policy.
 */
#[FlowNode(
    name: '@particle-academy/git_push',
    category: 'io',
    label: 'Push',
    description: 'Push a working copy to a remote — or propose it for approval.',
    icon: '↥',
    inputs: [['id' => 'in']],
    outputs: [['id' => 'done', 'label' => 'done'], ['id' => 'proposed', 'label' => 'proposed']],
    aliases: ['git_push'],
)]
final class GitPushExecutor implements NodeExecutor
{
    public function __construct(private readonly ?RepoHost $host = null) {}

    public function execute(ExecutionContext $ctx): mixed
    {
        $config = $ctx->config();
        $host = $this->host ?? throw new \RuntimeException(
            'git: no repository host bound. Bind '.RepoHost::class.' with a particle-academy/fancy-git GitRepository factory.'
        );

        $remote = (string) ($config['remote'] ?? 'origin') ?: 'origin';
        $branch = isset($config['branch']) && $config['branch'] !== '' ? (string) $config['branch'] : null;
        $propose = ($config['propose'] ?? false) === true;

        $result = $host->workingCopy($config)->push($remote, $branch, $propose);
        $where = $remote.($branch ? "/{$branch}" : '');

        if ($propose) {
            $ctx->emit(RunEvent::log('info', "proposed push to {$where} (not performed)", $ctx->node->id));

            return Port::only('proposed', ['remote' => $remote, 'branch' => $branch, 'proposal' => $result]);
        }

        $ctx->emit(RunEvent::log('info', "pushed to {$where}", $ctx->node->id));

        return Port::only('done', ['remote' => $remote, 'branch' => $branch]);
    }
}

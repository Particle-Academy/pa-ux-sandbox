<?php

declare(strict_types=1);

namespace FancyFlow\Nodes\GitLog;

use FancyFlow\Attributes\FlowNode;
use FancyFlow\Contracts\NodeExecutor;
use FancyFlow\Runtime\ExecutionContext;
use FancyFlow\Runtime\Port;
use FancyFlow\Runtime\RunEvent;

/**
 * Commits, routed on whether any matched.
 *
 * `none` is a real answer, not an error: "has anything landed since the tag" is
 * a routing question, and an empty array on a single port is a check somebody
 * forgets downstream.
 */
#[FlowNode(
    name: '@particle-academy/git_log',
    category: 'io',
    label: 'Commit Log',
    description: 'Read commits from a working copy, branching on whether any matched.',
    icon: '≡',
    inputs: [['id' => 'in']],
    outputs: [['id' => 'found', 'label' => 'found'], ['id' => 'none', 'label' => 'none']],
    aliases: ['git_log'],
)]
final class GitLogExecutor implements NodeExecutor
{
    public function __construct(private readonly ?RepoHost $host = null) {}

    public function execute(ExecutionContext $ctx): mixed
    {
        $config = $ctx->config();
        $host = $this->host ?? throw new \RuntimeException(
            'git: no repository host bound. Bind '.RepoHost::class.' with a particle-academy/fancy-git GitRepository factory.'
        );

        $ref = isset($config['ref']) && $config['ref'] !== '' ? (string) $config['ref'] : null;
        $limit = (int) ($config['limit'] ?? 20) ?: 20;
        $skip = (int) ($config['skip'] ?? 0);

        $commits = $host->workingCopy($config)->log($ref, $limit, $skip);
        $count = count($commits);

        $ctx->emit(RunEvent::log('info', "{$count} commit(s)".($ref ? " on {$ref}" : ''), $ctx->node->id));

        return Port::only($count > 0 ? 'found' : 'none', [
            'commits' => $commits,
            'count' => $count,
            'ref' => $ref,
        ]);
    }
}

<?php

declare(strict_types=1);

namespace FancyFlow\Nodes\GitDiff;

use FancyFlow\Attributes\FlowNode;
use FancyFlow\Contracts\NodeExecutor;
use FancyFlow\Runtime\ExecutionContext;
use FancyFlow\Runtime\Port;
use FancyFlow\Runtime\RunEvent;

/**
 * A diff, routed on whether it is empty.
 *
 * An empty diff is the common case for a scheduled automation, and the one that
 * must NOT continue into a commit or a pull request — so it gets its own port
 * rather than an empty value on the same one.
 */
#[FlowNode(
    name: '@particle-academy/git_diff',
    category: 'io',
    label: 'Diff',
    description: 'Diff a working copy — working tree, staged, or between two revisions.',
    icon: '±',
    inputs: [['id' => 'in']],
    outputs: [['id' => 'changed', 'label' => 'changed'], ['id' => 'empty', 'label' => 'empty']],
    aliases: ['git_diff'],
)]
final class GitDiffExecutor implements NodeExecutor
{
    public function __construct(private readonly ?RepoHost $host = null) {}

    public function execute(ExecutionContext $ctx): mixed
    {
        $config = $ctx->config();
        $host = $this->host ?? throw new \RuntimeException(
            'git: no repository host bound. Bind '.RepoHost::class.' with a particle-academy/fancy-git GitRepository factory.'
        );

        $from = isset($config['from']) && $config['from'] !== '' ? (string) $config['from'] : null;
        $to = isset($config['to']) && $config['to'] !== '' ? (string) $config['to'] : null;
        $staged = ($config['staged'] ?? false) === true;
        $paths = array_map('strval', (array) ($config['paths'] ?? []));

        $diff = $host->workingCopy($config)->diff($from, $to, $staged, $paths);

        // The twins return a Diff object on one runtime and a list of file
        // changes on the other; normalize so a graph need not know which runs.
        $files = array_is_list((array) $diff) ? (array) $diff : (((array) $diff)['files'] ?? []);
        $patch = array_is_list((array) $diff) ? null : (((array) $diff)['patch'] ?? null);
        $count = count($files);

        $ctx->emit(RunEvent::log('info', "{$count} file(s) changed", $ctx->node->id));

        return Port::only($count > 0 ? 'changed' : 'empty', [
            'files' => $files,
            'count' => $count,
            'patch' => $patch,
        ]);
    }
}

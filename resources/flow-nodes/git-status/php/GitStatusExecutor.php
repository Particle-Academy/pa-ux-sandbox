<?php

declare(strict_types=1);

namespace FancyFlow\Nodes\GitStatus;

use FancyFlow\Attributes\FlowNode;
use FancyFlow\Contracts\NodeExecutor;
use FancyFlow\Runtime\ExecutionContext;
use FancyFlow\Runtime\Port;
use FancyFlow\Runtime\RunEvent;

/**
 * Working-tree status, routed on whether there is anything to commit.
 *
 * Two ports rather than one flag: "is the tree clean" is the question every
 * automation asks first, and a downstream count check is one somebody forgets.
 * A workflow that commits without checking creates empty commits; one that
 * pushes without checking pushes nothing and reports success.
 */
#[FlowNode(
    name: '@particle-academy/git_status',
    category: 'io',
    label: 'Working Tree Status',
    description: 'Branch, ahead/behind and changed files — routes on whether the tree is clean.',
    icon: '◔',
    inputs: [['id' => 'in']],
    outputs: [['id' => 'clean', 'label' => 'clean'], ['id' => 'dirty', 'label' => 'dirty']],
    aliases: ['git_status'],
)]
final class GitStatusExecutor implements NodeExecutor
{
    public function __construct(private readonly ?RepoHost $host = null) {}

    public function execute(ExecutionContext $ctx): mixed
    {
        $config = $ctx->config();
        $host = $this->host ?? throw new \RuntimeException(
            'git: no repository host bound. Bind '.RepoHost::class.' with a particle-academy/fancy-git '.
            'GitRepository factory — the node has no filesystem access of its own and must not invent any.'
        );

        $status = $host->workingCopy($config)->status();
        $status = is_array($status) ? $status : (array) $status;

        $files = $status['files'] ?? [];
        // `clean` comes from fancy-git, but a status with no files IS clean
        // whatever the flag says — trust the observable over the summary.
        $clean = $status['clean'] ?? (count($files) === 0);
        $branch = $status['branch'] ?? null;

        $ctx->emit(RunEvent::log(
            'info',
            $clean
                ? 'working tree clean on '.($branch ?? '(detached)')
                : count($files).' change(s) on '.($branch ?? '(detached)'),
            $ctx->node->id
        ));

        return Port::only($clean ? 'clean' : 'dirty', [
            'branch' => $branch,
            'upstream' => $status['upstream'] ?? null,
            'ahead' => $status['ahead'] ?? 0,
            'behind' => $status['behind'] ?? 0,
            'files' => $files,
            'count' => count($files),
            'clean' => $clean,
        ]);
    }
}

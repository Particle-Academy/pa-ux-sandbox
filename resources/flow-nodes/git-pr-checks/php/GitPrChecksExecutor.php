<?php

declare(strict_types=1);

namespace FancyFlow\Nodes\GitPrChecks;

use FancyFlow\Attributes\FlowNode;
use FancyFlow\Contracts\NodeExecutor;
use FancyFlow\Runtime\ExecutionContext;
use FancyFlow\Runtime\Port;
use FancyFlow\Runtime\RunEvent;

/**
 * CI state for a revision — the gate a "merge when green" workflow routes on.
 *
 * Four ports, because collapsing them loses the distinction that matters most:
 * `pending` is NOT `failing`, and `none` is NOT `passing`. Merge them and a
 * workflow either abandons work that was still building, or auto-merges a
 * repository whose CI was never configured.
 */
#[FlowNode(
    name: '@particle-academy/git_pr_checks',
    category: 'logic',
    label: 'Check Status',
    description: 'CI state for a revision — routes on passing, failing, pending, or no checks at all.',
    icon: '✓',
    inputs: [['id' => 'in']],
    outputs: [['id' => 'passing', 'label' => 'passing'], ['id' => 'failing', 'label' => 'failing'], ['id' => 'pending', 'label' => 'pending'], ['id' => 'none', 'label' => 'no checks']],
    aliases: ['git_pr_checks'],
)]
final class GitPrChecksExecutor implements NodeExecutor
{
    private const FAILED = ['failed', 'failure', 'error'];

    private const RUNNING = ['pending', 'running', 'queued'];

    public function __construct(private readonly ?GitHost $host = null) {}

    public function execute(ExecutionContext $ctx): mixed
    {
        $config = $ctx->config();
        $host = $this->host ?? throw new \RuntimeException(
            'git_pr: no Git host bound. Bind '.GitHost::class.' with a particle-academy/fancy-git ProviderRegistry.'
        );
        [$provider, $ref] = $host->resolve($config);

        $incoming = is_array($ctx->input()) ? $ctx->input() : [];
        $revision = trim((string) (
            $config['revision'] ?? $incoming['revision'] ?? ($incoming['review']['sourceBranch'] ?? '')
        ));

        if ($revision === '') {
            throw new \InvalidArgumentException(
                'git_pr_checks: needs a `revision` — a SHA or branch, on the node or from its input.'
            );
        }

        $checks = $provider->checks($ref, $revision) ?: [];
        $failing = array_filter($checks, fn (array $c) => in_array($c['state'] ?? '', self::FAILED, true));
        $pending = array_filter($checks, fn (array $c) => in_array($c['state'] ?? '', self::RUNNING, true));

        $port = match (true) {
            $checks === [] => 'none',
            $failing !== [] => 'failing',
            $pending !== [] => 'pending',
            default => 'passing',
        };

        $ctx->emit(RunEvent::log(
            $failing !== [] ? 'warn' : 'info',
            "{$revision}: ".count($checks)." check(s) — {$port}",
            $ctx->node->id,
        ));

        return Port::only($port, [
            'checks' => array_values($checks),
            'revision' => $revision,
            'failing' => count($failing),
            'pending' => count($pending),
        ]);
    }
}

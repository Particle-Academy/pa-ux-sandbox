<?php

declare(strict_types=1);

namespace FancyFlow\Nodes\GitIssueGet;

use FancyFlow\Attributes\FlowNode;
use FancyFlow\Contracts\NodeExecutor;
use FancyFlow\Runtime\ExecutionContext;
use FancyFlow\Runtime\Port;
use FancyFlow\Runtime\RunEvent;
use FancyGit\Provider\IssueProvider;

/** Read one issue — body, state, labels, assignees. */
#[FlowNode(
    name: '@particle-academy/git_issue_get',
    category: 'io',
    label: 'Get Issue',
    description: 'Read one issue — body, state, labels, assignees.',
    icon: '◉',
    inputs: [['id' => 'in']],
    outputs: [['id' => 'open', 'label' => 'open'], ['id' => 'closed', 'label' => 'closed']],
    aliases: ['git_issue_get'],
)]
final class GitIssueGetExecutor implements NodeExecutor
{
    public function __construct(private readonly ?GitHost $host = null) {}

    public function execute(ExecutionContext $ctx): mixed
    {
        $config = $ctx->config();
        $host = $this->host ?? throw new \RuntimeException(
            'git_issue: no Git host bound. Bind '.GitHost::class.' with a particle-academy/fancy-git ProviderRegistry.'
        );
        [$provider, $ref] = $host->resolve($config);
        $provider = $this->requireIssues($provider);

        $number = (int) ($config['number'] ?? ($ctx->inputs['in']['number'] ?? 0));
        if ($number === 0) {
            throw new \RuntimeException('git_issue_get: needs an issue "number" — on the node, or from the input.');
        }

        $issue = $provider->getIssue($ref, $number);

        $ctx->emit(RunEvent::log('info', '#'.$issue['number'].' is '.$issue['state'], $ctx->node->id));

        // Routed rather than returned as a field: "is it still open" is the
        // question almost every workflow asks next.
        return Port::only(($issue['state'] ?? 'open') === 'closed' ? 'closed' : 'open', $issue);
    }

    /**
     * Narrow a provider to one that tracks issues.
     *
     * Issue tracking is an OPTIONAL capability: a self-hosted remote with no
     * tracker is a perfectly good provider. Checking here turns "this host has
     * no issue tracker" into a clear failure at the node rather than a call to
     * an undefined method three frames down.
     */
    private function requireIssues(object $provider): object
    {
        if (! $provider instanceof IssueProvider) {
            throw new \RuntimeException(
                'git_issue: the configured provider does not track issues. Issue support is an '.
                'optional capability — register an adapter implementing IssueProvider '.
                '(particle-academy/fancy-git-github does).'
            );
        }

        return $provider;
    }

    /**
     * Split a comma-separated config field into a clean list.
     *
     * @return list<string>
     */
    private static function toList(mixed $value): array
    {
        if (is_array($value)) {
            return array_values(array_filter(array_map('trim', array_map('strval', $value))));
        }
        if ($value === null || $value === '') {
            return [];
        }

        return array_values(array_filter(array_map('trim', explode(',', (string) $value))));
    }
}

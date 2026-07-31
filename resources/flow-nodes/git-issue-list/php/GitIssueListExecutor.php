<?php

declare(strict_types=1);

namespace FancyFlow\Nodes\GitIssueList;

use FancyFlow\Attributes\FlowNode;
use FancyFlow\Contracts\NodeExecutor;
use FancyFlow\Runtime\ExecutionContext;
use FancyFlow\Runtime\Port;
use FancyFlow\Runtime\RunEvent;
use FancyGit\Provider\IssueProvider;

/** List a repository's issues, branching on whether any matched. */
#[FlowNode(
    name: '@particle-academy/git_issue_list',
    category: 'io',
    label: 'List Issues',
    description: 'List a repository\'s issues, branching on whether any matched.',
    icon: '☰',
    inputs: [['id' => 'in']],
    outputs: [['id' => 'found', 'label' => 'found'], ['id' => 'none', 'label' => 'none']],
    aliases: ['git_issue_list'],
)]
final class GitIssueListExecutor implements NodeExecutor
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

        $state = (string) ($config['state'] ?? 'open');
        $limit = (int) ($config['limit'] ?? 20) ?: 20;

        $query = ['state' => $state, 'limit' => $limit];
        if (self::toList($config['labels'] ?? null)) {
            $query['labels'] = self::toList($config['labels']);
        }
        if (! empty($config['assignee'])) {
            $query['assignee'] = (string) $config['assignee'];
        }

        $page = $provider->listIssues($ref, $query);
        $issues = $page['items'] ?? [];
        $count = count($issues);

        $ctx->emit(RunEvent::log('info', $count.' '.$state.' issue(s) in '.$ref['owner'].'/'.$ref['name'], $ctx->node->id));

        return Port::only($count > 0 ? 'found' : 'none', [
            'issues' => $issues,
            'count' => $count,
            'nextCursor' => $page['nextCursor'] ?? null,
        ]);
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

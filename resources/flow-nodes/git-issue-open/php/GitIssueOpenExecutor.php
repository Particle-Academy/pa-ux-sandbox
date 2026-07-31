<?php

declare(strict_types=1);

namespace FancyFlow\Nodes\GitIssueOpen;

use FancyFlow\Attributes\FlowNode;
use FancyFlow\Contracts\NodeExecutor;
use FancyFlow\Runtime\ExecutionContext;
use FancyFlow\Runtime\Port;
use FancyFlow\Runtime\RunEvent;
use FancyGit\Provider\IssueProvider;

/** File an issue on GitHub, GitLab or Bitbucket. */
#[FlowNode(
    name: '@particle-academy/git_issue_open',
    category: 'io',
    label: 'Open Issue',
    description: 'File an issue on GitHub, GitLab or Bitbucket.',
    icon: '◎',
    inputs: [['id' => 'in']],
    outputs: [['id' => 'out']],
    aliases: ['git_issue_open'],
)]
final class GitIssueOpenExecutor implements NodeExecutor
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

        $title = trim((string) ($config['title'] ?? ''));
        if ($title === '') {
            throw new \RuntimeException('git_issue_open: needs a "title". Refusing to file an untitled issue.');
        }

        $input = ['title' => $title];
        if (! empty($config['body'])) {
            $input['body'] = (string) $config['body'];
        }
        if (self::toList($config['labels'] ?? null)) {
            $input['labels'] = self::toList($config['labels']);
        }
        if (self::toList($config['assignees'] ?? null)) {
            $input['assignees'] = self::toList($config['assignees']);
        }

        $issue = $provider->createIssue($ref, $input);

        $ctx->emit(RunEvent::log('info', 'opened #'.$issue['number'].' in '.$ref['owner'].'/'.$ref['name'], $ctx->node->id));

        return Port::only('out', $issue);
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

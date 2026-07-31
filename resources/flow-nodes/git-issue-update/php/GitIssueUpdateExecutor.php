<?php

declare(strict_types=1);

namespace FancyFlow\Nodes\GitIssueUpdate;

use FancyFlow\Attributes\FlowNode;
use FancyFlow\Contracts\NodeExecutor;
use FancyFlow\Runtime\ExecutionContext;
use FancyFlow\Runtime\Port;
use FancyFlow\Runtime\RunEvent;
use FancyGit\Provider\IssueProvider;

/** Change an issue's title, body, state or labels. */
#[FlowNode(
    name: '@particle-academy/git_issue_update',
    category: 'io',
    label: 'Update Issue',
    description: 'Change an issue\'s title, body, state or labels.',
    icon: '✎',
    inputs: [['id' => 'in']],
    outputs: [['id' => 'out']],
    aliases: ['git_issue_update'],
)]
final class GitIssueUpdateExecutor implements NodeExecutor
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
            throw new \RuntimeException('git_issue_update: needs an issue "number" — on the node, or from the input.');
        }

        // Only fields actually set are sent. Echoing everything back would
        // clobber whatever someone changed between the read and the write.
        $input = [];
        foreach (['title', 'body', 'state'] as $key) {
            if (! empty($config[$key])) {
                $input[$key] = (string) $config[$key];
            }
        }
        if (! empty($config['labels'])) {
            $input['labels'] = self::toList($config['labels']);
        }

        if ($input === []) {
            throw new \RuntimeException('git_issue_update: nothing to change. Set at least one field, or remove the node.');
        }

        $issue = $provider->updateIssue($ref, $number, $input);
        $changed = implode(', ', array_keys($input));

        $ctx->emit(RunEvent::log('info', 'updated #'.$issue['number'].' ('.$changed.')', $ctx->node->id));

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

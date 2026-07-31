<?php

declare(strict_types=1);

namespace FancyFlow\Nodes\GitPrOpen;

use FancyFlow\Attributes\FlowNode;
use FancyFlow\Contracts\NodeExecutor;
use FancyFlow\Runtime\ExecutionContext;
use FancyFlow\Runtime\RunEvent;

/**
 * Open a pull request. The PHP twin of `../js/executor.ts`.
 *
 * Same validation in the same place on both runtimes, so a misconfigured node
 * produces the identical message whichever one runs it — which is exactly what
 * the shared golden fixtures check.
 *
 * The one node in this set with a side effect that re-running cannot take back,
 * which is why its manifest says `unsafe-to-replay`: a durable run retrying
 * after a network blip would open a second PR for the same branch, and nothing
 * downstream would notice.
 */
#[FlowNode(
    name: '@particle-academy/git_pr_open',
    category: 'io',
    label: 'Open Pull Request',
    description: 'Open a pull request from one branch into another, on GitHub, GitLab or Bitbucket.',
    icon: '⇡',
    inputs: [['id' => 'in']],
    outputs: [['id' => 'out']],
    aliases: ['git_pr_open'],
)]
final class GitPrOpenExecutor implements NodeExecutor
{
    public function __construct(private readonly ?GitHost $host = null) {}

    public function execute(ExecutionContext $ctx): mixed
    {
        $config = $ctx->config();
        $host = $this->host ?? throw new \RuntimeException(
            'git_pr: no Git host bound. Bind '.GitHost::class.' with a particle-academy/fancy-git ProviderRegistry — '
            .'the node has no credentials of its own and must not invent any.'
        );
        [$provider, $ref] = $host->resolve($config);

        $title = trim((string) ($config['title'] ?? ''));
        $source = trim((string) ($config['sourceBranch'] ?? ''));
        $target = trim((string) ($config['targetBranch'] ?? 'main'));

        if ($title === '') {
            throw new \InvalidArgumentException('git_pr_open: needs a `title`.');
        }
        if ($source === '') {
            throw new \InvalidArgumentException('git_pr_open: needs a `sourceBranch` — the branch to merge FROM.');
        }
        if ($source === $target) {
            // The provider would reject this too, but in its own words and only
            // after a round trip that spends a token and a rate-limit unit.
            throw new \InvalidArgumentException("git_pr_open: sourceBranch and targetBranch are both \"{$source}\".");
        }

        $ctx->emit(RunEvent::log('info', "Opening {$ref['owner']}/{$ref['name']}: {$source} → {$target}", $ctx->node->id));

        $review = $provider->createReview($ref, array_filter([
            'title' => $title,
            'body' => $config['body'] ?? null,
            'sourceBranch' => $source,
            'targetBranch' => $target,
            'draft' => (bool) ($config['draft'] ?? false),
        ], fn ($v) => $v !== null));

        return ['review' => $review, 'number' => $review['number'] ?? null, 'url' => $review['webUrl'] ?? null];
    }
}

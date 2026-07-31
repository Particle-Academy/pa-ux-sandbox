<?php

declare(strict_types=1);

namespace FancyFlow\Nodes\GitPush;

/**
 * The seam between a workflow node and a LOCAL git working copy.
 *
 * Distinct from the `git_pr_*` nodes' seam on purpose. Those act on a hosted
 * provider (a REST API and a token); these drive `git` in a checkout on disk.
 * Different failure modes, different credentials, different blast radius — so
 * they declare different capabilities. A host that wants to read pull requests
 * should not have to hand over a working copy.
 *
 * Bind it once, in a service provider:
 *
 * ```php
 * $this->app->bind(RepoHost::class, fn () => new RepoHost(
 *     resolve: fn (?string $repo) => new \FancyGit\GitRepository(workspace_path($repo)),
 * ));
 * ```
 *
 * `resolve` receives the config's `repo` NAME, never a path, so a graph cannot
 * carry a filesystem path an author could point anywhere. The host decides what
 * a name maps to; the node cannot reach outside what the host allows.
 */
final class RepoHost
{
    /** @param  \Closure(?string): ?object  $resolve */
    public function __construct(private readonly \Closure $resolve) {}

    /**
     * Resolve the working copy this node acts on.
     *
     * Throws rather than returning null on refusal. A node that cannot reach a
     * repository must not report success — on a queue worker that is a green
     * run that never pushed the branch someone was waiting for.
     *
     * @param  array<string,mixed>  $config
     */
    public function workingCopy(array $config): object
    {
        $repo = isset($config['repo']) ? (string) $config['repo'] : null;
        $resolved = ($this->resolve)($repo);

        if (! $resolved) {
            throw new \RuntimeException(
                'git: the host refused to resolve repository '.($repo !== null ? "\"{$repo}\"" : '(default)').
                '. Register it with the host, or correct the node\'s `repo`.'
            );
        }

        return $resolved;
    }
}

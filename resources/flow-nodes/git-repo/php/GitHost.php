<?php

declare(strict_types=1);

namespace FancyFlow\Nodes\GitRepo;

/**
 * The seam between a workflow node and a hosted Git provider.
 *
 * `particle-academy/fancy-git` models providers as a `ProviderRegistry` **instance**, not a
 * singleton — deliberately, because one app may serve several installations
 * with different credentials. So a node cannot reach for a provider; the host
 * hands one over, the same arrangement fancy-flow uses for LLM clients.
 *
 * Bind it once, in a service provider:
 *
 * ```php
 * $this->app->bind(GitHost::class, fn () => new GitHost(
 *     registry: (new ProviderRegistry)->register(new GitHubProvider(config('services.github.token'))),
 *     defaultRepo: ['provider' => 'github', 'owner' => 'Particle-Academy', 'name' => 'fancy-flow'],
 * ));
 * ```
 *
 * The PHP twin of `../js/provider.ts`, and duplicated in each git-pr-* node on
 * purpose: a vendored node should be self-contained and editable in place, not
 * dependent on another node you did not copy in.
 */
final class GitHost
{
    /**
     * @param  object  $registry  a `FancyGit\Provider\ProviderRegistry`
     * @param  array<string,string>  $defaultRepo
     */
    public function __construct(
        public readonly object $registry,
        public readonly array $defaultRepo = [],
    ) {}

    /**
     * Resolve the provider and repository a node should act on.
     *
     * Fails loudly at every step. A node that cannot reach a provider must not
     * return "nothing to do" — on a queue worker that is a green run that never
     * opened the pull request someone was waiting for.
     *
     * @param  array<string,mixed>  $config
     * @return array{0: object, 1: array<string,string>}
     */
    public function resolve(array $config): array
    {
        $ref = array_filter([
            'provider' => (string) ($config['provider'] ?? $this->defaultRepo['provider'] ?? 'github'),
            'owner' => (string) ($config['owner'] ?? $this->defaultRepo['owner'] ?? ''),
            'name' => (string) ($config['repo'] ?? $this->defaultRepo['name'] ?? ''),
            'baseUrl' => (string) ($config['baseUrl'] ?? $this->defaultRepo['baseUrl'] ?? ''),
        ], fn (string $v) => $v !== '');

        if (($ref['owner'] ?? '') === '' || ($ref['name'] ?? '') === '') {
            throw new \InvalidArgumentException(
                'git_pr: needs `owner` and `repo` — on the node, or as the host\'s defaultRepo.'
            );
        }

        $provider = $this->registry->get($ref['provider']);
        if ($provider === null) {
            throw new \RuntimeException(
                "git_pr: no \"{$ref['provider']}\" provider is registered. Register one on the "
                .'ProviderRegistry you pass to GitHost.'
            );
        }

        return [$provider, $ref];
    }
}

<?php

declare(strict_types=1);

use FancyFlow\Nodes\GitIssueComment\GitIssueCommentExecutor;
use FancyFlow\Nodes\GitIssueGet\GitIssueGetExecutor;
use FancyFlow\Nodes\GitIssueList\GitIssueListExecutor;
use FancyFlow\Nodes\GitIssueOpen\GitHost;
use FancyFlow\Nodes\GitIssueOpen\GitIssueOpenExecutor;
use FancyFlow\Nodes\GitIssueUpdate\GitIssueUpdateExecutor;
use FancyFlow\Runtime\ExecutionContext;
use FancyFlow\Schema\FlowNode;
use FancyGit\Provider\IssueProvider;

/**
 * The PHP backends of the issue nodes, against the SAME golden fixtures the
 * TypeScript ones run.
 *
 * The case worth having here above all others is the host whose provider has no
 * tracker. `IssueProvider` is a separate contract precisely because plenty of
 * hosts do not implement it, and a node that silently succeeded there would be
 * a workflow that files nothing and reports done.
 */
function issueCtx(string $kind, array $config, mixed $input = null): ExecutionContext
{
    return new ExecutionContext(
        node: new FlowNode(id: 'issue', type: $kind, config: $config),
        inputs: ['in' => $input],
        emit: static fn () => null,
    );
}

/** @return array<string,mixed> */
function fakeIssue(array $over = []): array
{
    return $over + [
        'id' => '1',
        'number' => 7,
        'title' => 'Broken',
        'state' => 'open',
        'webUrl' => 'https://example.test/issues/7',
        'author' => 'ada',
        'labels' => ['bug'],
        'assignees' => [],
        'createdAt' => '2026-01-01T00:00:00Z',
        'updatedAt' => '2026-01-01T00:00:00Z',
    ];
}

/** A provider that DOES track issues, mirroring the TypeScript fake. */
function issueProvider(): object
{
    return new class implements IssueProvider
    {
        public function listIssues(array $ref, array $query = []): array
        {
            return ($query['state'] ?? null) === 'closed' ? ['items' => []] : ['items' => [fakeIssue()]];
        }

        public function getIssue(array $ref, int $number): array
        {
            return fakeIssue(['number' => $number, 'state' => $number === 99 ? 'closed' : 'open']);
        }

        public function createIssue(array $ref, array $input): array
        {
            return fakeIssue(['title' => $input['title']]);
        }

        public function updateIssue(array $ref, int $number, array $input): array
        {
            return $input + fakeIssue(['number' => $number]);
        }

        public function commentOnIssue(array $ref, int $number, string $body): array
        {
            return ['id' => 'c1', 'webUrl' => 'https://example.test/issues/7#c1'];
        }
    };
}

/** A provider with NO tracker — still a perfectly valid GitProvider. */
function noTrackerProvider(): object
{
    return new class
    {
        public function repository(array $ref): array
        {
            return ['provider' => 'selfhosted', 'owner' => 'a', 'name' => 'b'];
        }
    };
}

function issueRegistry(object $provider): object
{
    return new class($provider)
    {
        public function __construct(private readonly object $provider) {}

        public function get(string $kind): ?object
        {
            return in_array($kind, ['github', 'selfhosted'], true) ? $this->provider : null;
        }
    };
}

dataset('issue nodes', [
    'git-issue-open' => ['git-issue-open', GitIssueOpenExecutor::class, GitHost::class],
    'git-issue-get' => ['git-issue-get', GitIssueGetExecutor::class, FancyFlow\Nodes\GitIssueGet\GitHost::class],
    'git-issue-list' => ['git-issue-list', GitIssueListExecutor::class, FancyFlow\Nodes\GitIssueList\GitHost::class],
    'git-issue-update' => ['git-issue-update', GitIssueUpdateExecutor::class, FancyFlow\Nodes\GitIssueUpdate\GitHost::class],
    'git-issue-comment' => ['git-issue-comment', GitIssueCommentExecutor::class, FancyFlow\Nodes\GitIssueComment\GitHost::class],
]);

it('runs every golden fixture the TypeScript backend runs', function (string $dir, string $executorClass, string $hostClass) {
    $manifest = json_decode((string) file_get_contents(__DIR__."/../../../resources/flow-nodes/{$dir}/fancy-flow.node.json"), true);
    $file = json_decode((string) file_get_contents(__DIR__.'/../../../resources/flow-nodes/'.preg_replace('#^nodes/#', '', $manifest['fixtures'])), true);

    $executor = new $executorClass(new $hostClass(registry: issueRegistry(issueProvider())));

    foreach ($file['cases'] as $case) {
        $expected = $case['expect'];
        $config = $case['config'] ?? [];

        if (isset($expected['error'])) {
            $thrown = null;
            try {
                $executor->execute(issueCtx($manifest['kind'], $config));
            } catch (Throwable $e) {
                $thrown = $e;
            }

            // The message, not merely "it threw". Both runtimes explaining one
            // bad config the SAME way is the parity claim.
            expect($thrown)->not->toBeNull("case: {$case['name']} did not throw");
            expect($thrown->getMessage())->toContain($expected['error']);

            continue;
        }

        $out = $executor->execute(issueCtx($manifest['kind'], $config));

        if (isset($expected['ports'])) {
            $port = is_array($out) && isset($out['__port']) ? $out['__port'] : 'out';
            expect($port)->toBe($expected['ports'][0], "case: {$case['name']}");
        }
    }
})->with('issue nodes');

it('fails loudly on a provider with no issue tracker', function (string $dir, string $executorClass, string $hostClass) {
    // IssueProvider is a separate contract because plenty of hosts have no
    // tracker. Silently succeeding here would be a workflow that files nothing
    // and reports done — the failure this whole repo is arranged against.
    $executor = new $executorClass(new $hostClass(registry: issueRegistry(noTrackerProvider())));

    expect(fn () => $executor->execute(issueCtx('k', [
        'owner' => 'a', 'repo' => 'b', 'provider' => 'selfhosted',
        'number' => 7, 'title' => 'x', 'body' => 'y',
    ])))->toThrow(RuntimeException::class, 'does not track issues');
})->with('issue nodes');

it('refuses to run with no host bound', function (string $dir, string $executorClass) {
    $executor = new $executorClass;

    expect(fn () => $executor->execute(issueCtx('k', ['owner' => 'a', 'repo' => 'b', 'number' => 1, 'title' => 't', 'body' => 'b'])))
        ->toThrow(RuntimeException::class, 'no Git host bound');
})->with('issue nodes');

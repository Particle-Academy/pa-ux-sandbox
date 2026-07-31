<?php

declare(strict_types=1);

use FancyFlow\Nodes\GitPrChecks\GitPrChecksExecutor;
use FancyFlow\Nodes\GitPrCompare\GitPrCompareExecutor;
use FancyFlow\Nodes\GitPrGet\GitPrGetExecutor;
use FancyFlow\Nodes\GitPrList\GitPrListExecutor;
use FancyFlow\Nodes\GitPrOpen\GitHost;
use FancyFlow\Nodes\GitPrOpen\GitPrOpenExecutor;
use FancyFlow\Nodes\GitRepo\GitRepoExecutor;
use FancyFlow\Runtime\ExecutionContext;
use FancyFlow\Schema\FlowNode;

/**
 * The PHP backends of the PR-lifecycle nodes, against the SAME golden fixtures
 * the TypeScript ones run.
 *
 * Cross-runtime drift does not fail loudly — a node just behaves differently on
 * one runtime while both runs report success — so it has to be caught by
 * something that executes, on both.
 *
 * Each node has its own `GitHost` class because a vendored node is
 * self-contained. That is the shape a consumer gets, so it is the shape tested.
 */
function prCtx(string $kind, array $config, mixed $input = null): ExecutionContext
{
    return new ExecutionContext(
        node: new FlowNode(id: 'pr', type: $kind, config: $config),
        inputs: ['in' => $input],
        emit: static fn () => null,
    );
}

/** A provider whose answers are chosen by the fixture's config, mirroring the TS fake. */
function fakeProvider(): object
{
    return new class
    {
        public function repository(array $ref): array
        {
            return [
                'provider' => 'github',
                'owner' => 'a',
                'name' => 'b',
                'defaultBranch' => 'main',
                'visibility' => 'public',
                'webUrl' => 'https://example.test/a/b',
            ];
        }

        public function createReview(array $ref, array $input): array
        {
            return [
                'id' => '1',
                'number' => 41,
                'title' => $input['title'],
                'state' => 'open',
                'webUrl' => 'https://example.test/pr/41',
                'sourceBranch' => $input['sourceBranch'],
                'targetBranch' => $input['targetBranch'],
                'author' => 'fixture',
            ];
        }

        public function listReviews(array $ref, array $query = []): array
        {
            return ($query['state'] ?? null) === 'merged'
                ? ['items' => []]
                : ['items' => [['id' => '1', 'number' => 41, 'title' => 't', 'state' => 'open',
                    'webUrl' => 'u', 'sourceBranch' => 'x', 'targetBranch' => 'main', 'author' => 'f']]];
        }

        public function getReview(array $ref, int $number): array
        {
            return [
                'id' => (string) $number, 'number' => $number, 'state' => 'open', 'title' => 't',
                'webUrl' => "https://example.test/pr/{$number}", 'sourceBranch' => 'x',
                'targetBranch' => 'main', 'author' => 'f',
                'createdAt' => '2026-01-01T00:00:00Z', 'updatedAt' => '2026-01-01T00:00:00Z',
            ];
        }

        public function checks(array $ref, string $revision): array
        {
            return match ($revision) {
                'all-green' => [['id' => '1', 'name' => 'ci', 'state' => 'success']],
                'one-red' => [['id' => '1', 'name' => 'ci', 'state' => 'success'], ['id' => '2', 'name' => 'e2e', 'state' => 'failed']],
                'still-running' => [['id' => '1', 'name' => 'ci', 'state' => 'success'], ['id' => '2', 'name' => 'e2e', 'state' => 'running']],
                default => [],
            };
        }

        public function compare(array $ref, string $base, string $head): array
        {
            return $head === 'identical'
                ? ['aheadBy' => 0, 'behindBy' => 0, 'commits' => []]
                : ['aheadBy' => 3, 'behindBy' => 0, 'commits' => []];
        }
    };
}

/** A registry that answers for `github` and nothing else. */
function fakeRegistry(): object
{
    return new class
    {
        public function get(string $kind): ?object
        {
            return $kind === 'github' ? fakeProvider() : null;
        }
    };
}

dataset('pr nodes', [
    'git-pr-open' => ['git-pr-open', GitPrOpenExecutor::class, GitHost::class],
    'git-pr-list' => ['git-pr-list', GitPrListExecutor::class, FancyFlow\Nodes\GitPrList\GitHost::class],
    'git-pr-get' => ['git-pr-get', GitPrGetExecutor::class, FancyFlow\Nodes\GitPrGet\GitHost::class],
    'git-pr-checks' => ['git-pr-checks', GitPrChecksExecutor::class, FancyFlow\Nodes\GitPrChecks\GitHost::class],
    'git-pr-compare' => ['git-pr-compare', GitPrCompareExecutor::class, FancyFlow\Nodes\GitPrCompare\GitHost::class],
    // Not a PR node, but it acts on the same hosted-provider seam, so it belongs
    // in the same harness rather than a second copy of it.
    'git-repo' => ['git-repo', GitRepoExecutor::class, FancyFlow\Nodes\GitRepo\GitHost::class],
]);

it('runs every golden fixture the TypeScript backend runs', function (string $dir, string $executorClass, string $hostClass) {
    $manifest = json_decode((string) file_get_contents(__DIR__."/../../../resources/flow-nodes/{$dir}/fancy-flow.node.json"), true);
    $file = json_decode((string) file_get_contents(__DIR__.'/../../../resources/flow-nodes/'.preg_replace('#^nodes/#', '', $manifest['fixtures'])), true);

    $host = new $hostClass(registry: fakeRegistry());
    $executor = new $executorClass($host);

    foreach ($file['cases'] as $case) {
        $expected = $case['expect'];
        $config = $case['config'] ?? [];

        if (isset($expected['error'])) {
            $thrown = null;
            try {
                $executor->execute(prCtx($manifest['kind'], $config, $case['inputs'] ?? null));
            } catch (Throwable $e) {
                $thrown = $e;
            }

            // The message, not merely "it threw". Both runtimes producing the
            // SAME explanation for one bad config is the parity claim.
            expect($thrown)->not->toBeNull("case: {$case['name']} did not throw");
            expect($thrown->getMessage())->toContain($expected['error']);

            continue;
        }

        $out = $executor->execute(prCtx($manifest['kind'], $config, $case['inputs'] ?? null));

        if (isset($expected['ports'])) {
            // A port-activating node returns ['__port' => …]; a plain one does
            // not. Either way the fixture's declared port has to be the one hit.
            $port = is_array($out) && isset($out['__port']) ? $out['__port'] : 'out';
            expect($port)->toBe($expected['ports'][0]);
        }
    }
})->with('pr nodes');

it('refuses to run with no host bound', function (string $dir, string $executorClass) {
    // These nodes carry no credentials. Shrugging here is a green run that
    // never opened the pull request someone was waiting for.
    $executor = new $executorClass;

    expect(fn () => $executor->execute(prCtx('k', ['owner' => 'a', 'repo' => 'b', 'title' => 't', 'sourceBranch' => 'x', 'head' => 'h', 'revision' => 'r', 'number' => 1])))
        ->toThrow(RuntimeException::class, 'no Git host bound');
})->with('pr nodes');

it('refuses when the configured provider was never registered', function (string $dir, string $executorClass, string $hostClass) {
    $registry = new class
    {
        public function get(string $kind): ?object
        {
            return null;
        }
    };
    $executor = new $executorClass(new $hostClass(registry: $registry));

    expect(fn () => $executor->execute(prCtx('k', ['provider' => 'gitlab', 'owner' => 'a', 'repo' => 'b', 'title' => 't', 'sourceBranch' => 'x', 'head' => 'h', 'revision' => 'r', 'number' => 1])))
        ->toThrow(RuntimeException::class, 'no "gitlab" provider is registered');
})->with('pr nodes');

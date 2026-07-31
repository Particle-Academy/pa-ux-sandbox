<?php

declare(strict_types=1);

use FancyFlow\Nodes\GitBranches\GitBranchesExecutor;
use FancyFlow\Nodes\GitCheckout\GitCheckoutExecutor;
use FancyFlow\Nodes\GitDiff\GitDiffExecutor;
use FancyFlow\Nodes\GitLog\GitLogExecutor;
use FancyFlow\Nodes\GitPull\GitPullExecutor;
use FancyFlow\Nodes\GitPush\GitPushExecutor;
use FancyFlow\Nodes\GitStatus\GitStatusExecutor;
use FancyFlow\Nodes\GitStatus\RepoHost;
use FancyFlow\Runtime\ExecutionContext;
use FancyFlow\Schema\FlowNode;

/**
 * The PHP backends of the local working-copy nodes, against the SAME golden
 * fixtures the TypeScript ones run.
 *
 * Cross-runtime drift does not fail loudly — a node simply behaves differently
 * on one runtime while both runs report success — so it has to be caught by
 * something that executes, on both. That pairing IS the parity claim these
 * manifests make when they declare `ts` and `php`.
 *
 * Each node has its own `RepoHost` class because a vendored node is
 * self-contained. That is the shape a consumer gets, so it is the shape tested.
 */
function repoCtx(string $kind, array $config, mixed $input = null): ExecutionContext
{
    return new ExecutionContext(
        node: new FlowNode(id: 'git', type: $kind, config: $config),
        inputs: ['in' => $input],
        emit: static fn () => null,
    );
}

/** Records anything that would have mutated, so `propose` can be proven inert. */
final class RecordedGitOps
{
    /** @var list<string> */
    public static array $performed = [];
}

/**
 * A working copy whose answers are chosen by the fixture's `repo` name, mirroring
 * the TypeScript fake. Never by a call counter — that makes every case depend on
 * the ones before it, so reordering the file breaks unrelated tests.
 */
function fakeWorkingCopy(string $name): object
{
    return new class($name)
    {
        public function __construct(private readonly string $name) {}

        public function status(): array
        {
            return $this->name === 'app'
                ? ['branch' => 'main', 'upstream' => 'origin/main', 'ahead' => 1, 'behind' => 0, 'files' => [['path' => 'a.ts']], 'clean' => false]
                : ['branch' => 'main', 'upstream' => 'origin/main', 'ahead' => 0, 'behind' => 0, 'files' => [], 'clean' => true];
        }

        public function log(?string $ref = null, int $limit = 50, int $skip = 0): array
        {
            return $this->name === 'empty'
                ? []
                : [['id' => 'abc', 'shortId' => 'abc', 'subject' => 'first', 'parents' => []]];
        }

        public function branches(): array
        {
            return [
                ['name' => 'main', 'current' => true, 'remote' => false, 'target' => 'abc'],
                ['name' => 'feature', 'current' => false, 'remote' => false, 'target' => 'def'],
                ['name' => 'origin/main', 'current' => false, 'remote' => true, 'target' => 'abc'],
            ];
        }

        public function diff(?string $from = null, ?string $to = null, bool $staged = false, array $paths = []): array
        {
            return $this->name === 'app'
                ? ['files' => [['path' => 'a.ts']], 'patch' => '@@']
                : ['files' => [], 'patch' => ''];
        }

        public function checkout(string $target, bool $propose = false): mixed
        {
            if ($propose) {
                return ['kind' => 'checkout', 'target' => $target];
            }
            RecordedGitOps::$performed[] = "checkout:{$target}";

            return null;
        }

        public function push(string $remote = 'origin', ?string $branch = null, bool $propose = false): mixed
        {
            if ($propose) {
                return ['kind' => 'push', 'remote' => $remote, 'branch' => $branch];
            }
            RecordedGitOps::$performed[] = "push:{$remote}";

            return null;
        }

        public function pull(?string $remote = null, ?string $branch = null, bool $propose = false): mixed
        {
            if ($propose) {
                return ['kind' => 'pull', 'remote' => $remote, 'branch' => $branch];
            }
            RecordedGitOps::$performed[] = 'pull:'.($remote ?? 'origin');

            return null;
        }
    };
}

/** Refuses "nope" — the host declining is a case every node must handle. */
function fakeResolve(): Closure
{
    return static fn (?string $repo) => $repo === 'nope' ? null : fakeWorkingCopy($repo ?? 'app');
}

dataset('repo nodes', [
    'git-status' => ['git-status', GitStatusExecutor::class, RepoHost::class],
    'git-log' => ['git-log', GitLogExecutor::class, FancyFlow\Nodes\GitLog\RepoHost::class],
    'git-branches' => ['git-branches', GitBranchesExecutor::class, FancyFlow\Nodes\GitBranches\RepoHost::class],
    'git-diff' => ['git-diff', GitDiffExecutor::class, FancyFlow\Nodes\GitDiff\RepoHost::class],
    'git-checkout' => ['git-checkout', GitCheckoutExecutor::class, FancyFlow\Nodes\GitCheckout\RepoHost::class],
    'git-push' => ['git-push', GitPushExecutor::class, FancyFlow\Nodes\GitPush\RepoHost::class],
    'git-pull' => ['git-pull', GitPullExecutor::class, FancyFlow\Nodes\GitPull\RepoHost::class],
]);

it('runs every golden fixture the TypeScript backend runs', function (string $dir, string $executorClass, string $hostClass) {
    $manifest = json_decode((string) file_get_contents(__DIR__."/../../../resources/flow-nodes/{$dir}/fancy-flow.node.json"), true);
    $file = json_decode((string) file_get_contents(__DIR__.'/../../../resources/flow-nodes/'.preg_replace('#^nodes/#', '', $manifest['fixtures'])), true);

    $executor = new $executorClass(new $hostClass(resolve: fakeResolve()));

    foreach ($file['cases'] as $case) {
        $expected = $case['expect'];
        $config = $case['config'] ?? [];

        if (isset($expected['error'])) {
            $thrown = null;
            try {
                $executor->execute(repoCtx($manifest['kind'], $config));
            } catch (Throwable $e) {
                $thrown = $e;
            }

            // The message, not merely "it threw". Both runtimes producing the
            // SAME explanation for one bad config is the parity claim.
            expect($thrown)->not->toBeNull("case: {$case['name']} did not throw");
            expect($thrown->getMessage())->toContain($expected['error']);

            continue;
        }

        $out = $executor->execute(repoCtx($manifest['kind'], $config));

        if (isset($expected['ports'])) {
            $port = is_array($out) && isset($out['__port']) ? $out['__port'] : 'out';
            expect($port)->toBe($expected['ports'][0], "case: {$case['name']}");
        }
    }
})->with('repo nodes');

it('refuses to run with no host bound', function (string $dir, string $executorClass) {
    // These nodes carry no filesystem access of their own. Shrugging here is a
    // green run that never pushed the branch someone was waiting for.
    $executor = new $executorClass;

    expect(fn () => $executor->execute(repoCtx('k', ['repo' => 'app', 'target' => 'main'])))
        ->toThrow(RuntimeException::class, 'no repository host bound');
})->with('repo nodes');

it('never performs the operation when proposing', function (string $dir, string $executorClass, string $hostClass) {
    // `propose` exists so an agent can say what it WOULD do. A propose that
    // quietly performed anyway is worse than not having the flag, because the
    // whole point is that a human looks first.
    RecordedGitOps::$performed = [];

    $executor = new $executorClass(new $hostClass(resolve: fakeResolve()));
    $out = $executor->execute(repoCtx('k', ['repo' => 'app', 'target' => 'main', 'propose' => true]));

    expect($out['__port'] ?? null)->toBe('proposed');
    expect(RecordedGitOps::$performed)->toBe([]);
})->with([
    'git-checkout' => ['git-checkout', GitCheckoutExecutor::class, FancyFlow\Nodes\GitCheckout\RepoHost::class],
    'git-push' => ['git-push', GitPushExecutor::class, FancyFlow\Nodes\GitPush\RepoHost::class],
    'git-pull' => ['git-pull', GitPullExecutor::class, FancyFlow\Nodes\GitPull\RepoHost::class],
]);

it('performs the operation when not proposing', function () {
    RecordedGitOps::$performed = [];

    $executor = new GitPushExecutor(
        new FancyFlow\Nodes\GitPush\RepoHost(resolve: fakeResolve())
    );
    $executor->execute(repoCtx('k', ['repo' => 'app']));

    expect(RecordedGitOps::$performed)->toBe(['push:origin']);
});

it('refuses to guess a checkout target', function () {
    $executor = new GitCheckoutExecutor(
        new FancyFlow\Nodes\GitCheckout\RepoHost(resolve: fakeResolve())
    );

    expect(fn () => $executor->execute(repoCtx('k', ['repo' => 'app'])))
        ->toThrow(RuntimeException::class, 'needs a `target`');
});

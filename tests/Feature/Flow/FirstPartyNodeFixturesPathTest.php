<?php

use App\Support\Registry\FirstPartyNodeSource;
use Illuminate\Support\Facades\File;
use Tests\TestCase;

uses(TestCase::class);

/**
 * A first-party manifest's `fixtures` path names a file that exists.
 *
 * Every first-party manifest said `"fixtures": "nodes/<name>/fixtures/<name>.json"`
 * — the layout of the archived `fancy-flow-nodes` repo, where manifests sat under
 * `nodes/`. The source moved to `resources/flow-nodes/<name>/` and the field did
 * not, so it named a path that exists nowhere: not relative to the node, not
 * relative to `resources/flow-nodes/`, not relative to the app.
 *
 * Nothing noticed, because nothing read the field straight. fancy-flow's
 * validators (TS, PHP, Python) only require a non-empty string, and every test
 * that loads a node's fixtures quietly stripped `nodes/` off the front before
 * opening the file — a workaround that made the stale path look like it worked.
 *
 * The path is relative to the NODE DIRECTORY, the directory holding the
 * manifest. That is the "package root" fancy-flow's manifest contract means, and
 * the same root `ui` and `runtimes.*.files` are already resolved against.
 */
function firstPartyManifestPaths(): array
{
    return File::glob(resource_path('flow-nodes/*/fancy-flow.node.json'));
}

it('resolves every first-party fixtures path against its node directory', function () {
    $manifests = firstPartyManifestPaths();

    // Vacuity guard: an empty glob would pass every assertion below.
    expect(count($manifests))->toBeGreaterThan(20);

    foreach ($manifests as $path) {
        $node = basename(dirname($path));
        $manifest = json_decode(File::get($path), true, flags: JSON_THROW_ON_ERROR);
        $fixtures = $manifest['fixtures'] ?? null;

        expect($fixtures)->toBeString("{$node} declares no fixtures path");
        expect(str_starts_with($fixtures, 'nodes/'))
            ->toBeFalse("{$node}: `{$fixtures}` is the archived fancy-flow-nodes layout; the path is relative to the node directory");
        expect(str_contains($fixtures, '..') || str_starts_with($fixtures, '/'))
            ->toBeFalse("{$node}: `{$fixtures}` must stay inside the node directory");

        $file = dirname($path).'/'.$fixtures;

        expect(is_file($file))->toBeTrue("{$node}: fixtures path `{$fixtures}` does not exist at {$file}");

        $contents = json_decode(File::get($file), true, flags: JSON_THROW_ON_ERROR);

        // A path to the wrong node's fixtures would exist and still be wrong.
        expect($contents['kind'] ?? null)->toBe($manifest['kind'], "{$node}: fixtures file is for a different kind");
        expect($contents['cases'] ?? [])->not->toBeEmpty("{$node}: fixtures file has no cases");
    }
});

it('compiles the corrected fixtures paths into the artifact production serves', function () {
    $compiled = json_decode(File::get(FirstPartyNodeSource::compiledPath()), true)['nodes'] ?? [];

    expect($compiled)->not->toBeEmpty();

    foreach ($compiled as $slug => $node) {
        $fixtures = (string) ($node['manifest']['fixtures'] ?? '');

        expect(str_starts_with($fixtures, 'nodes/'))
            ->toBeFalse("{$slug} still serves `{$fixtures}`: run `php artisan flow:build` and commit the artifact");
    }
});

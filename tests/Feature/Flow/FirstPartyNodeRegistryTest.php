<?php

use App\Models\FlowNodePackage;
use App\Support\Registry\FirstPartyNodeSource;
use Illuminate\Support\Facades\File;
use Tests\TestCase;

uses(TestCase::class);

/**
 * The first-party nodes reach the public registry without a manual step.
 *
 * They did not. `flow:register-node` wrote a row to a database nobody ran it
 * against in production, so `/r/nodes/index.json` served `items: []` while eight
 * nodes sat in `fancy-flow-nodes` — and `npx fancy-cli add node
 *
 * @particle-academy/ui_effect` resolved to nothing for every real consumer.
 * Nothing anywhere reported it, because an empty marketplace is a valid answer.
 *
 * These tests are the thing that would have.
 */
it('serves every first-party node in the compiled artifact', function () {
    // The regression, stated directly: prod reads only this artifact, so if it
    // is empty or missing, the marketplace is empty.
    expect(File::exists(FirstPartyNodeSource::compiledPath()))->toBeTrue(
        'run `php artisan flow:build` and commit the artifact',
    );

    $compiled = json_decode(File::get(FirstPartyNodeSource::compiledPath()), true)['nodes'] ?? [];

    expect($compiled)->not->toBeEmpty();

    $items = collect($this->get('/r/nodes/index.json')->json('items'));

    foreach ($compiled as $node) {
        expect($items->pluck('kind'))->toContain($node['manifest']['kind']);
    }
});

it('carries each node\'s source, which is the whole point of the response', function () {
    // A node is vendored: the CLI writes these files into the project. An entry
    // served without them installs nothing, and says nothing about it.
    $slug = FirstPartyNodeSource::slugFor('@particle-academy/ui_effect');

    $response = $this->get("/r/nodes/{$slug}.json")->assertOk();

    expect($response->json('files'))->not->toBeEmpty();
    expect(collect($response->json('files'))->pluck('target'))
        ->toContain('ui-effect/ui/kind.ts');
});

it('links every index entry to a manifest that resolves', function () {
    // A slug computed two ways — once in the model, once in the source — is a
    // 404 waiting to happen, and it would look exactly like a missing node.
    foreach ($this->get('/r/nodes/index.json')->json('items') as $item) {
        $this->get($item['url'])->assertOk();
    }
});

it('lets a moderated row win over the build artifact', function () {
    // The database carries status and verification a moderator sets. If a build
    // artifact could override that, moderation would mean nothing.
    FlowNodePackage::create([
        'kind' => '@particle-academy/ui_effect',
        'name' => 'particle-academy/fancy-flow-nodes',
        'title' => 'Moderated title',
        'description' => 'set by a moderator',
        'category' => 'io',
        'runtimes' => ['ts'],
        'status' => 'listed',
        'verified' => false,
        'manifest' => ['kind' => '@particle-academy/ui_effect', 'name' => 'x', 'runtimes' => [], 'fixtures' => 'f'],
    ]);

    $items = collect($this->get('/r/nodes/index.json')->json('items'))
        ->where('kind', '@particle-academy/ui_effect');

    expect($items)->toHaveCount(1);
    expect($items->first()['title'])->toBe('Moderated title');
});

it('does not list a node whose submission was withdrawn', function () {
    // Only `listed` is served — a pending or rejected submission is not
    // something an install command should ever resolve.
    FlowNodePackage::create([
        'kind' => '@acme/thing',
        'name' => 'acme/thing',
        'title' => 'Thing',
        'description' => '',
        'category' => 'io',
        'runtimes' => ['ts'],
        'status' => 'pending',
        'manifest' => ['kind' => '@acme/thing'],
    ]);

    expect(collect($this->get('/r/nodes/index.json')->json('items'))->pluck('kind'))
        ->not->toContain('@acme/thing');
});

it('reads the repo when it is there, so a local edit shows up without a build', function () {
    $source = new FirstPartyNodeSource;

    expect($source->fromRepo())->not->toBeNull();
    expect($source->fromRepo())->toHaveKey(FirstPartyNodeSource::slugFor('@particle-academy/llm_screen'));
})->skip(fn () => (new FirstPartyNodeSource)->repoPath() === null, 'needs the sibling repo');

it('distinguishes a missing repo from an empty one', function () {
    // Collapsing those is how a missing checkout silently becomes an empty
    // marketplace — which is the bug, exactly.
    $source = new FirstPartyNodeSource;

    expect($source->repoPath() === null ? $source->fromRepo() : null)->toBeNull();
});

it('agrees with the model about how a kind becomes a slug', function () {
    // Two implementations of one mapping. When they drift, the index links to a
    // 404 that reads as a missing node.
    $package = new FlowNodePackage(['kind' => '@particle-academy/ui_effect']);

    expect(FirstPartyNodeSource::slugFor('@particle-academy/ui_effect'))->toBe($package->slug());
});

<?php

namespace App\Support\Registry;

use Illuminate\Support\Facades\File;

/**
 * The first-party marketplace nodes, sourced from their own repo.
 *
 * ## Why this exists
 *
 * Marketplace nodes reached consumers only through `flow:register-node`, a
 * manual command writing a row to `flow_node_packages`. That works for a
 * third-party SUBMISSION, which is what the table is for — it carries status
 * and verification, and a moderator decides. It is the wrong mechanism for our
 * own nodes, and it failed exactly the way an undeclared manual step always
 * does: production served an empty marketplace while eight nodes sat in
 * `fancy-flow-nodes`, and nothing anywhere said so. `npx fancy-cli@latest add node
 *
 * @particle-academy/ui_effect` resolved to nothing for every real consumer.
 *
 * So first-party nodes are now BUILT, not registered — and the source they are
 * built from lives in THIS app, at `resources/flow-nodes/`, beside the registry
 * it is served from.
 *
 * It used to be a separate repo, and that was the mistake underneath the one
 * above: a repo of its own made a package-shaped thing out of something that
 * must never look installable. Vendoring exists so a consumer can add a node
 * WITHOUT taking on another dependency; a sibling repo kept inviting the
 * opposite reading, including from agents, which tried to
 * `composer require particle-academy/fancy-flow-nodes` and got a 404 — because
 * no such package exists or should.
 *
 * With the source in-app there is no second mode to fall back from: it is
 * present in development and in production alike. The compiled artifact remains
 * as the served payload, not as a stand-in for a checkout that might be missing.
 *
 * The database still wins on a kind collision. A moderator's decision has to
 * beat a build artifact, or moderation means nothing.
 */
class FirstPartyNodeSource
{
    /** @var array<string,array<string,mixed>>|null */
    private ?array $nodes = null;

    public function __construct(private readonly NodeSource $source = new NodeSource) {}

    /**
     * Every first-party node, keyed by slug.
     *
     * @return array<string, array{manifest:array<string,mixed>, files:list<array{target:string,content:string}>}>
     */
    public function all(): array
    {
        return $this->nodes ??= $this->fromRepo() ?? $this->fromCompiled();
    }

    /** One node by its flattened slug, or null. */
    public function find(string $slug): ?array
    {
        return $this->all()[$slug] ?? null;
    }

    /**
     * Index entries, in the shape the registry endpoint serves.
     *
     * `verified` is true for every one of these and is not a claim the package
     * makes: these come from a repo we control, with fixtures that run on both
     * runtimes in its own CI. That is precisely the evidence the flag means.
     *
     * @return list<array<string,mixed>>
     */
    public function indexEntries(): array
    {
        $entries = [];

        foreach ($this->all() as $slug => $node) {
            $manifest = $node['manifest'];

            $entries[] = [
                'kind' => $manifest['kind'],
                'name' => $manifest['name'],
                'title' => $manifest['title'] ?? $manifest['kind'],
                'description' => (string) ($manifest['description'] ?? ''),
                'category' => $manifest['category'] ?? 'io',
                'runtimes' => array_keys((array) ($manifest['runtimes'] ?? [])),
                'verified' => true,
                'url' => "/r/nodes/{$slug}.json",
            ];
        }

        usort($entries, fn (array $a, array $b) => [$a['category'], $a['kind']] <=> [$b['category'], $b['kind']]);

        return $entries;
    }

    /**
     * Scan the marketplace repo.
     *
     * Returns null rather than an empty array when the repo is absent, so the
     * caller can tell "not here, use the artifact" from "here, and empty".
     * Collapsing those is how a missing checkout silently becomes an empty
     * marketplace — the bug this class was written for.
     *
     * @return array<string, array<string,mixed>>|null
     */
    public function fromRepo(): ?array
    {
        $repo = $this->repoPath();
        if ($repo === null) {
            return null;
        }

        $nodes = [];

        foreach (File::directories($repo) as $dir) {
            $manifestPath = "{$dir}/fancy-flow.node.json";
            if (! File::exists($manifestPath)) {
                continue;
            }

            $manifest = json_decode(File::get($manifestPath), true);
            if (! is_array($manifest) || ! isset($manifest['kind'])) {
                continue;
            }

            $nodes[self::slugFor($manifest['kind'])] = [
                'manifest' => $manifest,
                'files' => $this->source->filesFor($manifest, basename($dir)),
            ];
        }

        ksort($nodes);

        return $nodes;
    }

    /** @return array<string, array<string,mixed>> */
    private function fromCompiled(): array
    {
        $path = self::compiledPath();

        return File::exists($path)
            ? (array) (json_decode(File::get($path), true)['nodes'] ?? [])
            : [];
    }

    public static function compiledPath(): string
    {
        return resource_path('registry/flow-nodes.json');
    }

    /**
     * The directory holding node source, or null if it is somehow absent.
     *
     * Kept nullable rather than assumed: a deploy that dropped `resources/` would
     * otherwise fail deep inside a directory read instead of at the check.
     */
    public function repoPath(): ?string
    {
        $path = resource_path('flow-nodes');

        return is_dir($path) ? $path : null;
    }

    /**
     * The flattened slug for a kind id.
     *
     * A kind contains a slash, and percent-encoding a path separator is handled
     * inconsistently by static hosts, CDNs and proxies — so the URL uses a
     * flattened slug and the index carries the mapping. Must match
     * `FlowNodePackage::slug()`; a mismatch means the index links to a 404.
     */
    public static function slugFor(string $kind): string
    {
        return str_replace(['@', '/'], ['', '__'], $kind);
    }
}

<?php

namespace App\Support\Registry;

/**
 * A marketplace node's SOURCE, read off disk and served to `fancy-cli add node`.
 *
 * Nodes are vendored, not installed. `add node` copies a node's files into the
 * project exactly the way `add <component>` copies a component's — so the files
 * land in the app, readable, editable and diffable, instead of hiding in
 * `node_modules` or `vendor`.
 *
 * That is why this exists rather than the registry simply naming an npm package
 * and a Composer package: **there is no package.** One node, one source
 * directory, copied.
 *
 * ## Why the source lives in this app
 *
 * It used to live in a separate `fancy-flow-nodes` repo, compiled in from
 * outside. That put a package-shaped thing in front of something that must never
 * look installable: the whole point of vendoring is that a consumer adds a node
 * WITHOUT taking on another dependency, and a repo of its own kept inviting the
 * opposite reading — including from agents, which tried to
 * `composer require particle-academy/fancy-flow-nodes` and got a 404, because no
 * such package exists or should.
 *
 * The source now sits beside the registry it is served from. There is nothing
 * to install, nothing to publish, and nothing to mistake for a package.
 *
 * Layout it reads, in `resources/flow-nodes/<name>/`:
 *
 *   fancy-flow.node.json   the manifest (declares `ui` + per-runtime `files`)
 *   ui/                    the React kind — copied whichever backend you pick
 *   js/                    the TypeScript executor
 *   php/                   the PHP executor
 *
 * ## Shared parts
 *
 * A manifest may also declare `shared: ["_connector"]`, naming a directory at
 * `resources/flow-nodes/_connector/` that is copied ALONGSIDE the node. Shared
 * directories carry the same `ui/` `js/` `php/` parts, and the same per-runtime
 * split applies to them.
 *
 * This exists because connectors do not scale the way the git nodes did. Each
 * git node duplicates its own `provider.ts` — deliberately, so a node you copy
 * in never depends on a node you did not — and at a dozen nodes that is a fine
 * trade. A connector catalogue is hundreds of nodes over one shared runtime
 * (mode resolution, connections, retry, fakers, signature verification);
 * duplicating that per node would mean a fix to the retry ladder has to be
 * applied hundreds of times inside every consumer's project, and nothing would
 * report the copies that were missed.
 *
 * The invariant that duplication was protecting still holds, because a shared
 * part is not a node: adding one connector installs everything that connector
 * needs, with no second thing to remember and — the entire point of the
 * marketplace — no package. Two connectors write the same shared files twice
 * with identical content.
 *
 * The CLI needs no change for this. Targets stay `<part-root>/<part>/<file>`,
 * and `_connector/php/Mode.php` resolves through the same rule the nodes use:
 * PascalCase the first segment, drop the `php` part, rewrite the namespace. It
 * lands at `app/Flow/Nodes/Connector/Mode.php` as `App\Flow\Nodes\Connector\Mode`.
 */
class NodeSource
{
    /**
     * Read every file a node publishes, keyed for the CLI.
     *
     * Targets are `<node>/<part>/<file>` — the part is what tells the CLI which
     * root a file lands under, so the node's own layout survives the copy
     * instead of being flattened into one directory.
     *
     * @param  array<string,mixed>  $manifest
     * @return list<array{target:string,content:string}>
     */
    public function filesFor(array $manifest, string $node): array
    {
        $root = $this->nodePath($node);
        if ($root === null) {
            return [];
        }

        $parts = array_merge(
            (array) ($manifest['ui'] ?? []),
            ...array_map(
                fn ($runtime) => (array) ($runtime['files'] ?? []),
                array_values((array) ($manifest['runtimes'] ?? [])),
            ),
        );
        $parts = array_values(array_unique($parts));

        $files = [];
        foreach ($parts as $part) {
            foreach ($this->readDirectory($root.'/'.$part) as $relative => $content) {
                $files[] = ['target' => "{$node}/{$part}/{$relative}", 'content' => $content];
            }
        }

        // Shared parts, same part split. A node that declares a shared
        // directory it does not have is a MISSING FILE, not an empty list — so
        // it is reported rather than skipped, because a connector vendored
        // without its runtime installs cleanly and then cannot import anything.
        foreach ($this->sharedRoots($manifest) as $shared) {
            foreach ($parts as $part) {
                foreach ($this->readDirectory($shared.'/'.$part) as $relative => $content) {
                    $name = basename($shared);
                    $files[] = ['target' => "{$name}/{$part}/{$relative}", 'content' => $content];
                }
            }
        }

        return $files;
    }

    /**
     * Absolute paths of the shared directories a manifest declares.
     *
     * Names are constrained to `_`-prefixed lower-case segments and resolved
     * against the flow-nodes root, so a manifest cannot reach outside it. A
     * registry that served whatever path a submitted manifest asked for would
     * be a file-read primitive wearing a JSON field.
     *
     * @param  array<string,mixed>  $manifest
     * @return list<string>
     */
    private function sharedRoots(array $manifest): array
    {
        $roots = [];

        foreach ((array) ($manifest['shared'] ?? []) as $name) {
            if (! is_string($name) || preg_match('/^_[a-z0-9-]+$/', $name) !== 1) {
                continue;
            }

            $path = resource_path('flow-nodes/'.$name);
            if (is_dir($path)) {
                $roots[] = $path;
            }
        }

        return $roots;
    }

    /**
     * Absolute path to a node's source, or null if that node does not exist.
     *
     * No longer a "is the sibling repo checked out" question: the source ships
     * with this app, so it is present in development and production alike. Null
     * here means the node is unknown, not that the environment is incomplete.
     */
    public function nodePath(string $node): ?string
    {
        $path = resource_path('flow-nodes/'.$node);

        return is_dir($path) ? $path : null;
    }

    /**
     * Every file under a directory, relative path => contents.
     *
     * @return array<string,string>
     */
    private function readDirectory(string $dir): array
    {
        if (! is_dir($dir)) {
            return [];
        }

        $files = [];
        $iterator = new \RecursiveIteratorIterator(
            new \RecursiveDirectoryIterator($dir, \FilesystemIterator::SKIP_DOTS),
        );

        foreach ($iterator as $file) {
            /** @var \SplFileInfo $file */
            if (! $file->isFile()) {
                continue;
            }
            $relative = str_replace('\\', '/', substr($file->getPathname(), strlen($dir) + 1));
            $files[$relative] = (string) file_get_contents($file->getPathname());
        }

        // Deterministic order: the CLI prints what it wrote, and a listing that
        // reshuffles between runs makes a diff of two installs unreadable.
        ksort($files);

        return $files;
    }
}

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
 * and a Composer package: there is no package. One node, one source directory,
 * copied.
 *
 * Layout it reads, in `repos/fancy-flow-nodes/nodes/<name>/`:
 *
 *   fancy-flow.node.json   the manifest (declares `ui` + per-runtime `files`)
 *   ui/                    the React kind — copied whichever backend you pick
 *   js/                    the TypeScript executor
 *   php/                   the PHP executor
 */
class NodeSource
{
    /** Where the marketplace repo sits in a Genie/`.agi` workspace. */
    private const REPO = 'fancy-flow-nodes';

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

        $files = [];
        foreach (array_unique($parts) as $part) {
            foreach ($this->readDirectory($root.'/'.$part) as $relative => $content) {
                $files[] = ['target' => "{$node}/{$part}/{$relative}", 'content' => $content];
            }
        }

        return $files;
    }

    /**
     * Absolute path to a node's source, or null when the marketplace repo is
     * not on disk.
     *
     * Production deploys only px-ui-sandbox, so there are no siblings there —
     * the compiled artifact carries the file contents instead, the same
     * arrangement the component registry uses.
     */
    public function nodePath(string $node): ?string
    {
        foreach ([dirname(base_path()).'/'.self::REPO, base_path('packages/'.self::REPO)] as $candidate) {
            $path = $candidate.'/nodes/'.$node;
            if (is_dir($path)) {
                return $path;
            }
        }

        return null;
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

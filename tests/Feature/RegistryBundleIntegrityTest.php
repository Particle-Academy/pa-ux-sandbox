<?php

use App\Support\Registry\RegistrySource;
use Tests\TestCase;

uses(TestCase::class);

/**
 * A registry item has to be able to COMPILE where it lands.
 *
 * `npx fancy-cli add <name>` copies an item's files into a consumer's project
 * verbatim. If one of those files imports a sibling module that was never
 * copied, the vendored result does not build — and nothing here reports it,
 * because the registry served a 200 with a well-formed payload. That is exactly
 * how 23 of 262 items shipped broken across 9 packages: `inputs` alone dropped
 * 12 subdirectories, and it surfaced only when a consumer tried to build what
 * the CLI gave them.
 */

/** Resolve a relative import against a bundle's own file list, bundler-style. */
function bundleResolves(string $baseDir, string $import, array $paths): bool
{
    // A published-style import writes `.js` for what is `.ts`/`.tsx` on disk.
    if (str_ends_with($import, '.js')) {
        $import = substr($import, 0, -3);
    }

    $target = str_replace('\\', '/', (string) realpath_like($baseDir, $import));

    foreach (['', '.tsx', '.ts', '.jsx', '.js', '/index.tsx', '/index.ts'] as $ext) {
        if (in_array($target.$ext, $paths, true)) {
            return true;
        }
    }

    return false;
}

/** Normalise `a/b/../c` without touching the filesystem — these paths are virtual. */
function realpath_like(string $base, string $rel): string
{
    $parts = [];
    foreach (explode('/', trim($base, '/').'/'.$rel) as $segment) {
        if ($segment === '' || $segment === '.') {
            continue;
        }
        if ($segment === '..') {
            array_pop($parts);

            continue;
        }
        $parts[] = $segment;
    }

    return implode('/', $parts);
}

it('vendors every sibling module its own files import', function () {
    $offenders = [];

    foreach (app(RegistrySource::class)->all() as $item) {
        $files = $item->files;

        if ($files === []) {
            continue;
        }

        $paths = array_map(fn ($f) => (string) ($f['path'] ?? ''), $files);

        foreach ($files as $file) {
            $path = (string) ($file['path'] ?? '');
            $base = dirname($path);

            // Only `./` imports. A `../../utils/x` import leaves the component's
            // own tree and belongs to a declared registry dependency — pulling
            // those into every bundle would duplicate shared code.
            preg_match_all('/from\s+[\'"](\.\/[^\'"]+)[\'"]/', (string) ($file['content'] ?? ''), $m);

            foreach ($m[1] ?? [] as $import) {
                if (! bundleResolves($base, $import, $paths)) {
                    $offenders[] = "{$item->name}: {$path} imports {$import}";
                }
            }
        }
    }

    expect($offenders)->toBe([], "these registry items vendor source that cannot compile:\n  ".implode("\n  ", array_slice($offenders, 0, 20)));
});

it('gives every item at least one file or a package to install instead', function () {
    // Not every item vendors source. When the builder cannot locate a
    // component's files it degrades to an install pointer — which is fine, and
    // is how 114 of the items work — but only if it still names the package.
    // An item with neither is a dead entry: the CLI copies nothing, says
    // nothing went wrong, and the consumer is left with an empty directory.
    $dead = [];

    foreach (app(RegistrySource::class)->all() as $item) {
        if ($item->files === [] && ($item->package === null || $item->package === '')) {
            $dead[] = $item->name;
        }
    }

    expect($dead)->toBe([], 'these items vendor nothing and name no package: '.implode(', ', $dead));
});

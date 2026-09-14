<?php

use Illuminate\Support\Facades\File;
use Tests\TestCase;

uses(TestCase::class);

/**
 * Every place this site tells someone how to run fancy-cli gets a current CLI.
 *
 * `docs/cli.md` offered `npx fancy-cli@0.1.0 init` as its pinning example. 0.1.0
 * predates `add node`, the update check, and the 0.8.2 fix for first-party
 * nodes (0.8.1 and older print `undefined` beside one, now that their manifests
 * carry no package name). Copying the example got all of that.
 *
 * Bare `npx fancy-cli …` is a quieter version of the same thing: npx caches by
 * package name, so it can keep running whatever copy it fetched first.
 *
 * Scoped to what a reader acts on — the docs and the MCP tools' text. Frozen
 * snapshots under `resources/docs/<version>/` are included: the CLI is not
 * versioned with the kit, so advice to run an old one is wrong on every line.
 */
const OLDEST_ACCEPTABLE_CLI = '0.8.2';

it('never tells a reader to run a fancy-cli older than '.OLDEST_ACCEPTABLE_CLI.', or an unpinned one', function () {
    $files = [
        ...File::allFiles(resource_path('docs')),
        ...File::allFiles(app_path('Mcp')),
    ];

    expect(count($files))->toBeGreaterThan(10);

    $offenders = [];

    foreach ($files as $file) {
        $text = File::get($file->getPathname());
        $where = str_replace(base_path().DIRECTORY_SEPARATOR, '', $file->getPathname());

        preg_match_all('/fancy-cli@(\d+\.\d+\.\d+)/', $text, $pinned);

        foreach ($pinned[1] as $version) {
            if (version_compare($version, OLDEST_ACCEPTABLE_CLI, '<')) {
                $offenders[] = "{$where}: fancy-cli@{$version}";
            }
        }

        // `npx fancy-cli` followed by anything but `@`.
        if (preg_match_all('/npx (?:-y )?fancy-cli(?!@)/', $text, $bare) > 0) {
            $offenders[] = "{$where}: bare `npx fancy-cli` ×".count($bare[0]);
        }
    }

    expect($offenders)->toBe([], "these tell a reader to run a stale fancy-cli; use `npx fancy-cli@latest`:\n  ".implode("\n  ", $offenders));
});

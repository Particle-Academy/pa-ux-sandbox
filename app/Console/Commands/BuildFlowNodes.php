<?php

namespace App\Console\Commands;

use App\Support\Registry\FirstPartyNodeSource;
use FancyFlow\Marketplace\NodeManifest;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\File;

/**
 * Compile the first-party marketplace nodes into an artifact prod can read.
 *
 * Production deploys only this app, so `repos/fancy-flow-nodes` is not there and
 * neither is any node's source. Without this the public registry serves an empty
 * marketplace — which is exactly what it did, silently, while eight nodes sat in
 * the repo. Same arrangement as `registry:build`, `readmes:build` and `tui:build`.
 *
 * **Run this and commit the artifact whenever a node changes**, or the CLI hands
 * consumers a stale copy of its source with nothing to say so.
 */
class BuildFlowNodes extends Command
{
    protected $signature = 'flow:build';

    protected $description = 'Compile first-party marketplace nodes -> resources/registry/flow-nodes.json';

    public function handle(FirstPartyNodeSource $source): int
    {
        $repo = $source->repoPath();

        if ($repo === null) {
            // Refuse rather than write an empty artifact. Overwriting a good
            // artifact with nothing, because a checkout was missing, would
            // deploy an empty marketplace and report success.
            $this->error('fancy-flow-nodes is not on disk. Run this in a workspace that has the marketplace repo checked out.');

            return self::FAILURE;
        }

        $nodes = $source->fromRepo() ?? [];

        if ($nodes === []) {
            $this->error("No node manifests under {$repo}/nodes.");

            return self::FAILURE;
        }

        $invalid = 0;

        foreach ($nodes as $slug => $node) {
            // Validate through the engine's own validator, never a local
            // reimplementation: a registry that disagrees with the runtime
            // about what a valid manifest is serves packages the runtime then
            // refuses, which is worse than not checking.
            $problems = collect(NodeManifest::validate($node['manifest']))
                ->where('level', 'error');

            if ($problems->isNotEmpty()) {
                $this->error("{$slug}: ".$problems->pluck('message')->implode('; '));
                $invalid++;

                continue;
            }

            $files = count($node['files']);
            $this->line("  <fg=green>✓</> {$node['manifest']['kind']} <fg=gray>({$files} files)</>");

            if ($files === 0) {
                // A manifest whose directories are all missing compiles to a
                // node the CLI copies nothing for, and says nothing about.
                $this->warn("    {$slug} published no files — check the directories its manifest declares.");
            }
        }

        if ($invalid > 0) {
            $this->error("{$invalid} manifest(s) invalid. Nothing written.");

            return self::FAILURE;
        }

        File::ensureDirectoryExists(dirname(FirstPartyNodeSource::compiledPath()));
        File::put(
            FirstPartyNodeSource::compiledPath(),
            json_encode(['nodes' => $nodes], JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE)."\n",
        );

        $this->info(count($nodes).' node(s) -> '.FirstPartyNodeSource::compiledPath());

        return self::SUCCESS;
    }
}

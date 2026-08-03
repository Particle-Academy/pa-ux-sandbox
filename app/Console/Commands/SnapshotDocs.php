<?php

namespace App\Console\Commands;

use App\Support\Docs\DocsArchive;
use App\Support\Docs\DocsRegistry;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\File;

/**
 * Freeze the current docs as a version snapshot, so they stay readable after
 * the kit moves on.
 *
 * Run this at a kit cut, BEFORE bumping `kit.json` — the snapshot is of the
 * outgoing line, and the version it is filed under is the one the docs describe.
 */
class SnapshotDocs extends Command
{
    protected $signature = 'docs:snapshot {version? : The kit version to file the snapshot under. Defaults to the current one.}
                                          {--force : Overwrite an existing snapshot.}';

    protected $description = 'Freeze resources/docs into resources/docs/{version} for the version selector';

    public function handle(): int
    {
        $version = (string) ($this->argument('version') ?: DocsArchive::current());

        if (! preg_match('/^\d+\.\d+$/', $version)) {
            $this->error("Version must look like \"0.4\", got \"$version\".");

            return self::FAILURE;
        }

        $target = base_path("resources/docs/$version");

        if (File::isDirectory($target) && ! $this->option('force')) {
            $this->error("A snapshot for $version already exists. Pass --force to overwrite it.");

            return self::FAILURE;
        }

        File::ensureDirectoryExists($target);

        // Only top-level .md — the version directories are siblings, and copying
        // recursively would nest every past snapshot inside the new one.
        $copied = 0;
        foreach (File::files(base_path('resources/docs')) as $file) {
            if ($file->getExtension() !== 'md') {
                continue;
            }

            File::copy($file->getPathname(), "$target/{$file->getFilename()}");
            $copied++;
        }

        // The sidebar, frozen alongside the prose. Without it the snapshot would
        // render through the CURRENT registry and link to pages it does not have.
        File::put(
            DocsArchive::manifestPath($version),
            json_encode([
                'version' => $version,
                'sections' => DocsRegistry::sections(),
            ], JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES).PHP_EOL,
        );

        $this->info("Snapshotted $copied pages to resources/docs/$version.");
        $this->line('Commit the directory — it is served from the repo, not generated at deploy.');

        return self::SUCCESS;
    }
}

<?php

namespace App\Console\Commands;

use App\Support\Registry\ReadmeSource;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\File;

/**
 * Compile every package's README into a committed artifact.
 *
 * Production (Forge) deploys ONLY px-ui-sandbox — the sibling repos aren't
 * there — so {@see ReadmeSource} cannot read them live and falls back to this
 * file. Same arrangement as `registry:build`, and for the same reason.
 *
 * Run it after a package's README changes, then commit the artifact. A stale
 * artifact is not a broken page, just an old one; a missing artifact means
 * every uninstalled package loses its docs in production, which is the bug this
 * whole path exists to close.
 */
class BuildReadmes extends Command
{
    protected $signature = 'readmes:build';

    protected $description = 'Compile every package README from its repo into resources/registry/readmes.json (so docs work in production).';

    public function handle(ReadmeSource $readmes): int
    {
        if (! $readmes->liveSourceAvailable()) {
            $this->error(
                'No package repos found on disk. Run this in the .agi workspace where the sibling '
                .'repos exist (local dev or CI).'
            );

            return self::FAILURE;
        }

        $compiled = [];
        $missing = [];

        foreach ($readmes->everyPackage() as $pkg) {
            $slug = (string) ($pkg['slug'] ?? '');
            if ($slug === '') {
                continue;
            }

            $markdown = $readmes->fromRepo($slug);
            if ($markdown !== null && trim($markdown) !== '') {
                $compiled[$slug] = $markdown;
            } elseif ($readmes->repoDir($slug) !== null) {
                // The repo is here and has no README. Worth naming: it is a
                // package whose docs page will be empty, and nothing else says so.
                $missing[] = $slug;
            }
        }

        ksort($compiled);

        File::ensureDirectoryExists(dirname(ReadmeSource::compiledPath()));
        File::put(
            ReadmeSource::compiledPath(),
            json_encode(
                ['$schema' => 'https://ui.particle.academy/schema/readmes-compiled.json', 'readmes' => $compiled],
                JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE,
            )."\n",
        );

        $this->info(count($compiled).' README(s) compiled → '.ReadmeSource::compiledPath());

        if ($missing !== []) {
            $this->warn(count($missing).' package(s) have a repo but no README: '.implode(', ', $missing));
        }

        return self::SUCCESS;
    }
}

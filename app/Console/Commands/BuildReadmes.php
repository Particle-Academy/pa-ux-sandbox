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
        $skipped = [];

        foreach ($readmes->everyPackage() as $pkg) {
            $slug = (string) ($pkg['slug'] ?? '');
            if ($slug === '') {
                continue;
            }

            // SKIP anything the showcase installs. Its README ships inside the
            // package, at exactly the version in use, so a compiled copy would
            // be a duplicate that can only go stale -- and `ReadmeSource` reads
            // the installed file before this artifact anyway, so the copy would
            // never be used.
            //
            // This is what keeps the artifact to the packages that genuinely
            // have no other source in production. It also means the artifact
            // DEPENDS on `node_modules` / `vendor` being present on the server:
            // they are (the deploy installs the full tree -- see tui-service's
            // README on why `--omit=dev` is not used), and
            // `ReadmeSourceTest`'s production-shaped case fails if any package
            // would resolve through neither path.
            if ($readmes->isInstalled($pkg)) {
                $skipped[] = $slug;

                continue;
            }

            $markdown = $readmes->fromRepo($slug, $pkg);
            if ($markdown !== null && trim($markdown) !== '') {
                $compiled[$slug] = $markdown;
            } elseif ($readmes->repoDir($slug, $pkg) !== null) {
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
                // No `$schema`: none is maintained for this internal artifact,
                // and the one it named was a 404. See PublishedSchemasTest.
                ['readmes' => $compiled],
                JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE,
            )."\n",
        );

        $this->info(count($compiled).' README(s) compiled → '.ReadmeSource::compiledPath());
        if ($skipped !== []) {
            $this->line(count($skipped).' skipped — installed, so read from the package itself.');
        }

        if ($missing !== []) {
            $this->warn(count($missing).' package(s) have a repo but no README: '.implode(', ', $missing));
        }

        return self::SUCCESS;
    }
}

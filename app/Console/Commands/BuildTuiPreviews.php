<?php

namespace App\Console\Commands;

use App\Support\Registry\TuiPreviewSource;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\File;

/**
 * Compile fancy-tui's captured frames into a committed artifact.
 *
 * Production deploys only px-ui-sandbox, so the package repo is not there to
 * read. Same arrangement as `registry:build` and `readmes:build`.
 *
 * The frames themselves come from fancy-tui's own harness — `npm run showcase`
 * in that repo, which renders each component through real Ink and captures the
 * output. Re-run that FIRST when a component changes; this command only copies
 * what it produced.
 */
class BuildTuiPreviews extends Command
{
    protected $signature = 'tui:build';

    protected $description = 'Compile fancy-tui captured frames into resources/registry/tui-previews.json (so previews work in production).';

    public function handle(TuiPreviewSource $previews): int
    {
        $frames = $previews->fromRepo();

        if ($frames === null) {
            $this->error(
                'fancy-tui/showcase/previews.json not found. Run this in the .agi workspace where the '
                .'sibling repos exist, and run `npm run showcase` in fancy-tui first.'
            );

            return self::FAILURE;
        }

        File::ensureDirectoryExists(dirname(TuiPreviewSource::compiledPath()));
        File::put(
            TuiPreviewSource::compiledPath(),
            json_encode(
                ['$schema' => 'https://ui.particle.academy/schema/tui-previews.json', 'components' => $frames],
                JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE,
            )."\n",
        );

        $this->info(count($frames).' captured frame(s) compiled → '.TuiPreviewSource::compiledPath());

        return self::SUCCESS;
    }
}

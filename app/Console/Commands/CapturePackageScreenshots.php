<?php

declare(strict_types=1);

namespace App\Console\Commands;

use App\Services\Showcase\PackageShotRenderer;
use App\Support\PackageScreenshots;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\File;
use Throwable;

/**
 * Capture the package-page screenshots from this site's own pages.
 *
 * Point `--base` at a running copy of the showcase (the local site, or
 * production for pages already deployed). Each capture replaces its file only
 * when it succeeds, so a failed run never blanks a page's image. Commit the
 * files it writes.
 */
class CapturePackageScreenshots extends Command
{
    protected $signature = 'packages:screenshots
        {slugs?* : Packages to capture; all listed in PackageScreenshots when omitted}
        {--base= : The showcase origin to capture from (default: app.url)}';

    protected $description = 'Capture package-page screenshots from the showcase into public/package-shots';

    public function handle(PackageShotRenderer $renderer): int
    {
        $all = PackageScreenshots::all();
        $slugs = $this->argument('slugs') ?: array_keys($all);

        $unknown = array_values(array_diff($slugs, array_keys($all)));
        if ($unknown !== []) {
            $this->error('No capture is defined for: '.implode(', ', $unknown).'. Add it to App\Support\PackageScreenshots first.');

            return self::FAILURE;
        }

        $base = rtrim((string) ($this->option('base') ?: config('app.url')), '/');
        $dir = (string) config('screenshots.package_shots_dir');
        File::ensureDirectoryExists($dir);

        $failed = [];
        foreach ($slugs as $slug) {
            $url = $base.$all[$slug]['from'];
            try {
                $bytes = $renderer->render($url, $all[$slug]['selector']);
            } catch (Throwable $e) {
                $failed[] = $slug;
                $this->error("{$slug}: {$url} failed: ".strtok($e->getMessage(), "\n"));

                continue;
            }
            File::put($dir.DIRECTORY_SEPARATOR.$slug.'.jpg', $this->cropToFrame($bytes));
            $this->line(sprintf('%s: %s (%d KB)', $slug, $url, intdiv(strlen($bytes), 1024)));
        }

        $this->newLine();
        $this->info(sprintf('%d of %d captured.', count($slugs) - count($failed), count($slugs)));

        return $failed === [] ? self::SUCCESS : self::FAILURE;
    }

    /**
     * Keep the top 16:10 of a capture taller than that. The package page shows
     * the image in a 16:10 frame, where a tall demo would shrink to an
     * unreadable strip; the top of a demo is where its subject is.
     */
    private function cropToFrame(string $jpeg): string
    {
        $image = @imagecreatefromstring($jpeg);
        if ($image === false) {
            return $jpeg;
        }
        $width = imagesx($image);
        $maxHeight = intdiv($width * 10, 16);
        if (imagesy($image) <= $maxHeight) {
            return $jpeg;
        }
        $cropped = imagecrop($image, ['x' => 0, 'y' => 0, 'width' => $width, 'height' => $maxHeight]);
        if ($cropped === false) {
            return $jpeg;
        }
        ob_start();
        imagejpeg($cropped, null, 82);

        return (string) ob_get_clean();
    }
}

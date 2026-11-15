<?php

namespace App\Console\Commands;

use App\Models\PackageDownload;
use App\Support\Downloads\DownloadFetcher;
use App\Support\Downloads\PublishedNames;
use Illuminate\Console\Command;
use Throwable;

/**
 * Refresh public download counts for every published package, on every
 * registry it publishes to. Scheduled daily in routes/console.php.
 *
 * A failed fetch never writes a number. The last known counts and their
 * `fetched_at` stay as they were, the failure is recorded on the row, and the
 * command exits non-zero so a scheduler log shows it. A failure is not zero
 * downloads, and a page must not say it is.
 */
final class FetchPackageDownloads extends Command
{
    protected $signature = 'packages:fetch-downloads
        {--package=* : Only these package slugs (repeatable)}
        {--dry-run : Print what would be fetched and request nothing}';

    protected $description = 'Fetch public download counts from npm, Packagist and PyPI for every published package.';

    public function handle(DownloadFetcher $fetcher): int
    {
        $targets = PublishedNames::targets();

        $only = array_values(array_filter((array) $this->option('package')));
        if ($only !== []) {
            $known = array_unique(array_column($targets, 'slug'));
            $unknown = array_diff($only, $known);
            if ($unknown !== []) {
                $this->error('Not a published package: '.implode(', ', $unknown));

                return self::FAILURE;
            }
            $targets = array_values(array_filter($targets, fn (array $t) => in_array($t['slug'], $only, true)));
        }

        if ($this->option('dry-run')) {
            foreach ($targets as $t) {
                $this->line("{$t['slug']}  [{$t['source']}]  {$t['name']}");
                foreach ($fetcher->plannedUrls($t['source'], $t['name']) as $url) {
                    $this->line("    {$url}");
                }
            }
            $this->info(count($targets).' targets; nothing requested (dry run).');

            return self::SUCCESS;
        }

        $failed = 0;
        foreach ($targets as $t) {
            $row = PackageDownload::query()->firstOrNew(['slug' => $t['slug'], 'source' => $t['source']]);
            $row->name = $t['name'];

            try {
                $counts = $fetcher->fetch($t['source'], $t['name']);
                $row->fill($counts + [
                    'fetched_at' => now(),
                    'last_error' => null,
                    'consecutive_failures' => 0,
                ]);
                $row->save();
                $this->line(sprintf(
                    '  ok    %-28s %-9s month=%s total=%s',
                    $t['slug'], $t['source'],
                    $counts['monthly'] ?? '-', $counts['total'] ?? '-',
                ));
            } catch (Throwable $e) {
                $failed++;
                $row->last_error = mb_substr($e->getMessage(), 0, 1000);
                $row->failed_at = now();
                $row->consecutive_failures = (int) $row->consecutive_failures + 1;
                $row->save();
                $this->warn(sprintf('  FAIL  %-28s %-9s %s', $t['slug'], $t['source'], $row->last_error));
            }
        }

        $this->info(sprintf('%d targets, %d ok, %d failed (last known values kept).', count($targets), count($targets) - $failed, $failed));

        return $failed === 0 ? self::SUCCESS : self::FAILURE;
    }
}

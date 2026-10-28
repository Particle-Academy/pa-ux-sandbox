<?php

declare(strict_types=1);

namespace App\Console\Commands;

use App\Support\Catalog\CatalogDrift;
use Illuminate\Console\Command;

/**
 * Is everything we publish in the catalogue, and is everything in the
 * catalogue published?
 *
 * `kit:status` asks the registries about what PackageRegistry lists. This asks
 * them what EXISTS, and fails on the difference -- the drift that left ten live
 * packages invisible until the 2026-10-27 audit. The checks and their rules are
 * documented on {@see CatalogDrift}; this class only renders them.
 *
 * Exits non-zero on any finding AND on any UNKNOWN: a lookup that failed is a
 * check that did not happen, never a pass.
 */
final class KitCatalogDrift extends Command
{
    protected $signature = 'kit:catalog-drift
        {--json : Machine-readable output}
        {--repos= : Directory holding our repos, for pyproject.toml names (default: the envelope, when present)}';

    protected $description = 'Fail when a published package is missing from PackageRegistry, a PLANNED or HIDDEN entry is live, a listed one 404s, or a lookup fails.';

    public function handle(CatalogDrift $drift): int
    {
        $repos = $this->option('repos');
        $root = is_string($repos) && $repos !== '' ? $repos : base_path('..');

        $report = $drift->run(is_dir($root) ? $root : null);

        if ($this->option('json')) {
            $this->line((string) json_encode($report, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES));
        } else {
            $this->render($report);
        }

        return $report['ok'] ? self::SUCCESS : self::FAILURE;
    }

    /** @param array{ok: bool, checks: list<array<string,mixed>>, unknown: list<array<string,string>>} $report */
    private function render(array $report): void
    {
        $this->newLine();

        foreach ($report['checks'] as $check) {
            $count = count($check['findings']);
            $verdict = $count === 0 ? '<fg=green>CLEAN</>' : "<fg=red;options=bold>{$count} DRIFT</>";

            $this->line(sprintf('  %-46s %5d %s  %s', $check['label'], $check['denominator'], $check['unit'], $verdict));

            foreach ($check['findings'] as $f) {
                $this->line(sprintf('      <fg=red>%s</>  %s %s  <fg=gray>%s</>', strtoupper($f['class']), $f['registry'], $f['name'], $f['detail']));
            }

            if (($check['skipped'] ?? []) !== []) {
                $this->line('      <fg=gray>no registry to ask (vendorable blocks): '.implode(', ', $check['skipped']).'</>');
            }
        }

        if ($report['unknown'] !== []) {
            $this->newLine();
            $this->line(sprintf('  <fg=magenta;options=bold>UNKNOWN</> %d lookup(s) FAILED -- this is not a pass:', count($report['unknown'])));

            foreach ($report['unknown'] as $u) {
                $this->line("      {$u['registry']} {$u['name']}  <fg=gray>{$u['reason']}</>");
            }
        }

        $this->newLine();
        $this->line($report['ok']
            ? '  <fg=green>No catalogue drift.</>'
            : '  <fg=red;options=bold>Catalogue drift, or a check that could not run. See above.</>');
        $this->newLine();
    }
}

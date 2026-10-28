<?php

declare(strict_types=1);

namespace App\Console\Commands;

use App\Support\StarterKitDogfood;
use Illuminate\Console\Command;

/**
 * `php artisan kit:dogfood-starter-kit` -- fail if the Laravel starter kit's
 * committed lockfiles are behind the latest release of any first-party package.
 *
 * The sibling of `kit:dogfood`, which asks the same question about the showcase.
 * The rule both enforce: when a package ships, its consumers take it in the
 * same session. The kit is the consumer every new user starts from, so a stale
 * kit is the one lag that reaches people who never chose an old version. The
 * checks and their rules are documented on {@see StarterKitDogfood}.
 *
 * Exits non-zero on anything behind AND on any UNKNOWN: a lookup that failed is
 * a check that did not happen, never a pass.
 */
final class DogfoodStarterKit extends Command
{
    protected $signature = 'kit:dogfood-starter-kit {--json : Machine-readable output}';

    protected $description = 'Verify the Laravel starter kit\'s committed lockfiles carry the latest of every first-party package';

    public function handle(StarterKitDogfood $check): int
    {
        $report = $check->run();

        if ($this->option('json')) {
            $this->line((string) json_encode($report, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES));

            return $report['ok'] ? self::SUCCESS : self::FAILURE;
        }

        $total = array_sum($report['checked']);

        $this->info(sprintf(
            '%d first-party packages in %s@main (package-lock.json: %d, composer.lock: %d).',
            $total,
            StarterKitDogfood::REPO,
            $report['checked']['package-lock.json'],
            $report['checked']['composer.lock'],
        ));

        foreach ($report['behind'] as $label => [$have, $want]) {
            $this->line("  <fg=red>BEHIND</> {$label}  {$have} -> {$want}");
        }

        foreach ($report['unknown'] as $u) {
            $this->line("  <fg=magenta;options=bold>UNKNOWN</> {$u['source']}  <fg=gray>{$u['reason']}</>");
        }

        if ($report['ok']) {
            $this->info('The starter kit ships the latest of everything.');

            return self::SUCCESS;
        }

        $this->newLine();
        $this->error($report['unknown'] === []
            ? 'The starter kit is behind. A fresh `laravel new --using=` installs these old releases.'
            : 'The starter kit could not be fully checked. That is a failure, not a pass.');
        $this->line('  In repos/fancy-starter-kit: npm update @particle-academy/<name> (or composer update particle-academy/<name>),');
        $this->line('  then tests, npm run build, a dev-mode smoke, CHANGELOG, commit the lockfile, push, and tag a patch.');

        return self::FAILURE;
    }
}

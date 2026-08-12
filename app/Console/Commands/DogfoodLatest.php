<?php

declare(strict_types=1);

namespace App\Console\Commands;

use App\Support\DogfoodCheck;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Http;

/**
 * `php artisan kit:dogfood` — fail if the showcase is not running the latest
 * release of every first-party package.
 *
 * The rule this enforces: **after any package ships, the sandbox takes it.**
 * The showcase is part of the kit's end-to-end suite, and a suite running
 * versions nobody ships tests code consumers never receive.
 *
 * A note in AGENTS.md would not have held. That file's own TDD section says as
 * much — thirteen packages had drifted away from a rule written down in it —
 * so this is a command that exits non-zero instead.
 */
final class DogfoodLatest extends Command
{
    protected $signature = 'kit:dogfood {--json : Machine-readable output}';

    protected $description = 'Verify the showcase runs the latest release of every first-party package';

    public function handle(): int
    {
        $installed = [...$this->installedComposer(), ...$this->installedNpm()];

        if ($installed === []) {
            $this->error('Found no first-party packages at all — that is a broken check, not a clean one.');

            return self::FAILURE;
        }

        $latest = [];
        foreach ($installed as $name => $_) {
            $latest[$name] = str_starts_with($name, '@')
                ? $this->latestFromNpm($name)
                : $this->latestFromPackagist($name);
        }

        $result = DogfoodCheck::compare($installed, $latest);

        if ($this->option('json')) {
            $this->line((string) json_encode($result, JSON_PRETTY_PRINT));

            return DogfoodCheck::passes($result) ? self::SUCCESS : self::FAILURE;
        }

        $this->info(count($installed).' first-party packages checked.');

        foreach ($result['behind'] as $name => [$have, $want]) {
            $this->line("  <fg=red>BEHIND</> {$name}  {$have} -> {$want}");
        }

        foreach ($result['unchecked'] as $name) {
            $this->line("  <fg=yellow>UNCHECKED</> {$name} — the registry lookup failed");
        }

        if (DogfoodCheck::passes($result)) {
            $this->info('The showcase is running the latest of everything.');

            return self::SUCCESS;
        }

        $this->newLine();
        $this->error('The showcase is not dogfooding the kit. Update it, then re-run.');
        $this->line('  composer update particle-academy/*');
        $this->line('  npm install @particle-academy/<name>@latest');

        return self::FAILURE;
    }

    /** @return array<string,string> */
    private function installedComposer(): array
    {
        $path = base_path('vendor/composer/installed.json');

        if (! is_file($path)) {
            return [];
        }

        $packages = json_decode((string) file_get_contents($path), true)['packages'] ?? [];
        $out = [];

        foreach ($packages as $package) {
            $name = (string) ($package['name'] ?? '');
            if (str_starts_with($name, 'particle-academy/')) {
                $out[$name] = (string) ($package['version'] ?? '');
            }
        }

        return $out;
    }

    /**
     * Read from `node_modules`, not `package.json`.
     *
     * The constraint is what someone INTENDED; the installed version is what
     * the app actually runs, and they disagree exactly when this check matters.
     *
     * @return array<string,string>
     */
    private function installedNpm(): array
    {
        $declared = json_decode((string) file_get_contents(base_path('package.json')), true);
        $names = array_keys([...$declared['dependencies'] ?? [], ...$declared['devDependencies'] ?? []]);
        $out = [];

        foreach ($names as $name) {
            if (! str_starts_with((string) $name, '@particle-academy/')) {
                continue;
            }

            $manifest = base_path("node_modules/{$name}/package.json");

            if (is_file($manifest)) {
                $out[$name] = (string) (json_decode((string) file_get_contents($manifest), true)['version'] ?? '');
            }
        }

        return $out;
    }

    private function latestFromPackagist(string $name): ?string
    {
        try {
            $response = Http::timeout(20)->get("https://repo.packagist.org/p2/{$name}.json");

            return $response->successful()
                ? ($response->json("packages.{$name}.0.version") ?? null)
                : null;
        } catch (\Throwable) {
            return null;
        }
    }

    private function latestFromNpm(string $name): ?string
    {
        try {
            $response = Http::timeout(20)->get('https://registry.npmjs.org/'.str_replace('/', '%2F', $name));

            return $response->successful()
                ? ($response->json('dist-tags.latest') ?? null)
                : null;
        } catch (\Throwable) {
            return null;
        }
    }
}

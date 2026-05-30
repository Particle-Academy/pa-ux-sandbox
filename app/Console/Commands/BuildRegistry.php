<?php

namespace App\Console\Commands;

use App\Support\Registry\RegistrySource;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\File;

/**
 * Compile the component registry from the sibling package source into a
 * committed artifact (resources/registry/registry.json).
 *
 * Production (Forge) deploys ONLY px-ui-sandbox — the sibling packages
 * (../react-fancy, …) aren't present — so the live disk scan returns nothing
 * and the registry / install-MCP come up empty. This command, run where the
 * workspace siblings DO exist (local dev or CI), serializes the full registry
 * so it ships with the app. `RegistrySource::all()` reads this artifact in
 * production and scans live everywhere else.
 *
 * Run after changing any package's components, then commit the artifact.
 */
class BuildRegistry extends Command
{
    protected $signature = 'registry:build';

    protected $description = 'Compile the component registry from sibling package source into resources/registry/registry.json (so it works in production).';

    public function handle(RegistrySource $registry): int
    {
        if (! $registry->liveSourceAvailable()) {
            $this->error('Sibling package source not found on disk. Run this in the fancy-ui workspace where ../react-fancy etc. exist (local dev or CI).');

            return self::FAILURE;
        }

        $items = $registry->scanLive();
        usort($items, fn ($a, $b) => $a->name <=> $b->name);

        $payload = [
            '$schema' => 'https://ui.particle.academy/schema/registry-compiled.json',
            'count' => count($items),
            'items' => array_map(fn ($item) => $item->toArray(), $items),
        ];

        $path = RegistrySource::compiledPath();
        File::ensureDirectoryExists(dirname($path));
        File::put($path, json_encode($payload, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES) . "\n");

        $this->info("Compiled {$payload['count']} components → {$path}");
        $this->line('Commit the artifact so production serves a populated registry.');

        return self::SUCCESS;
    }
}

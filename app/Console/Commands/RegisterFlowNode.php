<?php

namespace App\Console\Commands;

use App\Models\FlowNodePackage;
use Illuminate\Console\Command;

/**
 * Put a fancy-flow node package into the marketplace registry.
 *
 * The registry had a read side (`/r/nodes/*`, the MCP tools, `fancy-cli add
 * node`) and no way to get anything into it — rows had to be hand-written, which
 * means the validator that decides what a valid manifest is was never actually
 * run against a real one.
 *
 * This is the write side for OUR packages. Third-party submissions are a
 * different problem with a different trust model (see `provenance`), and
 * deliberately not this command: anything landing here is marked `first-party`
 * and listed immediately, which is only correct for manifests we wrote.
 */
class RegisterFlowNode extends Command
{
    protected $signature = 'flow:register-node
        {manifest : Path to the package\'s fancy-flow.node.json}
        {--pending : Register it unlisted, for review before it goes public}
        {--verified : Mark it verified — a claim the registry makes, never the package}';

    protected $description = 'Register (or update) a first-party fancy-flow node package in the marketplace registry.';

    public function handle(): int
    {
        $path = (string) $this->argument('manifest');

        if (! is_file($path)) {
            $this->error("No manifest at {$path}");

            return self::FAILURE;
        }

        $manifest = json_decode((string) file_get_contents($path), true);
        if (! is_array($manifest)) {
            $this->error("{$path} is not valid JSON.");

            return self::FAILURE;
        }

        // Validated by the engine's own validator, not a second opinion. A
        // registry that disagrees with the runtime about what a valid manifest
        // is accepts packages the runtime then refuses.
        $check = FlowNodePackage::validateManifest($manifest);

        foreach ($check['problems'] as $problem) {
            $line = "  {$problem['field']}: {$problem['message']}";
            $problem['level'] === 'error' ? $this->error($line) : $this->comment($line);
        }

        if (! $check['ok']) {
            $this->error('Manifest rejected.');

            return self::FAILURE;
        }

        $attributes = FlowNodePackage::attributesFrom($manifest, FlowNodePackage::FIRST_PARTY);
        $attributes['status'] = $this->option('pending') ? FlowNodePackage::PENDING : FlowNodePackage::LISTED;
        $attributes['submitted_via'] = 'console';

        if ($this->option('verified')) {
            $attributes['verified'] = true;
            $attributes['verified_at'] = now();
        }

        // Keyed on kind: re-running after a release updates the manifest in
        // place rather than listing the same node twice.
        $package = FlowNodePackage::updateOrCreate(['kind' => $attributes['kind']], $attributes);

        $this->info(sprintf(
            '%s %s (%s) — runtimes: %s, status: %s',
            $package->wasRecentlyCreated ? 'Registered' : 'Updated',
            $package->kind,
            $package->title,
            implode(', ', $package->runtimes ?? []),
            $package->status,
        ));
        $this->line("  manifest: /r/nodes/{$package->slug()}.json");

        return self::SUCCESS;
    }
}

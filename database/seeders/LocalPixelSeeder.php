<?php

namespace Database\Seeders;

use App\Models\Setting;
use FancyHeuristics\Models\HeuristicsSite;
use Illuminate\Database\Seeder;

/**
 * Local-only: plant a working Fancy Pixel tracker for the showcase's OWN site
 * (`fancy-ui-showcase`) so the dogfooded analytics work out of the box in dev —
 * both the human pixel collector AND the agent-activity sink, which read the
 * site_key + collect endpoint from this tracker snippet via App\Support\SelfSite.
 *
 * Without a tracker, `heuristicsSelf` is null and the agent sink no-ops, so
 * there's no way to exercise agent analytics locally. Seeding it here keeps it
 * present across `migrate:fresh --seed` / `composer run setup` resets.
 *
 * Idempotent. Refuses to run in production: there an admin pastes the real
 * snippet in Admin → Settings, and clobbering it would silently break tracking.
 *
 * Run directly:  php artisan db:seed --class=LocalPixelSeeder
 */
class LocalPixelSeeder extends Seeder
{
    public const SITE_KEY = 'fancy-ui-showcase';

    public function run(): void
    {
        if (app()->isProduction()) {
            throw new \RuntimeException('LocalPixelSeeder must never run in production.');
        }

        // The showcase's own site — visible + pre-verified so it surfaces in
        // /admin/heuristics and /analytics immediately.
        HeuristicsSite::firstOrCreate(
            ['site_key' => self::SITE_KEY],
            ['url' => config('app.url'), 'visible' => true, 'pixel_status' => 'verified', 'last_verified_at' => now()],
        );

        // The same snippet the showcase generates for any submitted site
        // (ShowcaseSubmissionController::snippetFor) — injected into the page via
        // the tracker view-composer, parsed back by SelfSite for the agent sink.
        $endpoint = secure_url('/heuristics');
        $snippet = sprintf(
            '<script src="https://unpkg.com/@particle-academy/fancy-pixel/dist/fancy-pixel.global.min.js" data-site="%s" data-style="badge" data-mode="floating" data-endpoint="%s"></script>',
            self::SITE_KEY,
            $endpoint,
        );
        Setting::put('tracker_code', $snippet);

        $this->command?->info('  ✓ Local Fancy Pixel tracker → site \''.self::SITE_KEY.'\' @ '.$endpoint);
    }
}

<?php

use App\Models\ShowcaseSubmission;
use FancyHeuristics\Models\HeuristicsEvent;
use FancyHeuristics\Models\HeuristicsPixelPing;
use FancyHeuristics\Models\HeuristicsSession;
use FancyHeuristics\Models\HeuristicsSite;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Move the heuristics sites that registering a REPO showcase project used to
 * create into a quarantine table.
 *
 * Until 2026-11-13 every showcase submission auto-registered a HeuristicsSite,
 * so a repo (verified by the static Fancified badge, which collects nothing)
 * became an "analytics site" labelled with its code host, e.g. "github.com",
 * and the twice-daily pixel poll fetched the repo page looking for a pixel.
 *
 * Only rows whose submission is not an analytics property AND that hold no
 * collected data at all (no events, sessions or pixel pings) are moved. A row
 * with data means a real collector reached it, so it is left alone and counted.
 * Nothing is deleted: down() moves every quarantined row back unchanged.
 */
return new class extends Migration
{
    private const QUARANTINE = 'heuristics_sites_quarantine';

    public function up(): void
    {
        if (! Schema::hasTable(self::QUARANTINE)) {
            Schema::create(self::QUARANTINE, function (Blueprint $table): void {
                $table->id();
                $table->unsignedBigInteger('original_id');
                $table->string('site_key')->unique();
                $table->string('url');
                $table->boolean('visible')->default(false);
                $table->string('pixel_status')->nullable();
                $table->timestamp('last_verified_at')->nullable();
                $table->timestamp('original_created_at')->nullable();
                $table->timestamp('original_updated_at')->nullable();
                $table->string('reason');
                $table->timestamp('quarantined_at');
            });
        }

        $candidates = ShowcaseSubmission::query()
            ->whereNotNull('site_key')
            ->get(['id', 'site_key', 'kind', 'url'])
            ->reject(fn (ShowcaseSubmission $s): bool => $s->isAnalyticsProperty())
            ->pluck('site_key')
            ->unique()
            ->values();

        $moved = 0;
        $keptWithData = 0;

        foreach ($candidates->chunk(200) as $keys) {
            $sites = HeuristicsSite::query()->whereIn('site_key', $keys->all())->get();

            foreach ($sites as $site) {
                $hasData = HeuristicsEvent::query()->where('site_key', $site->site_key)->exists()
                    || HeuristicsSession::query()->where('site_key', $site->site_key)->exists()
                    || HeuristicsPixelPing::query()->where('site_key', $site->site_key)->exists();

                if ($hasData) {
                    $keptWithData++;

                    continue;
                }

                DB::transaction(function () use ($site): void {
                    DB::table(self::QUARANTINE)->updateOrInsert(
                        ['site_key' => $site->site_key],
                        [
                            'original_id' => $site->id,
                            'url' => $site->url,
                            'visible' => (bool) $site->visible,
                            'pixel_status' => $site->pixel_status,
                            'last_verified_at' => $site->last_verified_at,
                            'original_created_at' => $site->created_at,
                            'original_updated_at' => $site->updated_at,
                            'reason' => 'showcase project is not an analytics property (repo or shared code host)',
                            'quarantined_at' => now(),
                        ],
                    );
                    $site->delete();
                });
                $moved++;
            }
        }

        $this->report("quarantined {$moved} repo heuristics site(s); kept {$keptWithData} with collected data");
    }

    public function down(): void
    {
        if (! Schema::hasTable(self::QUARANTINE)) {
            return;
        }

        $restored = 0;
        $sites = (new HeuristicsSite)->getTable();

        foreach (DB::table(self::QUARANTINE)->get() as $row) {
            if (DB::table($sites)->where('site_key', $row->site_key)->exists()) {
                continue;
            }

            // Rows are keyed by site_key everywhere; the auto id is not reused,
            // so a Postgres sequence is never pushed out of step.
            DB::table($sites)->insert([
                'site_key' => $row->site_key,
                'url' => $row->url,
                'visible' => $row->visible,
                'pixel_status' => $row->pixel_status,
                'last_verified_at' => $row->last_verified_at,
                'created_at' => $row->original_created_at,
                'updated_at' => $row->original_updated_at,
            ]);
            $restored++;
        }

        Schema::drop(self::QUARANTINE);

        $this->report("restored {$restored} repo heuristics site(s) from quarantine");
    }

    private function report(string $message): void
    {
        if (app()->runningInConsole() && ! app()->runningUnitTests()) {
            fwrite(STDOUT, "  {$message}\n");
        }
    }
};

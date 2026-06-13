<?php

use FancyHeuristics\Models\HeuristicsEvent;
use FancyHeuristics\Models\HeuristicsSession;
use FancyHeuristics\Services\SessionRollup;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\Schema;

/**
 * Backfill the heuristics_sessions rollup from the historical event stream.
 *
 * The package rolls a session row off each *live* collect batch, but events
 * ingested before that rollup existed (or replayed by the demo seeder) never
 * produced session rows — and the GA-parity dashboard reads sessions/bounce/
 * engagement exclusively from heuristics_sessions. The symptom: the Overview
 * KPIs counted 1 session while Top Pages (read off raw events) showed ~24.
 *
 * Deploys run `migrate`, not arbitrary console commands, so the existing
 * `heuristics:backfill-sessions` artisan command never ran in production. This
 * one-time data migration rebuilds the gaps so the count is correct on the next
 * deploy; new sessions continue to roll up live via EventCollector.
 *
 * Gap-only by design: sessions already rolled live keep their wire context
 * (referrer / utm / device), which historical events can't reconstruct.
 */
return new class extends Migration
{
    public function up(): void
    {
        // On a fresh install this can run before any events exist — nothing to do.
        if (! Schema::hasTable('heuristics_events') || ! Schema::hasTable('heuristics_sessions')) {
            return;
        }

        $rollup = new SessionRollup;

        // (site_key, session_id) pairs that already have a rolled row — skip them
        // so we never clobber live-captured acquisition context.
        $existing = HeuristicsSession::query()
            ->select('site_key', 'session_id')
            ->get()
            ->map(fn ($s) => $s->site_key.'|'.$s->session_id)
            ->flip();

        HeuristicsEvent::query()
            ->whereNotNull('session_id')
            ->where('session_id', '!=', '')
            ->select('site_key', 'session_id')
            ->distinct()
            ->orderBy('site_key')
            ->orderBy('session_id')
            ->chunk(500, function ($groups) use ($rollup, $existing): void {
                foreach ($groups as $group) {
                    if ($existing->has($group->site_key.'|'.$group->session_id)) {
                        continue;
                    }

                    $events = HeuristicsEvent::query()
                        ->where('site_key', $group->site_key)
                        ->where('session_id', $group->session_id)
                        ->orderBy('occurred_at')
                        ->get();

                    $rollup->rollUp($group->site_key, $group->session_id, $events);
                }
            });
    }

    public function down(): void
    {
        // Derived data — intentionally irreversible. The rows can always be
        // rebuilt with `php artisan heuristics:backfill-sessions --fresh`.
    }
};

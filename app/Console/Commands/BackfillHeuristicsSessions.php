<?php

namespace App\Console\Commands;

use FancyHeuristics\Models\HeuristicsEvent;
use FancyHeuristics\Models\HeuristicsSession;
use FancyHeuristics\Services\SessionRollup;
use Illuminate\Console\Command;

/**
 * Rebuild the heuristics_sessions rollup from the historical event stream.
 *
 * The package only rolls a session row off each live collect batch, so events
 * ingested before the rollup existed (or replayed by a seeder) leave the
 * sessions table empty — and the GA-parity dashboard reads exclusively from
 * that table. This command walks every (site_key, session_id) group in
 * heuristics_events, ordered by occurred_at, and feeds each group through the
 * package's own SessionRollup so the derived rows are byte-for-byte what a live
 * collect would have produced.
 *
 * Old events carry no wire context (referrer / utm / device), so those columns
 * stay null for backfilled sessions — the dashboard handles that gracefully.
 * Re-runnable: each group is rolled fresh, so a second run reproduces the same
 * rows rather than double-counting.
 */
class BackfillHeuristicsSessions extends Command
{
    protected $signature = 'heuristics:backfill-sessions
                            {--site= : Restrict the backfill to a single site_key}
                            {--fresh : Delete existing rolled session rows for the scope first}';

    protected $description = 'Rebuild heuristics_sessions rows from the historical heuristics_events stream.';

    public function handle(SessionRollup $rollup): int
    {
        $site = $this->option('site');

        if ($this->option('fresh')) {
            $deleted = HeuristicsSession::query()
                ->when($site, fn ($q) => $q->where('site_key', $site))
                ->delete();
            $this->info("Cleared {$deleted} existing session rows.");
        }

        // The distinct (site_key, session_id) pairs to rebuild. A null/empty
        // session_id can't form a session, so it's excluded up front.
        $groups = HeuristicsEvent::query()
            ->when($site, fn ($q) => $q->where('site_key', $site))
            ->whereNotNull('session_id')
            ->where('session_id', '!=', '')
            ->select('site_key', 'session_id')
            ->distinct()
            ->get();

        if ($groups->isEmpty()) {
            $this->warn('No event sessions to backfill.');

            return self::SUCCESS;
        }

        $bar = $this->output->createProgressBar($groups->count());
        $bar->start();

        $built = 0;

        foreach ($groups as $group) {
            $events = HeuristicsEvent::query()
                ->where('site_key', $group->site_key)
                ->where('session_id', $group->session_id)
                ->orderBy('occurred_at')
                ->get();

            // Drop any prior rolled row for this group so rebuilding is
            // idempotent — the rollup *accumulates* counts onto an existing row,
            // so without this a second run would double-count.
            HeuristicsSession::query()
                ->where('site_key', $group->site_key)
                ->where('session_id', $group->session_id)
                ->delete();

            // Roll the entire history of the session as a single batch — the
            // rollup folds them into one derived row exactly as a live collect
            // of the same events would.
            $session = $rollup->rollUp(
                $group->site_key,
                $group->session_id,
                $events,
            );

            if ($session !== null) {
                $built++;
            }

            $bar->advance();
        }

        $bar->finish();
        $this->newLine(2);
        $this->info("Backfilled {$built} session rows from ".$groups->count().' event groups.');

        return self::SUCCESS;
    }
}

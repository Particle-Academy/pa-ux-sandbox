<?php

namespace App\Console\Commands;

use App\Support\McpStats\McpRollup;
use Illuminate\Console\Command;
use Illuminate\Support\Carbon;

/**
 * Rebuilds the MCP dashboard's daily rollups from raw requests.
 *
 * Scheduled every few minutes (`mcp-stats.rollup.cron`); each run re-rolls
 * today plus `mcp-stats.rollup.lookback_days` before it. Re-rolling is
 * idempotent, so a wider `--days` backfill is always safe.
 */
class McpStatsRollup extends Command
{
    protected $signature = 'mcp-stats:rollup
        {--date= : Roll exactly this day (YYYY-MM-DD)}
        {--days= : Roll this many days ending today (default: today plus the configured lookback)}';

    protected $description = 'Roll raw MCP requests up into the daily tables the admin dashboard reads';

    public function handle(McpRollup $rollup): int
    {
        $days = $this->days();
        if ($days === null) {
            return self::FAILURE;
        }

        foreach ($days as $day) {
            $result = $rollup->rollDay($day);
            $this->line(sprintf(
                '%s: %d requests -> %d rollups, %d clients, %d argument values',
                $day->toDateString(),
                $result['requests'],
                $result['rollups'],
                $result['clients'],
                $result['values'],
            ));
        }

        return self::SUCCESS;
    }

    /** @return list<Carbon>|null */
    private function days(): ?array
    {
        $date = $this->option('date');
        if (is_string($date) && $date !== '') {
            $parsed = Carbon::createFromFormat('Y-m-d', $date);
            if ($parsed === false || $parsed->format('Y-m-d') !== $date) {
                $this->error("Not a date: {$date} (expected YYYY-MM-DD).");

                return null;
            }

            return [$parsed->startOfDay()];
        }

        $count = $this->option('days');
        $count = is_numeric($count) ? (int) $count : (int) config('mcp-stats.rollup.lookback_days', 1) + 1;
        $count = max(1, min($count, (int) config('mcp-stats.retention_days', 400)));

        $days = [];
        for ($i = $count - 1; $i >= 0; $i--) {
            $days[] = now()->startOfDay()->subDays($i);
        }

        return $days;
    }
}

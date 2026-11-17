<?php

namespace App\Console\Commands;

use App\Models\McpDailyArgValue;
use App\Models\McpDailyClient;
use App\Models\McpDailyRollup;
use App\Models\McpRequest;
use App\Models\McpSession;
use Illuminate\Console\Command;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;

/**
 * Deletes MCP usage data older than `mcp-stats.retention_days`: raw
 * requests, sessions last seen before the cutoff, and every daily rollup.
 * Deletes in chunks of `mcp-stats.prune_chunk` so no statement holds a long
 * lock on a busy table.
 */
class McpStatsPrune extends Command
{
    protected $signature = 'mcp-stats:prune';

    protected $description = 'Delete MCP usage analytics older than the configured retention window';

    public function handle(): int
    {
        $days = max(1, (int) config('mcp-stats.retention_days', 400));
        $cutoff = now()->startOfDay()->subDays($days);
        $cutoffDay = $cutoff->toDateString();

        $counts = [
            'requests' => $this->prune(McpRequest::query()->where('day', '<', $cutoffDay)),
            'sessions' => $this->prune(McpSession::query()->where('last_seen_at', '<', $cutoff)),
            'rollups' => $this->prune(McpDailyRollup::query()->where('day', '<', $cutoffDay)),
            'clients' => $this->prune(McpDailyClient::query()->where('day', '<', $cutoffDay)),
            'values' => $this->prune(McpDailyArgValue::query()->where('day', '<', $cutoffDay)),
        ];

        $this->line("Pruned MCP stats older than {$cutoffDay} ({$days} days): ".collect($counts)
            ->map(fn (int $n, string $what): string => "{$n} {$what}")
            ->implode(', '));

        return self::SUCCESS;
    }

    /** @param  Builder<Model>  $query */
    private function prune(Builder $query): int
    {
        $chunk = max(100, (int) config('mcp-stats.prune_chunk', 5000));
        $total = 0;

        do {
            $ids = (clone $query)->orderBy('id')->limit($chunk)->pluck('id');
            if ($ids->isEmpty()) {
                break;
            }
            $total += $query->getModel()->newQuery()->whereIn('id', $ids)->delete();
        } while ($ids->count() === $chunk);

        return $total;
    }
}

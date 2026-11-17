<?php

namespace App\Support\McpStats;

use App\Models\McpDailyArgValue;
use App\Models\McpDailyClient;
use App\Models\McpDailyRollup;
use App\Models\McpRequest;
use App\Models\McpSession;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

/**
 * Rebuilds one day of the dashboard's pre-rolled tables from raw requests.
 *
 * Idempotent: a day's rollup rows are replaced wholesale in one transaction,
 * so re-rolling a day (the scheduler re-rolls today and yesterday every few
 * minutes) can never double-count. One pass over the day's raw rows feeds all
 * three tables.
 */
class McpRollup
{
    /**
     * @return array{requests: int, rollups: int, clients: int, values: int}
     */
    public function rollDay(Carbon $day): array
    {
        $date = $day->toDateString();
        $this->backfillClients($date);

        $rollups = [];
        $clients = [];
        $values = [];
        $searchTools = (array) config('mcp-stats.search_tools', []);
        // 191 is the arg_value column's width.
        $maxValue = min(191, max(8, (int) config('mcp-stats.rollup.max_value_length', 120)));
        $total = 0;

        McpRequest::query()
            ->where('day', $date)
            ->select(['id', 'session_id', 'method', 'target', 'arguments', 'status', 'error_code', 'result_count', 'latency_ms', 'client_name', 'client_version'])
            ->chunkById(max(100, (int) config('mcp-stats.rollup.chunk', 2000)), function ($chunk) use (&$rollups, &$clients, &$values, &$total, $searchTools, $maxValue): void {
                foreach ($chunk as $request) {
                    $total++;
                    $isError = in_array($request->status, McpRequest::ERROR_STATUSES, true);
                    $isEmpty = $request->method === 'tools/call'
                        && $request->result_count === 0
                        && array_key_exists((string) $request->target, $searchTools);
                    $client = (string) $request->client_name;
                    $version = (string) $request->client_version;
                    $target = (string) $request->target;

                    $key = implode("\x1f", [$request->method, $target, $client, $version, $request->status, (int) $request->error_code]);
                    if (! isset($rollups[$key])) {
                        $rollups[$key] = [
                            'method' => $request->method,
                            'target' => $target,
                            'client_name' => $client,
                            'client_version' => $version,
                            'status' => $request->status,
                            'error_code' => (int) $request->error_code,
                            'requests' => 0,
                            'empty_results' => 0,
                            'latency_sum' => 0,
                            'latency_max' => 0,
                            'histogram' => LatencyHistogram::empty(),
                        ];
                    }
                    $rollups[$key]['requests']++;
                    $rollups[$key]['empty_results'] += $isEmpty ? 1 : 0;
                    $rollups[$key]['latency_sum'] += $request->latency_ms;
                    $rollups[$key]['latency_max'] = max($rollups[$key]['latency_max'], $request->latency_ms);
                    $rollups[$key]['histogram']->add($request->latency_ms);

                    $clientKey = $client."\x1f".$version;
                    $clients[$clientKey] ??= ['client_name' => $client, 'client_version' => $version, 'sessions' => [], 'requests' => 0, 'errors' => 0];
                    $clients[$clientKey]['requests']++;
                    $clients[$clientKey]['errors'] += $isError ? 1 : 0;
                    if ($request->session_id !== null) {
                        $clients[$clientKey]['sessions'][$request->session_id] = true;
                    }

                    if ($request->method !== 'tools/call' || $target === '' || $request->arguments === null) {
                        continue;
                    }

                    $arguments = json_decode($request->arguments, true);
                    if (! is_array($arguments) || array_is_list($arguments)) {
                        continue;
                    }

                    foreach ($arguments as $argKey => $argValue) {
                        $normalized = $this->normalize($argValue, $maxValue);
                        if ($normalized === null || str_starts_with((string) $argKey, '_')) {
                            continue;
                        }
                        $argKey = Str::limit((string) $argKey, 64, '');
                        $valueKey = $target."\x1f".$argKey."\x1f".$normalized;
                        $values[$valueKey] ??= ['target' => $target, 'arg_key' => $argKey, 'arg_value' => $normalized, 'calls' => 0, 'empty_results' => 0, 'errors' => 0];
                        $values[$valueKey]['calls']++;
                        $values[$valueKey]['empty_results'] += $isEmpty ? 1 : 0;
                        $values[$valueKey]['errors'] += $isError ? 1 : 0;
                    }
                }
            });

        $now = now();

        DB::transaction(function () use ($date, $rollups, $clients, $values, $now): void {
            McpDailyRollup::query()->where('day', $date)->delete();
            McpDailyClient::query()->where('day', $date)->delete();
            McpDailyArgValue::query()->where('day', $date)->delete();

            $rows = array_map(fn (array $r): array => [
                'day' => $date,
                'method' => $r['method'],
                'target' => $r['target'],
                'client_name' => $r['client_name'],
                'client_version' => $r['client_version'],
                'status' => $r['status'],
                'error_code' => $r['error_code'],
                'requests' => $r['requests'],
                'empty_results' => $r['empty_results'],
                'latency_sum' => $r['latency_sum'],
                'latency_max' => $r['latency_max'],
                'latency_histogram' => json_encode($r['histogram']->toArray()),
                'rolled_at' => $now,
            ], array_values($rollups));
            foreach (array_chunk($rows, 500) as $batch) {
                McpDailyRollup::query()->insert($batch);
            }

            $rows = array_map(fn (array $c): array => [
                'day' => $date,
                'client_name' => $c['client_name'],
                'client_version' => $c['client_version'],
                'sessions' => count($c['sessions']),
                'requests' => $c['requests'],
                'errors' => $c['errors'],
            ], array_values($clients));
            foreach (array_chunk($rows, 500) as $batch) {
                McpDailyClient::query()->insert($batch);
            }

            $rows = array_map(fn (array $v): array => ['day' => $date] + $v, array_values($values));
            foreach (array_chunk($rows, 500) as $batch) {
                McpDailyArgValue::query()->insert($batch);
            }
        });

        return ['requests' => $total, 'rollups' => count($rollups), 'clients' => count($clients), 'values' => count($values)];
    }

    /**
     * Stamp the session's client onto requests recorded before the session's
     * `initialize` was (a client that does not wait for the reply).
     */
    private function backfillClients(string $date): void
    {
        $sessionIds = McpRequest::query()
            ->where('day', $date)
            ->whereNull('client_name')
            ->whereNotNull('session_id')
            ->distinct()
            ->pluck('session_id');

        if ($sessionIds->isEmpty()) {
            return;
        }

        McpSession::query()
            ->whereIn('session_id', $sessionIds)
            ->whereNotNull('client_name')
            ->get(['session_id', 'client_name', 'client_version'])
            ->each(function (McpSession $session) use ($date): void {
                McpRequest::query()
                    ->where('day', $date)
                    ->where('session_id', $session->session_id)
                    ->whereNull('client_name')
                    ->update(['client_name' => $session->client_name, 'client_version' => $session->client_version]);
            });
    }

    /** A scalar argument, lower-cased, trimmed and clipped; null for anything else. */
    private function normalize(mixed $value, int $maxLength): ?string
    {
        if (is_bool($value)) {
            return $value ? 'true' : 'false';
        }

        if (is_int($value) || is_float($value)) {
            return (string) $value;
        }

        if (! is_string($value)) {
            return null;
        }

        $value = Str::lower(trim(preg_replace('~\s+~u', ' ', $value) ?? $value));

        return $value === '' ? null : Str::limit($value, $maxLength, '');
    }
}

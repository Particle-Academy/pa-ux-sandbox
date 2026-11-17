<?php

namespace App\Support\McpStats;

use App\Models\McpDailyArgValue;
use App\Models\McpDailyClient;
use App\Models\McpDailyRollup;
use App\Models\McpRequest;
use App\Models\McpSession;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Carbon;
use Illuminate\Support\Collection;

/**
 * Every number on /admin/mcp. Aggregates come from the daily rollup tables
 * (see McpRollup); only the drill-downs to individual calls and one
 * session's timeline read raw `mcp_requests`, and those are bounded.
 *
 * Latency percentiles are estimates read from merged histograms.
 */
class McpStatsReport
{
    /** Shown for a client that never sent clientInfo; also its URL key. */
    public const UNKNOWN_CLIENT = '-';

    /** @var array{requests: int, rollups: list<array<string, mixed>>, clients: list<array<string, mixed>>, values: list<array<string, mixed>>}|null */
    private ?array $today = null;

    public function __construct(private readonly McpRollup $rollup) {}

    /** @return array<string, mixed> */
    public function overview(StatsRange $range): array
    {
        $rows = $this->rollupRows($range);
        $clients = $this->clientRows($range);
        $histogram = $this->histogram($rows);

        $requests = (int) $rows->sum('requests');
        $errors = (int) $rows->filter(fn (McpDailyRollup $r): bool => $this->isError($r->status))->sum('requests');

        $tools = $rows->where('method', 'tools/call')->groupBy('target')
            ->map(fn (Collection $group, int|string $tool): array => $this->toolRow((string) $tool, $group))
            ->values()
            ->sort(fn (array $a, array $b): int => [$b['calls'], $a['tool']] <=> [$a['calls'], $b['tool']])
            ->take($this->top())
            ->values()
            ->all();

        $topClients = $clients->groupBy(fn (McpDailyClient $c): string => $c->client_name."\x1f".$c->client_version)
            ->map(fn (Collection $group): array => [
                'name' => $this->clientLabel($group->first()->client_name),
                'key' => $this->clientKey($group->first()->client_name),
                'version' => $group->first()->client_version,
                'sessions' => (int) $group->sum('sessions'),
                'requests' => (int) $group->sum('requests'),
                'errors' => (int) $group->sum('errors'),
            ])
            ->values()
            ->sort(fn (array $a, array $b): int => [$b['requests'], $a['name']] <=> [$a['requests'], $b['name']])
            ->take($this->top())
            ->values()
            ->all();

        $methods = $rows->groupBy('method')
            ->map(fn (Collection $group, int|string $method): array => ['method' => (string) $method, 'requests' => (int) $group->sum('requests')])
            ->sortByDesc('requests')
            ->values()
            ->all();

        return [
            'totals' => [
                'requests' => $requests,
                'errors' => $errors,
                'errorRate' => $this->rate($errors, $requests),
                'sessions' => $this->sessionsIn($range)->count(),
                'clients' => $clients->pluck('client_name')->filter(fn (string $n): bool => $n !== '')->unique()->count(),
                'toolCalls' => (int) $rows->where('method', 'tools/call')->sum('requests'),
                'p50' => $histogram->percentile(50, $this->ceiling($rows)),
                'p95' => $histogram->percentile(95, $this->ceiling($rows)),
            ],
            'series' => $this->series($range, $rows, $clients),
            'topTools' => $tools,
            'topClients' => $topClients,
            'methods' => $methods,
            'recentSessions' => $this->sessionRows($this->sessionsIn($range)),
            'rolledAt' => $this->rolledAt(),
        ];
    }

    /** @return array<string, mixed> */
    public function tool(StatsRange $range, string $tool): array
    {
        $rows = $this->rollupRows($range, ['method' => 'tools/call', 'target' => $tool]);
        $histogram = $this->histogram($rows);
        $calls = (int) $rows->sum('requests');
        $errors = (int) $rows->filter(fn (McpDailyRollup $r): bool => $this->isError($r->status))->sum('requests');

        $values = $this->sumValues($this->argValueRows($range, null, $tool), ['arg_key', 'arg_value']);

        $argValues = $values->groupBy('arg_key')
            ->map(fn (Collection $group, int|string $key): array => [
                'key' => (string) $key,
                'calls' => (int) $group->sum('calls'),
                'distinct' => $group->count(),
                'values' => $group
                    ->sort(fn ($a, $b): int => [(int) $b->calls, $a->arg_value] <=> [(int) $a->calls, $b->arg_value])
                    ->take((int) config('mcp-stats.dashboard.top_values', 15))
                    ->map(fn ($v): array => [
                        'value' => $v->arg_value,
                        'calls' => (int) $v->calls,
                        'empty' => (int) $v->empty,
                        'errors' => (int) $v->errors,
                        'lastDay' => (string) $v->last_day,
                    ])
                    ->values()
                    ->all(),
            ])
            ->sort(fn (array $a, array $b): int => [$b['calls'], $a['key']] <=> [$a['calls'], $b['key']])
            ->values()
            ->all();

        $series = [];
        $byDay = $rows->groupBy('day');
        foreach ($range->dayList() as $day) {
            $group = $byDay->get($day, collect());
            $series[] = [
                'date' => $day,
                'calls' => (int) $group->sum('requests'),
                'errors' => (int) $group->filter(fn (McpDailyRollup $r): bool => $this->isError($r->status))->sum('requests'),
                'empty' => (int) $group->sum('empty_results'),
            ];
        }

        return [
            'tool' => $tool,
            'totals' => [
                'calls' => $calls,
                'errors' => $errors,
                'errorRate' => $this->rate($errors, $calls),
                'empty' => (int) $rows->sum('empty_results'),
                'avgLatency' => $calls > 0 ? round($rows->sum('latency_sum') / $calls, 1) : null,
            ],
            'series' => $series,
            'latency' => [
                'p50' => $histogram->percentile(50, $this->ceiling($rows)),
                'p95' => $histogram->percentile(95, $this->ceiling($rows)),
                'p99' => $histogram->percentile(99, $this->ceiling($rows)),
                'max' => $rows->max('latency_max'),
                'buckets' => $histogram->buckets(),
            ],
            'argValues' => $argValues,
            'errorGroups' => $this->errorGroups($rows),
            'recentErrors' => $this->callRows(
                $this->rawInRange($range)->where('target', $tool)->whereIn('status', McpRequest::ERROR_STATUSES)
                    ->orderByDesc('created_at')->orderByDesc('id')->limit(20)->get()
            ),
            'clients' => $rows->groupBy(fn (McpDailyRollup $r): string => $r->client_name."\x1f".$r->client_version)
                ->map(fn (Collection $group): array => [
                    'name' => $this->clientLabel($group->first()->client_name),
                    'key' => $this->clientKey($group->first()->client_name),
                    'version' => $group->first()->client_version,
                    'calls' => (int) $group->sum('requests'),
                    'errors' => (int) $group->filter(fn (McpDailyRollup $r): bool => $this->isError($r->status))->sum('requests'),
                ])
                ->sortByDesc('calls')
                ->values()
                ->all(),
        ];
    }

    /** @return array<string, mixed> */
    public function client(StatsRange $range, string $key, ?string $version): array
    {
        $name = $this->clientName($key);
        $rows = $this->rollupRows($range, ['client_name' => $name] + ($version !== null ? ['client_version' => $version] : []));
        $requests = (int) $rows->sum('requests');
        $errors = (int) $rows->filter(fn (McpDailyRollup $r): bool => $this->isError($r->status))->sum('requests');

        $sessions = $this->sessionsIn($range)->where(fn (Builder $q) => $name === '' ? $q->whereNull('client_name')->orWhere('client_name', '') : $q->where('client_name', $name));
        if ($version !== null) {
            $sessions->where('client_version', $version);
        }

        $series = [];
        $byDay = $rows->groupBy('day');
        foreach ($range->dayList() as $day) {
            $group = $byDay->get($day, collect());
            $series[] = [
                'date' => $day,
                'requests' => (int) $group->sum('requests'),
                'errors' => (int) $group->filter(fn (McpDailyRollup $r): bool => $this->isError($r->status))->sum('requests'),
            ];
        }

        return [
            'client' => ['name' => $this->clientLabel($name), 'key' => $key, 'version' => $version],
            'totals' => [
                'requests' => $requests,
                'errors' => $errors,
                'errorRate' => $this->rate($errors, $requests),
                'sessions' => (clone $sessions)->count(),
                'toolCalls' => (int) $rows->where('method', 'tools/call')->sum('requests'),
            ],
            'versions' => $this->clientRows($range, ['client_name' => $name])
                ->groupBy('client_version')
                ->map(fn (Collection $group, int|string $version): array => [
                    'version' => (string) $version,
                    'sessions' => (int) $group->sum('sessions'),
                    'requests' => (int) $group->sum('requests'),
                    'errors' => (int) $group->sum('errors'),
                ])
                ->sortByDesc('requests')
                ->values()
                ->all(),
            'series' => $series,
            'toolMix' => $rows->where('method', 'tools/call')->groupBy('target')
                ->map(fn (Collection $group, int|string $tool): array => $this->toolRow((string) $tool, $group))
                ->sortByDesc('calls')
                ->values()
                ->all(),
            'errors' => $this->errorGroups($rows, withTarget: true),
            'sessions' => $this->sessionRows($sessions),
        ];
    }

    /** @return array<string, mixed> */
    public function session(McpSession $session): array
    {
        $requests = McpRequest::query()
            ->where('session_id', $session->session_id)
            ->orderBy('created_at')
            ->orderBy('id')
            ->limit(max(1, (int) config('mcp-stats.dashboard.timeline_limit', 1000)))
            ->get();

        $first = $requests->first()?->created_at;

        return [
            'session' => $this->sessionRow($session),
            'requests' => $requests->map(fn (McpRequest $r): array => $this->callRow($r) + [
                'offset_ms' => $first !== null ? (int) $first->diffInMilliseconds($r->created_at) : 0,
            ])->all(),
            'truncated' => $session->request_count > $requests->count(),
        ];
    }

    /** @return array<string, mixed> */
    public function errors(StatsRange $range): array
    {
        $rows = $this->rollupRows($range, ['status' => McpRequest::ERROR_STATUSES]);

        $series = [];
        $byDay = $rows->groupBy('day');
        foreach ($range->dayList() as $day) {
            $group = $byDay->get($day, collect());
            $series[] = [
                'date' => $day,
                'error' => (int) $group->where('status', 'error')->sum('requests'),
                'tool_error' => (int) $group->where('status', 'tool_error')->sum('requests'),
                'http_error' => (int) $group->where('status', 'http_error')->sum('requests'),
            ];
        }

        return [
            'total' => (int) $rows->sum('requests'),
            'groups' => $this->errorGroups($rows, withTarget: true),
            'series' => $series,
        ];
    }

    /**
     * @param  array{status?: string|null, code?: int|null, tool?: string|null, method?: string|null}  $filters
     */
    public function errorCalls(StatsRange $range, array $filters): LengthAwarePaginator
    {
        $query = $this->rawInRange($range)->whereIn('status', McpRequest::ERROR_STATUSES);

        if (! empty($filters['status'])) {
            $query->where('status', $filters['status']);
        }
        if (isset($filters['code'])) {
            $filters['code'] === 0 ? $query->whereNull('error_code') : $query->where('error_code', $filters['code']);
        }
        if (! empty($filters['tool'])) {
            $query->where('target', $filters['tool']);
        }
        if (! empty($filters['method'])) {
            $query->where('method', $filters['method']);
        }

        return $query->orderByDesc('created_at')->orderByDesc('id')
            ->paginate(max(1, (int) config('mcp-stats.dashboard.per_page', 50)))
            ->withQueryString()
            ->through(fn (McpRequest $r): array => $this->callRow($r));
    }

    /** @return array<string, mixed> */
    public function searchDemand(StatsRange $range): array
    {
        $limit = max(1, (int) config('mcp-stats.dashboard.demand', 100));

        $demand = function (array $toolArgs, string $missColumn) use ($range, $limit): array {
            return $this->sumValues($this->argValueRows($range, $toolArgs), ['target', 'arg_value'])
                ->filter(fn (object $row): bool => $row->{$missColumn} > 0)
                ->sort(fn (object $a, object $b): int => [$b->{$missColumn}, $a->arg_value] <=> [$a->{$missColumn}, $b->arg_value])
                ->take($limit)
                ->map(fn (object $row): array => [
                    'tool' => $row->target,
                    'value' => $row->arg_value,
                    'misses' => $row->{$missColumn},
                    'calls' => $row->calls,
                    'lastDay' => $row->last_day,
                ])
                ->values()
                ->all();
        };

        return [
            'emptySearches' => $demand((array) config('mcp-stats.search_tools', []), 'empty'),
            'missingLookups' => $demand((array) config('mcp-stats.lookup_tools', []), 'errors'),
            'searchTools' => array_keys((array) config('mcp-stats.search_tools', [])),
            'lookupTools' => array_keys((array) config('mcp-stats.lookup_tools', [])),
        ];
    }

    public function clientName(string $key): string
    {
        return $key === self::UNKNOWN_CLIENT ? '' : $key;
    }

    /**
     * Argument-value rows summed over days, grouped by the given columns.
     *
     * @param  Collection<int, McpDailyArgValue>  $rows
     * @param  list<string>  $by
     * @return Collection<int, object{target: string, arg_key: string, arg_value: string, calls: int, empty: int, errors: int, last_day: string}>
     */
    private function sumValues(Collection $rows, array $by): Collection
    {
        return $rows
            ->groupBy(fn (McpDailyArgValue $v): string => implode("\x1f", array_map(fn (string $c): string => (string) $v->{$c}, $by)))
            ->map(fn (Collection $group): object => (object) [
                'target' => $group->first()->target,
                'arg_key' => $group->first()->arg_key,
                'arg_value' => $group->first()->arg_value,
                'calls' => (int) $group->sum('calls'),
                'empty' => (int) $group->sum('empty_results'),
                'errors' => (int) $group->sum('errors'),
                'last_day' => (string) $group->max('day'),
            ])
            ->values();
    }

    /**
     * Rollup rows for the range, filtered by exact column values (a list
     * means "in"). Days before today come from `mcp_daily_rollups`; TODAY is
     * aggregated from raw rows on the spot, so the dashboard is current
     * before the scheduled rollup runs and never counts today twice.
     *
     * @param  array<string, string|int|list<string>>  $where
     * @return Collection<int, McpDailyRollup>
     */
    private function rollupRows(StatsRange $range, array $where = []): Collection
    {
        return $this->merged($range, McpDailyRollup::query(), 'rollups', McpDailyRollup::class, $where);
    }

    /**
     * @param  array<string, string|int|list<string>>  $where
     * @return Collection<int, McpDailyClient>
     */
    private function clientRows(StatsRange $range, array $where = []): Collection
    {
        return $this->merged($range, McpDailyClient::query(), 'clients', McpDailyClient::class, $where);
    }

    /**
     * Argument-value rows for the range, restricted to these (tool, argument)
     * pairs, or to one tool's every argument.
     *
     * @param  array<string, string>|null  $toolArgs  tool => argument, or null for $tool's every argument
     * @return Collection<int, McpDailyArgValue>
     */
    private function argValueRows(StatsRange $range, ?array $toolArgs, ?string $tool = null): Collection
    {
        $matches = fn (string $target, string $key): bool => $toolArgs === null
            ? $target === $tool
            : ($toolArgs[$target] ?? null) === $key;

        $query = McpDailyArgValue::query();
        if ($toolArgs === null) {
            $query->where('target', $tool);
        } else {
            $query->where(function (Builder $q) use ($toolArgs): void {
                $q->whereRaw('1 = 0');
                foreach ($toolArgs as $name => $arg) {
                    $q->orWhere(fn (Builder $w) => $w->where('target', $name)->where('arg_key', $arg));
                }
            });
        }

        return $this->merged($range, $query, 'values', McpDailyArgValue::class, [])
            ->filter(fn (McpDailyArgValue $v): bool => $matches($v->target, $v->arg_key))
            ->values();
    }

    /**
     * @template TModel of \Illuminate\Database\Eloquent\Model
     *
     * @param  Builder<TModel>  $query
     * @param  class-string<TModel>  $model
     * @param  array<string, string|int|list<string>>  $where
     * @return Collection<int, TModel>
     */
    private function merged(StatsRange $range, Builder $query, string $part, string $model, array $where): Collection
    {
        $today = now()->toDateString();
        $includesToday = $range->fromDay() <= $today && $range->toDay() >= $today;
        $historyTo = $includesToday ? now()->subDay()->toDateString() : $range->toDay();

        foreach ($where as $column => $value) {
            is_array($value) ? $query->whereIn($column, $value) : $query->where($column, $value);
        }

        $rows = $range->fromDay() <= $historyTo
            ? $query->whereBetween('day', [$range->fromDay(), $historyTo])->get()
            : collect();

        if (! $includesToday) {
            return $rows;
        }

        $live = collect($this->today()[$part])
            ->filter(function (array $row) use ($where): bool {
                foreach ($where as $column => $value) {
                    if (is_array($value) ? ! in_array($row[$column], $value, true) : $row[$column] !== $value) {
                        return false;
                    }
                }

                return true;
            })
            ->map(fn (array $row) => (new $model)->forceFill($row));

        return $rows->concat($live)->values();
    }

    /**
     * Today's raw rows, aggregated once per request.
     *
     * @return array{requests: int, rollups: list<array<string, mixed>>, clients: list<array<string, mixed>>, values: list<array<string, mixed>>}
     */
    private function today(): array
    {
        return $this->today ??= $this->rollup->aggregate(now()->toDateString());
    }

    /** @return Builder<McpRequest> */
    private function rawInRange(StatsRange $range): Builder
    {
        return McpRequest::query()->whereBetween('day', [$range->fromDay(), $range->toDay()]);
    }

    /** Sessions active at any point in the range. @return Builder<McpSession> */
    private function sessionsIn(StatsRange $range): Builder
    {
        return McpSession::query()
            ->where('first_seen_at', '<', $range->to->copy()->addDay())
            ->where('last_seen_at', '>=', $range->from);
    }

    /**
     * @param  Collection<int, McpDailyRollup>  $rows
     * @param  Collection<int, McpDailyClient>  $clients
     * @return list<array<string, mixed>>
     */
    private function series(StatsRange $range, Collection $rows, Collection $clients): array
    {
        $rowsByDay = $rows->groupBy('day');
        $clientsByDay = $clients->groupBy('day');
        $series = [];

        foreach ($range->dayList() as $day) {
            $group = $rowsByDay->get($day, collect());
            $dayClients = $clientsByDay->get($day, collect());
            $requests = (int) $group->sum('requests');
            $errors = (int) $group->filter(fn (McpDailyRollup $r): bool => $this->isError($r->status))->sum('requests');

            $series[] = [
                'date' => $day,
                'requests' => $requests,
                'errors' => $errors,
                'errorRate' => $this->rate($errors, $requests),
                'sessions' => (int) $dayClients->sum('sessions'),
                'clients' => $dayClients->pluck('client_name')->filter(fn (string $n): bool => $n !== '')->unique()->count(),
            ];
        }

        return $series;
    }

    /**
     * @param  Collection<int, McpDailyRollup>  $group
     * @return array<string, mixed>
     */
    private function toolRow(string $tool, Collection $group): array
    {
        $calls = (int) $group->sum('requests');
        $errors = (int) $group->filter(fn (McpDailyRollup $r): bool => $this->isError($r->status))->sum('requests');
        $histogram = $this->histogram($group);

        return [
            'tool' => $tool,
            'calls' => $calls,
            'errors' => $errors,
            'errorRate' => $this->rate($errors, $calls),
            'empty' => (int) $group->sum('empty_results'),
            'avgLatency' => $calls > 0 ? round($group->sum('latency_sum') / $calls, 1) : null,
            'p95' => $histogram->percentile(95, $this->ceiling($group)),
        ];
    }

    /**
     * @param  Collection<int, McpDailyRollup>  $rows
     * @return list<array<string, mixed>>
     */
    private function errorGroups(Collection $rows, bool $withTarget = false): array
    {
        return $rows->filter(fn (McpDailyRollup $r): bool => $this->isError($r->status))
            ->groupBy(fn (McpDailyRollup $r): string => implode("\x1f", $withTarget ? [$r->status, $r->error_code, $r->method, $r->target] : [$r->status, $r->error_code]))
            ->map(function (Collection $group) use ($withTarget): array {
                $first = $group->first();

                return [
                    'status' => $first->status,
                    'code' => $first->error_code === 0 ? null : $first->error_code,
                    'method' => $withTarget ? $first->method : null,
                    'tool' => $withTarget && $first->target !== '' ? $first->target : null,
                    'count' => (int) $group->sum('requests'),
                    'clients' => $group->pluck('client_name')->unique()->count(),
                    'lastDay' => (string) $group->max('day'),
                ];
            })
            ->sortByDesc('count')
            ->values()
            ->all();
    }

    /** @param  Collection<int, McpDailyRollup>  $rows */
    private function histogram(Collection $rows): LatencyHistogram
    {
        $histogram = LatencyHistogram::empty();
        foreach ($rows as $row) {
            $histogram->merge($row->latency_histogram);
        }

        return $histogram;
    }

    /**
     * @param  Builder<McpSession>  $query
     * @return list<array<string, mixed>>
     */
    private function sessionRows(Builder $query): array
    {
        return $query->orderByDesc('last_seen_at')->orderByDesc('id')
            ->limit(max(1, (int) config('mcp-stats.dashboard.sessions', 25)))
            ->get()
            ->map(fn (McpSession $s): array => $this->sessionRow($s))
            ->all();
    }

    /** @return array<string, mixed> */
    private function sessionRow(McpSession $session): array
    {
        return [
            'session_id' => $session->session_id,
            'client_name' => $this->clientLabel($session->client_name),
            'client_key' => $this->clientKey($session->client_name),
            'client_version' => $session->client_version,
            'protocol_version' => $session->protocol_version,
            'ua_family' => $session->ua_family,
            'request_count' => $session->request_count,
            'error_count' => $session->error_count,
            'first_seen_at' => $session->first_seen_at?->toIso8601String(),
            'last_seen_at' => $session->last_seen_at?->toIso8601String(),
        ];
    }

    /**
     * @param  Collection<int, McpRequest>  $requests
     * @return list<array<string, mixed>>
     */
    private function callRows(Collection $requests): array
    {
        return $requests->map(fn (McpRequest $r): array => $this->callRow($r))->values()->all();
    }

    /** @return array<string, mixed> */
    public function callRow(McpRequest $r): array
    {
        $arguments = $r->arguments !== null ? json_decode($r->arguments, true) : null;

        return [
            'id' => $r->id,
            'at' => $r->created_at?->toIso8601String(),
            'session_id' => $r->session_id,
            'method' => $r->method,
            'target' => $r->target,
            'arguments' => is_array($arguments) ? $arguments : null,
            'arguments_truncated' => $r->arguments_truncated,
            'status' => $r->status,
            'error_code' => $r->error_code,
            'error_message' => $r->error_message,
            'result_count' => $r->result_count,
            'latency_ms' => $r->latency_ms,
            'client_name' => $this->clientLabel($r->client_name),
            'client_key' => $this->clientKey($r->client_name),
            'client_version' => $r->client_version,
        ];
    }

    private function rolledAt(): ?string
    {
        $at = McpDailyRollup::query()->max('rolled_at');

        return $at !== null ? Carbon::parse($at)->toIso8601String() : null;
    }

    /**
     * The slowest call in these rollups, so a percentile estimate never
     * claims something slower than anything that happened.
     *
     * @param  Collection<int, McpDailyRollup>  $rows
     */
    private function ceiling(Collection $rows): ?float
    {
        $max = $rows->max('latency_max');

        return $max !== null ? (float) $max : null;
    }

    private function isError(string $status): bool
    {
        return in_array($status, McpRequest::ERROR_STATUSES, true);
    }

    private function rate(int $part, int $whole): float
    {
        return $whole > 0 ? round($part / $whole, 4) : 0.0;
    }

    private function top(): int
    {
        return max(1, (int) config('mcp-stats.dashboard.top', 15));
    }

    private function clientLabel(?string $name): string
    {
        return $name === null || $name === '' ? '(unknown)' : $name;
    }

    private function clientKey(?string $name): string
    {
        return $name === null || $name === '' ? self::UNKNOWN_CLIENT : $name;
    }
}

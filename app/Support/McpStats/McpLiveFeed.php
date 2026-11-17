<?php

namespace App\Support\McpStats;

use App\Models\McpRequest;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

/**
 * The Live page's data: newest raw requests after a cursor, counters for the
 * last few minutes, and a clustered map of the last day. Reads `mcp_requests`
 * only, never the rollups, so it is as fresh as the last recorded request.
 *
 * Every query is bounded: rows by `mcp-stats.live.row_cap` and an id cursor,
 * counters and map by a time window on the indexed `created_at`.
 */
class McpLiveFeed
{
    public function __construct(private readonly McpStatsReport $report) {}

    /**
     * @return array<string, mixed>
     */
    public function feed(int $since, int $limit): array
    {
        $limit = max(1, min($limit, $this->rowCap()));

        $rows = McpRequest::query()
            ->when($since > 0, fn ($q) => $q->where('id', '>', $since))
            ->orderByDesc('id')
            ->limit($limit)
            ->get();

        $cursor = max($since, (int) ($rows->max('id') ?? 0));
        if ($since === 0 && $rows->isEmpty()) {
            $cursor = (int) (McpRequest::query()->max('id') ?? 0);
        }

        return [
            'cursor' => $cursor,
            'rows' => $rows->map(fn (McpRequest $r): array => $this->row($r))->values()->all(),
            'counters' => $this->counters(),
            ...$this->map(),
            'serverTime' => now()->toIso8601String(),
        ];
    }

    /**
     * One country's requests in the range.
     *
     * @return array<string, mixed>
     */
    public function country(StatsRange $range, string $code): array
    {
        $base = fn () => McpRequest::query()
            ->whereBetween('day', [$range->fromDay(), $range->toDay()])
            ->where('country', $code);

        /** @var LengthAwarePaginator $calls */
        $calls = $base()->orderByDesc('created_at')->orderByDesc('id')
            ->paginate(max(1, (int) config('mcp-stats.dashboard.per_page', 50)))
            ->withQueryString()
            ->through(fn (McpRequest $r): array => $this->row($r));

        return [
            'country' => ['code' => $code, 'name' => CountryCentroids::name($code), 'centroid' => CountryCentroids::for($code)],
            'total' => $base()->count(),
            'cities' => $base()
                ->selectRaw('city, COUNT(*) as requests, COUNT(DISTINCT session_id) as sessions')
                ->groupBy('city')
                ->orderByDesc('requests')
                ->limit(50)
                ->get()
                ->map(fn ($c): array => ['city' => $c->city, 'requests' => (int) $c->requests, 'sessions' => (int) $c->sessions])
                ->all(),
            'calls' => $calls,
        ];
    }

    /** @return array<string, mixed> */
    public function row(McpRequest $r): array
    {
        return $this->report->callRow($r) + [
            'country' => $r->country,
            'city' => $r->city,
            'ping' => $this->position($r->country, $r->latitude, $r->longitude),
        ];
    }

    public function rowCap(): int
    {
        return max(1, (int) config('mcp-stats.live.row_cap', 50));
    }

    /** @return array<string, mixed> */
    private function counters(): array
    {
        $minutes = max(1, (int) config('mcp-stats.live.window_minutes', 15));
        $window = fn () => McpRequest::query()->where('created_at', '>=', now()->subMinutes($minutes));

        return [
            'minutes' => $minutes,
            'requests' => $window()->count(),
            'sessions' => $window()->whereNotNull('session_id')->distinct()->count('session_id'),
            'errors' => $window()->whereIn('status', McpRequest::ERROR_STATUSES)->count(),
            'topTools' => $window()->where('method', 'tools/call')->whereNotNull('target')
                ->selectRaw('target, COUNT(*) as calls')
                ->groupBy('target')
                ->orderByDesc('calls')->orderBy('target')
                ->limit(5)
                ->get()
                ->map(fn ($t): array => ['tool' => (string) $t->target, 'calls' => (int) $t->calls])
                ->all(),
        ];
    }

    /**
     * The last `map_hours` of requests, clustered by place: one point per
     * (rounded) coordinate, country-only rows at their country's centroid.
     *
     * @return array{map: list<array<string, mixed>>, countries: list<array<string, mixed>>, located: int, unlocated: int, mapHours: int}
     */
    private function map(): array
    {
        $hours = max(1, (int) config('mcp-stats.live.map_hours', 24));
        $since = now()->subHours($hours);

        $places = McpRequest::query()
            ->where('created_at', '>=', $since)
            ->selectRaw('country, city, latitude, longitude, COUNT(*) as requests')
            ->groupBy('country', 'city', 'latitude', 'longitude')
            ->get();

        $located = 0;
        $unlocated = 0;
        /** @var array<string, array<string, mixed>> $clusters */
        $clusters = [];

        foreach ($places as $place) {
            $count = (int) $place->requests;
            $position = $this->position($place->country, $place->latitude !== null ? (float) $place->latitude : null, $place->longitude !== null ? (float) $place->longitude : null);
            if ($position === null) {
                $unlocated += $count;

                continue;
            }

            $located += $count;
            $key = $position['lat'].','.$position['lng'];
            if (! isset($clusters[$key])) {
                $clusters[$key] = [
                    'id' => 'c'.substr(md5($key), 0, 10),
                    'country' => $place->country,
                    'city' => $place->city,
                    'lat' => $position['lat'],
                    'lng' => $position['lng'],
                    'count' => 0,
                    'approximate' => $position['approximate'],
                ];
            } elseif ($clusters[$key]['city'] !== $place->city) {
                $clusters[$key]['city'] = null;
            }
            $clusters[$key]['count'] += $count;
        }

        $countries = McpRequest::query()
            ->where('created_at', '>=', $since)
            ->whereNotNull('country')
            ->selectRaw('country, COUNT(*) as requests, COUNT(DISTINCT session_id) as sessions')
            ->groupBy('country')
            ->orderByDesc('requests')
            ->get()
            ->map(fn ($c): array => [
                'country' => (string) $c->country,
                'name' => CountryCentroids::name((string) $c->country),
                'requests' => (int) $c->requests,
                'sessions' => (int) $c->sessions,
            ])
            ->all();

        return [
            'map' => collect($clusters)->sortByDesc('count')->take(max(1, (int) config('mcp-stats.live.map_limit', 500)))->values()->all(),
            'countries' => $countries,
            'located' => $located,
            'unlocated' => $unlocated,
            'mapHours' => $hours,
        ];
    }

    /** @return array{lat: float, lng: float, approximate: bool}|null */
    private function position(?string $country, ?float $lat, ?float $lng): ?array
    {
        if ($lat !== null && $lng !== null) {
            return ['lat' => round($lat, 1), 'lng' => round($lng, 1), 'approximate' => false];
        }

        $centroid = CountryCentroids::for($country);

        return $centroid === null ? null : $centroid + ['approximate' => true];
    }
}

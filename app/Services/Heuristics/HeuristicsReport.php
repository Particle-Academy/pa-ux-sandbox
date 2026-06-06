<?php

namespace App\Services\Heuristics;

use FancyHeuristics\Facades\Heuristics;
use FancyHeuristics\Models\HeuristicsEvent;

/**
 * Shared per-site analytics math over the live Fancy Heuristics event stream.
 *
 * The single source of truth for the KPI rollups, the focus-heatmap grid, top
 * paths, recent sessions, and the events-over-time series. Both the Pro
 * AnalyticsController (App\Http\Controllers\AnalyticsController) and the admin
 * AdminHeuristicsController consume this so the dashboard math never diverges —
 * the only difference between the two surfaces is who is allowed to see it.
 */
class HeuristicsReport
{
    /**
     * Headline KPI rollups for a site, computed from the raw event stream.
     *
     * @return array{
     *     pageviews: int,
     *     sessions: int,
     *     avgTimeOnPageMs: int,
     *     clickthrough: float,
     *     clicks: int,
     *     human: int,
     *     agent: int,
     *     totalEvents: int
     * }
     */
    public function kpis(string $site): array
    {
        $stats = Heuristics::sessionStats($site);
        $byKind = $stats['by_kind'] ?? [];
        $byActor = $stats['by_actor'] ?? [];

        $pageviews = (int) ($byKind['pageview'] ?? 0);
        $clicks = (int) ($byKind['click'] ?? 0);

        // Average time-on-page from dwell events' dwell_ms. Dwell events carry
        // the time a session lingered on a path before navigating away.
        $avgDwell = (int) round((float) (HeuristicsEvent::query()
            ->where('site_key', $site)
            ->where('kind', 'dwell')
            ->whereNotNull('dwell_ms')
            ->avg('dwell_ms') ?? 0));

        // Clickthrough = clicks per pageview. Guarded against divide-by-zero so
        // a site with clicks but no recorded pageviews reports 0 rather than ∞.
        $clickthrough = $pageviews > 0 ? round($clicks / $pageviews, 4) : 0.0;

        return [
            'pageviews' => $pageviews,
            'sessions' => (int) ($stats['sessions'] ?? 0),
            'avgTimeOnPageMs' => $avgDwell,
            'clickthrough' => $clickthrough,
            'clicks' => $clicks,
            'human' => (int) ($byActor['human'] ?? 0),
            'agent' => (int) ($byActor['agent'] ?? 0),
            'totalEvents' => (int) ($stats['events'] ?? 0),
        ];
    }

    /**
     * Top paths by event volume, with a pageview + click breakdown each.
     *
     * @return list<array{path: string, events: int, pageviews: int, clicks: int, sessions: int}>
     */
    public function topPaths(string $site, int $limit = 8): array
    {
        return HeuristicsEvent::query()
            ->where('site_key', $site)
            ->selectRaw('path')
            ->selectRaw('COUNT(*) as events')
            ->selectRaw("SUM(CASE WHEN kind = 'pageview' THEN 1 ELSE 0 END) as pageviews")
            ->selectRaw("SUM(CASE WHEN kind = 'click' THEN 1 ELSE 0 END) as clicks")
            ->selectRaw('COUNT(DISTINCT session_id) as sessions')
            ->groupBy('path')
            ->orderByDesc('events')
            ->limit($limit)
            ->get()
            ->map(fn ($row): array => [
                'path' => (string) $row->path,
                'events' => (int) $row->events,
                'pageviews' => (int) $row->pageviews,
                'clicks' => (int) $row->clicks,
                'sessions' => (int) $row->sessions,
            ])
            ->all();
    }

    /**
     * The real heatmap grid for the busiest path. "Busiest" = the path with the
     * most pointer/click events, since those are what the heatmap aggregates.
     * Returns the normalised grid straight from the facade so the frontend can
     * paint warm blobs positioned by each cell's grid coordinates + weight.
     *
     * @return array{
     *     site_key: string,
     *     path: string,
     *     grid_size: int,
     *     sample_count: int,
     *     max: int,
     *     cells: list<array{x:int, y:int, count:int, weight:float}>
     * }|null
     */
    public function heatmapForBusiestPath(string $site): ?array
    {
        $busiest = HeuristicsEvent::query()
            ->where('site_key', $site)
            ->whereIn('kind', ['pointer', 'click'])
            ->whereNotNull('x')
            ->whereNotNull('y')
            ->selectRaw('path, COUNT(*) as hits')
            ->groupBy('path')
            ->orderByDesc('hits')
            ->value('path');

        if ($busiest === null) {
            return null;
        }

        return Heuristics::heatmap($site, (string) $busiest);
    }

    /**
     * Most-recent sessions for the site, tagged human vs agent, with a terse
     * summary (event count, last path, last-seen timestamp).
     *
     * @return list<array{
     *     session_id: string,
     *     actor: string,
     *     events: int,
     *     last_path: string,
     *     last_seen: string
     * }>
     */
    public function recentSessions(string $site, int $limit = 10): array
    {
        // Find the most-recently-active sessions, then summarise each.
        $sessions = HeuristicsEvent::query()
            ->where('site_key', $site)
            ->whereNotNull('session_id')
            ->selectRaw('session_id')
            ->selectRaw('COUNT(*) as events')
            ->selectRaw('MAX(occurred_at) as last_seen')
            ->groupBy('session_id')
            ->orderByDesc('last_seen')
            ->limit($limit)
            ->get();

        return $sessions
            ->map(function ($row) use ($site): array {
                /** @var HeuristicsEvent|null $last */
                $last = HeuristicsEvent::query()
                    ->where('site_key', $site)
                    ->where('session_id', $row->session_id)
                    ->orderByDesc('occurred_at')
                    ->first(['actor', 'path', 'occurred_at']);

                return [
                    'session_id' => (string) $row->session_id,
                    'actor' => $last?->actor ?? 'human',
                    'events' => (int) $row->events,
                    'last_path' => $last?->path ?? '/',
                    'last_seen' => optional($last?->occurred_at)->toIso8601String() ?? (string) $row->last_seen,
                ];
            })
            ->all();
    }

    /**
     * Events per day for the trailing window, split human vs agent — feeds the
     * fancy-echarts time-series. Buckets by calendar day of `occurred_at`.
     *
     * @return list<array{date: string, human: int, agent: int}>
     */
    public function eventsOverTime(string $site, int $days = 14): array
    {
        $since = now()->subDays($days - 1)->startOfDay();

        $rows = HeuristicsEvent::query()
            ->where('site_key', $site)
            ->where('occurred_at', '>=', $since)
            ->selectRaw('DATE(occurred_at) as day')
            ->selectRaw("SUM(CASE WHEN actor = 'agent' THEN 1 ELSE 0 END) as agent")
            ->selectRaw("SUM(CASE WHEN actor != 'agent' THEN 1 ELSE 0 END) as human")
            ->groupByRaw('DATE(occurred_at)')
            ->get()
            ->keyBy('day');

        // Densify so every day in the window appears even with zero events.
        $series = [];
        for ($i = 0; $i < $days; $i++) {
            $date = $since->copy()->addDays($i)->toDateString();
            $row = $rows->get($date);
            $series[] = [
                'date' => $date,
                'human' => (int) ($row->human ?? 0),
                'agent' => (int) ($row->agent ?? 0),
            ];
        }

        return $series;
    }
}

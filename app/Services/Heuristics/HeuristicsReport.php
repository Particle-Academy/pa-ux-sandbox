<?php

namespace App\Services\Heuristics;

use App\Models\SitePageShot;
use FancyHeuristics\Facades\Heuristics;
use FancyHeuristics\Models\HeuristicsEvent;
use Illuminate\Support\Carbon;

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
     * Heatmap grid for a specific path — e.g. a site's registered homepage, so
     * the heat overlay aligns with the homepage screenshot. Same shape as
     * heatmapForBusiestPath; null when that path has no pointer data.
     *
     * @return array{site_key: string, path: string, grid_size: int, sample_count: int, max: int, cells: list<array{x:int, y:int, count:int, weight:float}>}|null
     */
    public function heatmapForPath(string $site, string $path): ?array
    {
        return Heuristics::heatmap($site, $path);
    }

    /**
     * The stored screenshot for a path on a site, shaped as the heatmap
     * background. Null when nothing has been captured yet (the frontend then
     * falls back to the wireframe). vw/vh are the capture viewport so the
     * frontend can reason about alignment if needed.
     *
     * @return array{url: string, vw: int, vh: int, capturedAt: string|null}|null
     */
    public function screenshotForPath(string $site, ?string $path): ?array
    {
        if ($path === null || $path === '') {
            return null;
        }

        $shot = SitePageShot::query()
            ->where('site_key', $site)
            ->where('path', $path)
            ->first();

        if ($shot === null) {
            return null;
        }

        return [
            'url' => $shot->url(),
            'vw' => (int) $shot->vw,
            'vh' => (int) $shot->vh,
            'capturedAt' => $shot->captured_at?->toIso8601String(),
        ];
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

    // =====================================================================
    // Phase C — GA-parity reports over the heuristics_sessions rollup.
    //
    // Every method below accepts the resolved $days window + an $actor filter
    // ('all' | 'human' | 'agent') and returns JSON-friendly Inertia props. The
    // Overview KPIs additionally compute a previous-equal-length period so each
    // metric carries a period-over-period delta. The human-vs-agent dimension —
    // the moat GA structurally can't have — is threaded through all of them.
    // =====================================================================

    /**
     * The valid window sizes the dashboard offers, in days.
     */
    public const RANGES = [7, 28, 90];

    /**
     * Normalise an actor filter to the facade's `?string $actor` contract:
     * 'all' (or anything unknown) → null, otherwise 'human' | 'agent'.
     */
    private function resolveActor(string $actor): ?string
    {
        return in_array($actor, ['human', 'agent'], true) ? $actor : null;
    }

    /**
     * Overview KPI strip with period-over-period deltas. Each metric reports
     * its current value plus the percentage change vs the previous equal-length
     * window (null when there's nothing to compare against). When $compare is
     * false the deltas are omitted (null) so the UI can hide them.
     *
     * @return array{
     *     range: int,
     *     actor: string,
     *     metrics: array<string, array{value: float, deltaPct: float|null, format: string}>,
     *     split: array{human: array<string, float>, agent: array<string, float>},
     *     total: int
     * }
     */
    public function overview(string $site, int $days, string $actor = 'all', bool $compare = true): array
    {
        $resolved = $this->resolveActor($actor);

        $current = Heuristics::sessionsSummary($site, $days, $resolved);

        // Previous equal-length window: [now-2N, now-N].
        $prevRange = $compare
            ? ['from' => Carbon::now()->subDays($days * 2)->startOfDay(), 'to' => Carbon::now()->subDays($days)]
            : null;
        $previous = $prevRange ? Heuristics::sessionsSummary($site, $prevRange, $resolved) : null;

        $metrics = [
            'sessions' => $this->metric($current['sessions'], $previous['sessions'] ?? null, 'int'),
            'pageviews' => $this->metric($current['pageviews'], $previous['pageviews'] ?? null, 'int'),
            'avgEngagementMs' => $this->metric($current['avg_duration_ms'], $previous['avg_duration_ms'] ?? null, 'duration'),
            'bounceRate' => $this->metric($current['bounce_rate'], $previous['bounce_rate'] ?? null, 'percent'),
            'pagesPerSession' => $this->metric($current['pages_per_session'], $previous['pages_per_session'] ?? null, 'decimal'),
        ];

        // Human vs agent split across the headline metrics (always all-actor —
        // the split IS the comparison, so it ignores the actor toggle).
        $human = Heuristics::sessionsSummary($site, $days, 'human');
        $agent = Heuristics::sessionsSummary($site, $days, 'agent');

        return [
            'range' => $days,
            'actor' => $actor,
            'metrics' => $metrics,
            'split' => [
                'human' => $this->splitRow($human),
                'agent' => $this->splitRow($agent),
            ],
            'total' => (int) $current['sessions'],
        ];
    }

    /**
     * Shape one KPI: the value, its percentage delta vs the prior period, and a
     * format hint the frontend uses to render it (int / decimal / percent /
     * duration). deltaPct is null when there's no comparison baseline.
     *
     * @return array{value: float, deltaPct: float|null, format: string}
     */
    private function metric(float|int $value, float|int|null $previous, string $format): array
    {
        $deltaPct = null;
        if ($previous !== null) {
            $deltaPct = $previous > 0
                ? round((($value - $previous) / $previous) * 100, 1)
                : ($value > 0 ? 100.0 : 0.0);
        }

        return [
            'value' => round((float) $value, 4),
            'deltaPct' => $deltaPct,
            'format' => $format,
        ];
    }

    /**
     * The headline figures for one actor, for the human-vs-agent split.
     *
     * @param  array<string, mixed>  $summary
     * @return array<string, float>
     */
    private function splitRow(array $summary): array
    {
        return [
            'sessions' => (float) $summary['sessions'],
            'pageviews' => (float) $summary['pageviews'],
            'avgEngagementMs' => (float) $summary['avg_duration_ms'],
            'bounceRate' => (float) $summary['bounce_rate'],
            'pagesPerSession' => (float) $summary['pages_per_session'],
        ];
    }

    /**
     * Sessions-over-time for the Overview area chart, the current window with
     * the previous equal-length window aligned offset-for-offset so the chart
     * can overlay them. Each point carries the bucket label, current sessions/
     * pageviews, and (when split) human/agent session counts; `prevSessions`
     * holds the comparison window's value at the same offset.
     *
     * @return array{
     *     buckets: list<string>,
     *     current: list<array{bucket: string, sessions: int, pageviews: int, human_sessions: int, agent_sessions: int}>,
     *     previous: list<int>
     * }
     */
    public function overviewTimeseries(string $site, int $days, bool $compare = true): array
    {
        $current = Heuristics::timeseries($site, $days, 'day', true);

        // Densify the current window so every day appears.
        $current = $this->densifyDaily($current, $days);

        $previous = [];
        if ($compare) {
            $prevRange = ['from' => Carbon::now()->subDays($days * 2)->startOfDay(), 'to' => Carbon::now()->subDays($days)];
            $prevRows = Heuristics::timeseries($site, $prevRange, 'day', false);
            $prevByBucket = collect($prevRows)->keyBy('bucket');

            // Align the previous window onto the current axis by ordinal offset.
            $prevStart = Carbon::now()->subDays($days * 2)->startOfDay();
            for ($i = 0; $i < $days; $i++) {
                $bucket = $prevStart->copy()->addDays($i)->toDateString();
                $previous[] = (int) ($prevByBucket->get($bucket)['sessions'] ?? 0);
            }
        }

        return [
            'buckets' => array_map(fn ($r) => $r['bucket'], $current),
            'current' => $current,
            'previous' => $previous,
        ];
    }

    /**
     * Fill in zero-rows for every calendar day in the trailing window so a
     * sparse facade timeseries renders as a continuous axis.
     *
     * @param  list<array{bucket: string, sessions: int, pageviews: int, human_sessions?: int, agent_sessions?: int}>  $rows
     * @return list<array{bucket: string, sessions: int, pageviews: int, human_sessions: int, agent_sessions: int}>
     */
    private function densifyDaily(array $rows, int $days): array
    {
        $byBucket = collect($rows)->keyBy('bucket');
        $start = Carbon::now()->subDays($days)->startOfDay();

        $out = [];
        for ($i = 0; $i <= $days; $i++) {
            $bucket = $start->copy()->addDays($i)->toDateString();
            $row = $byBucket->get($bucket);
            $out[] = [
                'bucket' => $bucket,
                'sessions' => (int) ($row['sessions'] ?? 0),
                'pageviews' => (int) ($row['pageviews'] ?? 0),
                'human_sessions' => (int) ($row['human_sessions'] ?? 0),
                'agent_sessions' => (int) ($row['agent_sessions'] ?? 0),
            ];
        }

        return $out;
    }

    /**
     * Acquisition section: referrer hosts, UTM source/medium/campaign, and the
     * direct vs referral split. Straight passthrough of the facade shape.
     *
     * @return array{
     *     referrer_hosts: list<array{host: string, sessions: int}>,
     *     utm_sources: list<array{value: string, sessions: int}>,
     *     utm_mediums: list<array{value: string, sessions: int}>,
     *     utm_campaigns: list<array{value: string, sessions: int}>,
     *     direct: int,
     *     referral: int,
     *     total: int
     * }
     */
    public function acquisition(string $site, int $days, string $actor = 'all'): array
    {
        return Heuristics::acquisition($site, $days, $this->resolveActor($actor));
    }

    /**
     * Audience / tech section: device, browser, os, language breakdowns.
     *
     * @return array{
     *     devices: list<array{value: string, sessions: int}>,
     *     browsers: list<array{value: string, sessions: int}>,
     *     os: list<array{value: string, sessions: int}>,
     *     languages: list<array{value: string, sessions: int}>,
     *     total: int
     * }
     */
    public function audience(string $site, int $days, string $actor = 'all'): array
    {
        return Heuristics::audience($site, $days, $this->resolveActor($actor));
    }

    /**
     * Behavior section: top pages, entry pages, exit pages, top clicked
     * elements — each scoped to the window + actor.
     *
     * @return array{
     *     topPages: list<array{path: string, pageviews: int, sessions: int}>,
     *     entryPages: list<array{path: string, sessions: int}>,
     *     exitPages: list<array{path: string, sessions: int}>,
     *     topElements: list<array{target_id: string, label: string|null, clicks: int}>
     * }
     */
    public function behavior(string $site, int $days, string $actor = 'all'): array
    {
        $resolved = $this->resolveActor($actor);

        return [
            'topPages' => Heuristics::topPages($site, $days, $resolved, 12),
            'entryPages' => Heuristics::entryPages($site, $days, $resolved, 8),
            'exitPages' => Heuristics::exitPages($site, $days, $resolved, 8),
            'topElements' => Heuristics::topElements($site, $days, $resolved, 12),
        ];
    }

    /**
     * Engagement / real-time section: sessions active in the last 5 minutes,
     * each tagged human vs agent with its current path.
     *
     * @return array{
     *     active: int,
     *     window_seconds: int,
     *     sessions: list<array{session_id: string, actor: string, path: string|null, last_event_at: string|null}>
     * }
     */
    public function realtime(string $site): array
    {
        return Heuristics::realtime($site);
    }

    /**
     * ★ Agent analytics — the moat. The human-vs-agent split across the headline
     * metrics, plus which elements + surfaces each actor drove. Frames the thing
     * GA structurally can't do: separating agent traffic from human traffic.
     *
     * @return array{
     *     totals: array{human: int, agent: int, agentPct: float},
     *     metrics: array{human: array<string, float>, agent: array<string, float>},
     *     humanElements: list<array{target_id: string, label: string|null, clicks: int}>,
     *     agentElements: list<array{target_id: string, label: string|null, clicks: int}>,
     *     humanPages: list<array{path: string, pageviews: int, sessions: int}>,
     *     agentPages: list<array{path: string, pageviews: int, sessions: int}>
     * }
     */
    public function agentAnalytics(string $site, int $days): array
    {
        $human = Heuristics::sessionsSummary($site, $days, 'human');
        $agent = Heuristics::sessionsSummary($site, $days, 'agent');

        $humanSessions = (int) $human['sessions'];
        $agentSessions = (int) $agent['sessions'];
        $totalSessions = $humanSessions + $agentSessions;

        return [
            'totals' => [
                'human' => $humanSessions,
                'agent' => $agentSessions,
                'agentPct' => $totalSessions > 0 ? round(($agentSessions / $totalSessions) * 100, 1) : 0.0,
            ],
            'metrics' => [
                'human' => $this->splitRow($human),
                'agent' => $this->splitRow($agent),
            ],
            'humanElements' => Heuristics::topElements($site, $days, 'human', 8),
            'agentElements' => Heuristics::topElements($site, $days, 'agent', 8),
            'humanPages' => Heuristics::topPages($site, $days, 'human', 8),
            'agentPages' => Heuristics::topPages($site, $days, 'agent', 8),
        ];
    }
}

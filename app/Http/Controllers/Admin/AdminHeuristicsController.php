<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\ShowcaseSubmission;
use App\Services\Heuristics\HeuristicsReport;
use FancyHeuristics\Models\HeuristicsEvent;
use FancyHeuristics\Models\HeuristicsPixelPing;
use FancyHeuristics\Models\HeuristicsSite;
use FancyHeuristics\Services\PixelVerifier;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Carbon;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Admin surface over the Fancy Heuristics data — the platform-wide companion to
 * the Pro per-user AnalyticsController. Where the Pro dashboard is gated to a
 * single dogfooded site, this surface lists every registered site and lets an
 * admin drill into any of them.
 *
 * The per-site KPI / heatmap / paths / sessions / trend math is shared with the
 * Pro dashboard via App\Services\Heuristics\HeuristicsReport — the two surfaces
 * compute identical numbers; only the authorization around them differs.
 */
class AdminHeuristicsController extends Controller
{
    /**
     * Platform-wide overview: cross-site rollups + a table of every registered
     * site with its verification status and activity counts.
     */
    public function index(): Response
    {
        return Inertia::render('Admin/Heuristics/Index', [
            'rollups' => $this->rollups(),
            'sites' => $this->siteRows(),
            'pending' => $this->pendingSubmissions(),
        ]);
    }

    /**
     * Full per-site analytics for ANY registered site — the same KPIs, focus
     * heatmap, events-over-time, top paths, and recent sessions as the Pro
     * dashboard, with no Pro gate.
     */
    public function show(HeuristicsSite $site, HeuristicsReport $report): Response
    {
        $key = $site->site_key;

        return Inertia::render('Admin/Heuristics/Show', [
            'site' => [
                'site_key' => $key,
                'url' => $site->url,
                'visible' => (bool) $site->visible,
                'pixel_status' => $site->pixel_status,
                'last_verified_at' => $site->last_verified_at?->toIso8601String(),
                'last_verified_human' => $site->last_verified_at?->diffForHumans(),
            ],
            'kpis' => $report->kpis($key),
            'topPaths' => $report->topPaths($key),
            'heatmap' => $report->heatmapForBusiestPath($key),
            'recentSessions' => $report->recentSessions($key),
            'eventsOverTime' => $report->eventsOverTime($key),
            'pixelPings' => $this->recentPings($key),
            'pending' => $this->pendingSubmissions(),
        ]);
    }

    /**
     * Re-poll a single site's pixel right now (the on-demand equivalent of the
     * scheduled `heuristics:verify-pixels --site={key}` command), then redirect
     * back with the result.
     */
    public function verify(HeuristicsSite $site, PixelVerifier $verifier): RedirectResponse
    {
        $passed = $verifier->verify($site);

        $message = $passed
            ? "Pixel verified for {$site->site_key} — site is visible."
            : "Pixel verification failed for {$site->site_key}: {$site->fresh()?->pixel_status}.";

        return back()->with('success', $message);
    }

    /**
     * Cross-site rollups for the overview header. Counts span every site rather
     * than a single dogfooded key.
     *
     * @return array{
     *     totalEvents: int,
     *     sites: int,
     *     visibleSites: int,
     *     sessions: int,
     *     human: int,
     *     agent: int,
     *     pixelPings: int
     * }
     */
    private function rollups(): array
    {
        $byActor = HeuristicsEvent::query()
            ->selectRaw('actor, COUNT(*) as aggregate')
            ->groupBy('actor')
            ->pluck('aggregate', 'actor');

        return [
            'totalEvents' => (int) HeuristicsEvent::query()->count(),
            'sites' => (int) HeuristicsSite::query()->count(),
            'visibleSites' => (int) HeuristicsSite::query()->where('visible', true)->count(),
            'sessions' => (int) HeuristicsEvent::query()
                ->whereNotNull('session_id')
                ->distinct()
                ->count('session_id'),
            'human' => (int) ($byActor['human'] ?? 0),
            'agent' => (int) ($byActor['agent'] ?? 0),
            'pixelPings' => (int) HeuristicsPixelPing::query()->count(),
        ];
    }

    /**
     * Every registered site with its verification + visibility status and a
     * terse activity summary (event + session counts, last-seen).
     *
     * @return list<array{
     *     site_key: string,
     *     url: string|null,
     *     visible: bool,
     *     pixel_status: string|null,
     *     last_verified_at: string|null,
     *     events: int,
     *     sessions: int,
     *     last_activity: string|null
     * }>
     */
    private function siteRows(): array
    {
        // Pre-aggregate per-site event + session counts in two grouped queries
        // so the table renders without an N+1 over the site list.
        $eventCounts = HeuristicsEvent::query()
            ->selectRaw('site_key')
            ->selectRaw('COUNT(*) as events')
            ->selectRaw('COUNT(DISTINCT session_id) as sessions')
            ->selectRaw('MAX(occurred_at) as last_activity')
            ->groupBy('site_key')
            ->get()
            ->keyBy('site_key');

        return HeuristicsSite::query()
            ->orderBy('site_key')
            ->get()
            ->map(function (HeuristicsSite $site) use ($eventCounts): array {
                $counts = $eventCounts->get($site->site_key);
                $lastActivity = $counts?->last_activity;

                return [
                    'site_key' => $site->site_key,
                    'url' => $site->url,
                    'visible' => (bool) $site->visible,
                    'pixel_status' => $site->pixel_status,
                    'last_verified_at' => $site->last_verified_at?->diffForHumans(),
                    'events' => (int) ($counts->events ?? 0),
                    'sessions' => (int) ($counts->sessions ?? 0),
                    'last_activity' => $lastActivity
                        ? Carbon::parse($lastActivity)->diffForHumans()
                        : null,
                ];
            })
            ->all();
    }

    /**
     * Recent raw pixel-liveness beacons for a site — the freshest signal that
     * the pixel is actually firing in real browsers.
     *
     * @return list<array{style: string, mode: string, visible: bool, path: string, pinged_at: string|null}>
     */
    private function recentPings(string $site, int $limit = 8): array
    {
        return HeuristicsPixelPing::query()
            ->where('site_key', $site)
            ->orderByDesc('pinged_at')
            ->limit($limit)
            ->get(['style', 'mode', 'visible', 'path', 'pinged_at'])
            ->map(fn (HeuristicsPixelPing $ping): array => [
                'style' => $ping->style,
                'mode' => $ping->mode,
                'visible' => (bool) $ping->visible,
                'path' => $ping->path,
                'pinged_at' => $ping->pinged_at?->diffForHumans(),
            ])
            ->all();
    }

    /**
     * The shared "pending submissions" badge the admin shell reads for the
     * Submissions nav entry. Mirrors the other admin controllers so the badge
     * stays populated on these pages too.
     */
    private function pendingSubmissions(): int
    {
        return (int) ShowcaseSubmission::query()->where('status', 'pending')->count();
    }
}

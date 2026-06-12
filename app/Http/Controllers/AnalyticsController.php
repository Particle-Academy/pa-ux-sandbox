<?php

namespace App\Http\Controllers;

use App\Models\ShowcaseSubmission;
use App\Models\User;
use App\Services\Entitlements;
use App\Services\Heuristics\HeuristicsReport;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use ParticleAcademy\Fms\Facades\FMS;

/**
 * Pro Analytics Suite — reads the live Fancy Heuristics data flowing into the
 * host (the showcase dogfoods its own pixel under site_key
 * `fancy-ui-showcase`) and renders a Pro-gated dashboard.
 *
 * The dashboard is behind the `analytics-suite` FMS feature, which the
 * AppServiceProvider pre-strategy unlocks for any Pro user (active
 * subscription OR the `sandbox-pro` fun-lab prize — see App\Services\Entitlements).
 * Non-Pro users get a clean upsell panel instead of the data.
 */
class AnalyticsController extends Controller
{
    /**
     * The site we dogfood by default — the showcase's own pixel feed.
     */
    public const DEFAULT_SITE = 'fancy-ui-showcase';

    /**
     * The FMS feature key that gates the whole suite. Listed in
     * Entitlements::PRO_FEATURES so the Pro pre-strategy grants it.
     */
    public const FEATURE = 'analytics-suite';

    public function index(Request $request, Entitlements $entitlements, HeuristicsReport $report): Response
    {
        $user = $request->user();

        // Pro gate. The pre-strategy treats `analytics-suite` as a Pro feature,
        // so this is true for subscribers and prize-holders alike, false for
        // everyone else. A non-Pro user gets the upsell payload (no data).
        if (! FMS::canAccess(self::FEATURE, $user)) {
            return Inertia::render('Analytics/Index', [
                'pro' => false,
                'proSource' => null,
                'sites' => [],
                'site' => null,
                'filters' => $this->filters($request),
                'kpis' => null,
                'topPaths' => [],
                'heatmap' => null,
                'heatmapShot' => null,
                'recentSessions' => [],
                'eventsOverTime' => [],
                'overview' => null,
                'overviewSeries' => null,
                'acquisition' => null,
                'audience' => null,
                'behavior' => null,
                'realtime' => null,
                'agent' => null,
            ]);
        }

        $sites = $this->sites($user);
        $site = $this->resolveSite($request, $sites);
        $filters = $this->filters($request);
        $days = $filters['range'];
        $actor = $filters['actor'];
        $compare = $filters['compare'];

        $heatmap = $report->heatmapForBusiestPath($site);

        // The KPI / heatmap / paths / sessions / trend math is shared with the
        // admin AdminHeuristicsController via HeuristicsReport so the two
        // surfaces never drift — only the gate around them differs.
        //
        // `kpis` / `topPaths` / `recentSessions` / `eventsOverTime` are the
        // original event-stream rollups (kept for the heatmap header + the admin
        // surface). The GA-parity sections below run off the session rollup and
        // re-scope to the range + actor toggles.
        return Inertia::render('Analytics/Index', [
            'pro' => true,
            'proSource' => $entitlements->proSource($user),
            'sites' => $sites,
            'site' => $site,
            'filters' => $filters,
            'kpis' => $report->kpis($site),
            'topPaths' => $report->topPaths($site),
            'heatmap' => $heatmap,
            'heatmapShot' => $heatmap ? $report->screenshotForPath($site, $heatmap['path']) : null,
            'recentSessions' => $report->recentSessions($site),
            'eventsOverTime' => $report->eventsOverTime($site),
            'overview' => $report->overview($site, $days, $actor, $compare),
            'overviewSeries' => $report->overviewTimeseries($site, $days, $compare),
            'acquisition' => $report->acquisition($site, $days, $actor),
            'audience' => $report->audience($site, $days, $actor),
            'behavior' => $report->behavior($site, $days, $actor),
            'realtime' => $report->realtime($site),
            'agent' => $report->agentAnalytics($site, $days),
        ]);
    }

    /**
     * Resolve the dashboard filter toggles off the query string, clamped to
     * valid values so a hand-edited `?range=999` can't reach the report layer.
     *
     * @return array{range: int, actor: string, compare: bool}
     */
    private function filters(Request $request): array
    {
        $range = (int) $request->query('range', 28);
        if (! in_array($range, HeuristicsReport::RANGES, true)) {
            $range = 28;
        }

        $actor = (string) $request->query('actor', 'all');
        if (! in_array($actor, ['all', 'human', 'agent'], true)) {
            $actor = 'all';
        }

        // `compare` defaults on; only an explicit "0"/"false" turns it off.
        $compareRaw = $request->query('compare', '1');
        $compare = ! in_array((string) $compareRaw, ['0', 'false', 'off'], true);

        return [
            'range' => $range,
            'actor' => $actor,
            'compare' => $compare,
        ];
    }

    /**
     * The sites this user is allowed to inspect: the site_keys of their OWN
     * showcase submissions, plus the public showcase dogfood feed. Scoping to
     * ownership is what stops one Pro user reading another's stats by guessing
     * a `?site=` key (every submission auto-registers a HeuristicsSite, so an
     * unscoped list would expose everyone's site).
     *
     * @return list<array{site_key: string, url: string|null, visible: bool}>
     */
    private function sites(?User $user): array
    {
        $owned = $user
            ? ShowcaseSubmission::query()
                ->where('user_id', $user->id)
                ->whereNotNull('site_key')
                ->orderByDesc('id')
                ->get(['site_key', 'url'])
                ->map(fn (ShowcaseSubmission $s): array => [
                    'site_key' => (string) $s->site_key,
                    'url' => $s->url,
                    'visible' => true,
                ])
                ->unique('site_key')
                ->values()
                ->all()
            : [];

        // The showcase dogfood feed is always available as a sample/default.
        if (! collect($owned)->contains(fn (array $s): bool => $s['site_key'] === self::DEFAULT_SITE)) {
            $owned[] = [
                'site_key' => self::DEFAULT_SITE,
                'url' => config('app.url'),
                'visible' => true,
            ];
        }

        return array_values($owned);
    }

    /**
     * Resolve the target site from `?site=`, restricted to the scoped list so
     * the picker can't be used to probe sites the user doesn't own. With no
     * (valid) `?site=`, default to the user's own first site, falling back to
     * the public showcase feed.
     *
     * @param  list<array{site_key: string, url: string|null, visible: bool}>  $sites
     */
    private function resolveSite(Request $request, array $sites): string
    {
        $keys = array_column($sites, 'site_key');
        $requested = (string) $request->query('site', '');

        if ($requested !== '' && in_array($requested, $keys, true)) {
            return $requested;
        }

        $ownFirst = collect($keys)->first(fn (string $k): bool => $k !== self::DEFAULT_SITE);

        return $ownFirst ?? self::DEFAULT_SITE;
    }
}

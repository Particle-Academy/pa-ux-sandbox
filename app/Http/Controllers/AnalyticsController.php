<?php

namespace App\Http\Controllers;

use App\Services\Entitlements;
use App\Services\Heuristics\HeuristicsReport;
use FancyHeuristics\Models\HeuristicsSite;
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
                'kpis' => null,
                'topPaths' => [],
                'heatmap' => null,
                'recentSessions' => [],
                'eventsOverTime' => [],
            ]);
        }

        $sites = $this->sites();
        $site = $this->resolveSite($request, $sites);

        // The KPI / heatmap / paths / sessions / trend math is shared with the
        // admin AdminHeuristicsController via HeuristicsReport so the two
        // surfaces never drift — only the gate around them differs.
        return Inertia::render('Analytics/Index', [
            'pro' => true,
            'proSource' => $entitlements->proSource($user),
            'sites' => $sites,
            'site' => $site,
            'kpis' => $report->kpis($site),
            'topPaths' => $report->topPaths($site),
            'heatmap' => $report->heatmapForBusiestPath($site),
            'recentSessions' => $report->recentSessions($site),
            'eventsOverTime' => $report->eventsOverTime($site),
        ]);
    }

    /**
     * Registered heuristics sites for the picker. Always includes the
     * default showcase key even if it has not been formally registered yet.
     *
     * @return list<array{site_key: string, url: string|null, visible: bool}>
     */
    private function sites(): array
    {
        $sites = HeuristicsSite::query()
            ->orderBy('site_key')
            ->get(['site_key', 'url', 'visible'])
            ->map(fn (HeuristicsSite $s): array => [
                'site_key' => $s->site_key,
                'url' => $s->url,
                'visible' => (bool) $s->visible,
            ])
            ->all();

        if (! collect($sites)->contains(fn (array $s): bool => $s['site_key'] === self::DEFAULT_SITE)) {
            array_unshift($sites, [
                'site_key' => self::DEFAULT_SITE,
                'url' => config('app.url'),
                'visible' => true,
            ]);
        }

        return array_values($sites);
    }

    /**
     * Resolve the target site from `?site=`, defaulting to the showcase feed.
     * Only accepts keys that appear in the registered list so the picker can't
     * be used to probe arbitrary site keys.
     *
     * @param  list<array{site_key: string, url: string|null, visible: bool}>  $sites
     */
    private function resolveSite(Request $request, array $sites): string
    {
        $requested = (string) $request->query('site', self::DEFAULT_SITE);
        $keys = array_column($sites, 'site_key');

        return in_array($requested, $keys, true) ? $requested : self::DEFAULT_SITE;
    }
}

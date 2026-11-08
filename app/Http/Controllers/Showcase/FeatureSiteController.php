<?php

namespace App\Http\Controllers\Showcase;

use App\Http\Controllers\Controller;
use App\Support\Curriculum\ListedCourses;
use App\Support\FeatureSites;
use App\Support\Registry\ConnectorCatalogue;
use App\Support\Registry\PackageVersions;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

/**
 * The Features index and each Feature's micro-site (`/features`,
 * `/features/{slug}`), plus the 301s from the pages they replaced.
 *
 * Everything a page shows about its packages comes from
 * {@see FeatureSites::resolved()}, which reads the registry. Versions are the
 * one fact the registry does not hold, so they are asked of npm / Packagist /
 * PyPI through {@see PackageVersions} as a DEFERRED prop: the page renders at
 * once and the versions arrive after, and a lookup that fails shows no version
 * rather than a stale or guessed one.
 */
class FeatureSiteController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('Features/Index', [
            'sites' => array_map(static function (array $feature): array {
                $resolved = FeatureSites::resolved($feature['slug']) ?? [];

                return [
                    'slug' => $feature['slug'],
                    'name' => $feature['name'],
                    'tagline' => $feature['tagline'],
                    'icon' => $feature['icon'],
                    'href' => $feature['href'],
                    'theme' => $feature['theme'],
                    'memberCount' => count($resolved['members'] ?? []),
                    'languages' => $resolved['languages'] ?? [],
                ];
            }, FeatureSites::all()),
        ]);
    }

    public function show(string $slug, PackageVersions $versions, ConnectorCatalogue $connectors): Response
    {
        $feature = FeatureSites::resolved($slug);
        abort_if($feature === null, 404);

        // The Feature names its course by slug; the link exists only while the
        // course is published in the curriculum, so it cannot point at a 404.
        // A Feature with no course (null) gets no link.
        $feature['course'] = is_string($feature['course']) ? ListedCourses::find($feature['course']) : null;

        return Inertia::render((string) $feature['component'], [
            'feature' => $feature,
            'versions' => Inertia::defer(fn (): array => $this->versionsOf($feature['members'], $versions)),
            // The Connectors page lists every connector the served index carries.
            ...($slug === 'connectors' ? ['connectors' => $connectors->all()] : []),
        ]);
    }

    /**
     * `/features/connectors/{service}/setup`: one connector's setup steps in
     * react-fancy's SetupWizard, or its credential fields and links when it
     * has no steps yet. The steps are the index's own; none is written here.
     */
    public function connectorSetup(string $service, ConnectorCatalogue $connectors): Response
    {
        $connector = $connectors->find($service);
        abort_if($connector === null, 404);

        $feature = FeatureSites::resolved('connectors');
        abort_if($feature === null, 404);
        $feature['course'] = null;

        return Inertia::render('Features/Connectors/Setup', [
            'feature' => $feature,
            'connector' => $connector,
        ]);
    }

    /**
     * 301 an old top-level page (`/flow`, `/fancy-tui`) to its Feature,
     * keeping the query string so deep links into a demo survive the move.
     */
    public function legacy(Request $request, string $feature): RedirectResponse
    {
        // The raw string, not getQueryString(), which re-sorts and re-encodes.
        $query = (string) $request->server->get('QUERY_STRING', '');

        return redirect()->to("/features/{$feature}".($query !== '' ? "?{$query}" : ''), 301);
    }

    /**
     * The latest published version of each member, or null when the registry
     * could not say. Never a typed fallback.
     *
     * @param  list<array<string, mixed>>  $members
     * @return array<string, ?string>
     */
    private function versionsOf(array $members, PackageVersions $versions): array
    {
        $out = [];
        foreach ($members as $member) {
            $registry = $member['registry'] ?? null;
            $distribution = $member['distribution'] ?? null;
            if (! is_string($registry) || ! is_string($distribution)) {
                $out[$member['slug']] = null;

                continue;
            }

            $lookup = $versions->lookup($registry, $distribution);
            $out[$member['slug']] = $lookup['status'] === 'ok' ? $lookup['version'] : null;
        }

        return $out;
    }
}

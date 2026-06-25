<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Setting;
use App\Support\DynamicSitemap;
use App\Support\WellKnownFilesModel;
use App\Support\XFilesFiles;
use FancySeo\Facades\FancySeo;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Admin editor for the site's well-known files (robots.txt / security.txt /
 * humans.txt / llms.txt / sitemap / AGENTS), backed by
 *
 * @particle-academy/fancy-x-files-ui's XFilesManager.
 *
 * The editor's value is the plain-JSON {@see WellKnownFilesModel}; saving stores
 * it as a Setting that {@see XFilesFiles} renders into the served
 * files. The private paths in config('x-files.protect') are enforced
 * server-side regardless of what's saved here, so a UI edit can never expose
 * /admin.
 */
class AdminWellKnownFilesController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('Admin/WellKnownFiles', [
            'model' => WellKnownFilesModel::current(),
            'protectedPaths' => array_values((array) config('x-files.protect', [])),
            'isCustomized' => Setting::get(WellKnownFilesModel::SETTING_KEY) !== null,
            'sitemapUrls' => $this->liveSitemapUrls(),
        ]);
    }

    /**
     * The live, auto-discovered sitemap URLs (fancy-seo's registered providers)
     * the admin's sitemap controls layer on top of — {@see DynamicSitemap}
     * renders these at request time, so this is exactly what's served.
     *
     * @return list<array{loc: string, path: string, priority: string, changefreq: string}>
     */
    private function liveSitemapUrls(): array
    {
        return array_map(
            fn (array $url): array => [
                'loc' => (string) $url['loc'],
                'path' => parse_url((string) $url['loc'], PHP_URL_PATH) ?: '/',
                'priority' => (string) ($url['priority'] ?? '0.5'),
                'changefreq' => (string) ($url['changefreq'] ?? 'weekly'),
            ],
            FancySeo::sitemapUrls(),
        );
    }

    public function update(Request $request): RedirectResponse
    {
        // The editor posts the full model as a JSON string (deeply nested —
        // a string sidesteps form-encoding ambiguity).
        $data = $request->validate(['model' => ['required', 'string', 'max:200000']]);

        $model = json_decode($data['model'], true);
        if (! is_array($model)) {
            return back()->withErrors(['model' => 'The well-known files model was not valid JSON.']);
        }

        Setting::put(WellKnownFilesModel::SETTING_KEY, json_encode($model));

        return back()->with('success', 'Well-known files published — robots.txt, security.txt, humans.txt, and the sitemap now reflect your edits.');
    }

    /** Reset to the config-derived default (drops the saved override). */
    public function reset(): RedirectResponse
    {
        Setting::put(WellKnownFilesModel::SETTING_KEY, null);

        return back()->with('success', 'Reverted to the default well-known files.');
    }
}

<?php

namespace App\Http\Controllers\Showcase;

use App\Http\Controllers\Controller;
use App\Models\GithubRepoStat;
use App\Support\ComponentContext;
use App\Support\PackageContext;
use App\Support\PackageRegistry;
use App\Support\Registry\RegistrySource;
use Illuminate\Support\Facades\File;
use Inertia\Inertia;
use Inertia\Response;
use League\CommonMark\GithubFlavoredMarkdownConverter;

class PackagesController extends Controller
{
    public function __construct(private readonly RegistrySource $registry) {}

    public function index(): Response
    {
        // ONE merged catalog — the UI grid packages (all()) plus the headless /
        // companion packages (companions()) — each carrying the design
        // classification (group / accent / ecosystem / kind) the redesigned
        // listing groups + styles by. The frontend buckets on `group`
        // (core → "Fancy Core", human → "The Human+ surfaces", companion →
        // "Companion packages") and switches tile style on `kind`
        // (ui/bridge → preview tile, headless → install-snippet tile).
        // GitHub star counts, refreshed by showcase:refresh-leaderboard +
        // nudged live by the star webhook. Absent (null) until the first sync.
        $stars = GithubRepoStat::starMap();

        $packages = collect(PackageRegistry::all())
            ->merge(PackageRegistry::companions())
            ->map(fn (array $p) => $this->presentForListing($p, $stars))
            ->values()
            ->all();

        return Inertia::render('Packages/Index', [
            'packages' => $packages,
        ]);
    }

    /**
     * Shape a registry entry for the listing payload — slug/name/tagline,
     * install ids, the design classification, and the resolved external URLs.
     *
     * @param  array<string, mixed>  $p
     * @param  array<string, int>  $stars  repo (lowercased) => star count
     * @return array<string, mixed>
     */
    private function presentForListing(array $p, array $stars = []): array
    {
        return [
            'slug' => $p['slug'],
            'name' => $p['name'],
            'tagline' => $p['tagline'],
            'language' => $p['language'],
            'core' => $p['core'] ?? false,
            'group' => $p['group'],
            'accent' => $p['accent'],
            'ecosystem' => $p['ecosystem'],
            'kind' => $p['kind'],
            'components_count' => count($p['components'] ?? []),
            'stars' => isset($p['repo']) ? ($stars[strtolower((string) $p['repo'])] ?? null) : null,
            'npm' => $p['npm'] ?? null,
            'composer' => $p['composer'] ?? null,
            'download' => $p['download'] ?? null,
            'cli' => $p['cli'] ?? null,
            'repoUrl' => isset($p['repo']) ? "https://github.com/{$p['repo']}" : null,
            'npmUrl' => isset($p['npm']) ? "https://www.npmjs.com/package/{$p['npm']}" : null,
            'packagistUrl' => isset($p['packagist']) ? "https://packagist.org/packages/{$p['packagist']}" : null,
        ];
    }

    public function show(string $package): Response
    {
        // findAny() also resolves the headless companion packages (holy-sheet,
        // dark-slide, fancy-query, mcp-relay-client, …) so they get a real
        // in-house docs page instead of bouncing out to npm/Packagist.
        $pkg = PackageRegistry::findAny($package);
        abort_if($pkg === null, 404);

        // Companion packages render no UI, so they carry no component grid.
        $pkg['components'] ??= [];

        // Headless packages have no live demo — render their installed README in
        // place of the preview so the page is never a dead "No UI surface" stub.
        $readmeHtml = $pkg['components'] === [] ? $this->readmeHtmlFor($pkg) : null;

        return Inertia::render('Packages/Show', [
            'package' => $pkg,
            'context' => PackageContext::find($pkg['slug']),
            'readmeHtml' => $readmeHtml,
        ]);
    }

    /**
     * Render the installed package's README.md to HTML (GitHub-flavored), with
     * relative image/link URLs absolutized to the repo so banners + relative doc
     * links resolve. Reads from node_modules (npm) or vendor (Composer); null
     * when no README ships with the package.
     *
     * @param  array<string, mixed>  $pkg
     */
    private function readmeHtmlFor(array $pkg): ?string
    {
        $dirs = [];
        if (! empty($pkg['npm'])) {
            $dirs[] = base_path('node_modules/'.$pkg['npm']);
        }
        if (! empty($pkg['composer'])) {
            $dirs[] = base_path('vendor/'.$pkg['composer']);
        }

        $markdown = null;
        foreach ($dirs as $dir) {
            foreach (['README.md', 'readme.md', 'README.markdown'] as $name) {
                if (File::exists("{$dir}/{$name}")) {
                    $markdown = File::get("{$dir}/{$name}");
                    break 2;
                }
            }
        }

        if ($markdown === null || trim($markdown) === '') {
            return null;
        }

        $html = (string) (new GithubFlavoredMarkdownConverter([
            'html_input' => 'strip',
            'allow_unsafe_links' => false,
        ]))->convert($markdown);

        return $this->absolutizeRepoLinks($html, (string) ($pkg['repo'] ?? ''));
    }

    /**
     * Rewrite relative <img src> / <a href> in rendered README HTML to absolute
     * GitHub raw/blob URLs so a README's banner image + relative links work when
     * shown off-repo. Anchors (#…) and already-absolute URLs are left alone.
     */
    private function absolutizeRepoLinks(string $html, string $repo): string
    {
        if ($repo === '') {
            return $html;
        }
        $raw = "https://raw.githubusercontent.com/{$repo}/HEAD/";
        $blob = "https://github.com/{$repo}/blob/HEAD/";

        return preg_replace_callback('/\b(src|href)="([^"]+)"/i', function (array $m) use ($raw, $blob): string {
            $attr = strtolower($m[1]);
            $url = $m[2];
            if (preg_match('~^(https?://|//|#|mailto:|tel:|data:)~i', $url)) {
                return $m[0];
            }
            $rel = ltrim((string) preg_replace('~^(\./)+~', '', $url), '/');

            return $attr.'="'.($attr === 'src' ? $raw : $blob).$rel.'"';
        }, $html) ?? $html;
    }

    public function component(string $package, string $component): Response
    {
        $pkg = PackageRegistry::find($package);
        abort_if($pkg === null, 404);

        $comp = collect($pkg['components'] ?? [])->firstWhere('slug', $component);
        abort_if($comp === null, 404);

        // Pull the matching registry-item (source files + deps) if we can
        // scan it from disk. Falls through to null for packages we don't yet
        // read (e.g. composer-only PHP packages).
        $item = $this->registry->find($comp['slug']);

        return Inertia::render('Packages/Component', [
            'package' => [
                'slug' => $pkg['slug'],
                'name' => $pkg['name'],
                'npm' => $pkg['npm'] ?? null,
                'composer' => $pkg['composer'] ?? null,
            ],
            'component' => $comp,
            'usage' => null,
            'context' => ComponentContext::find($pkg['slug'], $comp['slug']),
            'source' => $item ? [
                'files' => array_map(fn ($f) => [
                    'path' => $f['path'],
                    'name' => basename($f['path']),
                    'content' => $f['content'],
                    'language' => str_ends_with($f['path'], '.tsx') ? 'tsx' : 'ts',
                ], $item->files),
                'dependencies' => $item->dependencies,
                'registryDependencies' => $item->registryDependencies,
                'registryUrl' => "/r/{$item->name}.json",
            ] : null,
        ]);
    }
}

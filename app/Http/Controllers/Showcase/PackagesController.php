<?php

namespace App\Http\Controllers\Showcase;

use App\Http\Controllers\Controller;
use App\Models\GithubRepoStat;
use App\Support\ComponentContext;
use App\Support\PackageContext;
use App\Support\PackageFamily;
use App\Support\PackageRegistry;
use App\Support\Registry\RegistrySource;
use Illuminate\Http\RedirectResponse;
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

        // Related packages (a PHP core + its Node mirror + a React UI + per-host
        // adapters, …) fold into ONE family card each, so a product lists once —
        // not once per package.
        $memberSlugs = PackageFamily::memberSlugs();

        $packages = collect(PackageRegistry::all())
            ->merge(PackageRegistry::companions())
            ->reject(fn (array $p) => in_array($p['slug'], $memberSlugs, true))
            ->map(fn (array $p) => $this->presentForListing($p, $stars));

        $families = collect(PackageFamily::all())
            ->map(fn (array $family) => $this->presentFamilyCard($family, $stars));

        return Inertia::render('Packages/Index', [
            'packages' => $packages->merge($families)->values()->all(),
        ]);
    }

    /**
     * Shape a family as one consolidated listing card — the product, the
     * languages its members ship in, its member count, and the best star count
     * across their repos. Links to the single family page.
     *
     * @param  array<string, mixed>  $family
     * @param  array<string, int>  $stars
     * @return array<string, mixed>
     */
    private function presentFamilyCard(array $family, array $stars = []): array
    {
        $slugs = [];
        foreach ($family['sections'] as $section) {
            foreach ($section['members'] as $member) {
                $slugs[] = $member['slug'];
            }
        }

        // A family's slug is usually one of its members, but it can be a
        // neutral slug that is not itself a package — fall back to the first
        // member for the accent.
        $primary = PackageRegistry::findAny($family['slug'])
            ?? PackageRegistry::findAny($slugs[0] ?? '')
            ?? [];

        $starCount = null;
        $components = 0;
        foreach ($slugs as $slug) {
            $rec = PackageRegistry::findAny($slug);
            $components += count($rec['components'] ?? []);
            $repo = isset($rec['repo']) ? strtolower((string) $rec['repo']) : null;
            if ($repo !== null && isset($stars[$repo])) {
                $starCount = max($starCount ?? 0, $stars[$repo]);
            }
        }

        $languages = PackageFamily::languagesFor($family['slug']);

        return [
            'slug' => $family['slug'],
            'name' => $family['name'],
            'tagline' => $family['tagline'],
            'language' => implode(' · ', $languages),
            'core' => false,
            'group' => $family['group'],
            'accent' => $primary['accent'] ?? '#8b5cf6',
            'ecosystem' => count($languages) > 1 ? 'polyglot' : ($primary['ecosystem'] ?? 'ts'),
            'kind' => $family['kind'],
            'components_count' => $components,
            'stars' => $starCount,
            'npm' => null,
            'composer' => null,
            'download' => null,
            'cli' => null,
            'repoUrl' => null,
            'npmUrl' => null,
            'packagistUrl' => null,
            'family' => true,
            'languages' => $languages,
            'member_count' => count($slugs),
        ];
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
            'family' => false,
            'languages' => null,
            'member_count' => 1,
        ];
    }

    public function show(string $package): Response|RedirectResponse
    {
        // Related packages get ONE page: the family slug renders the family
        // page; any member slug (fancy-git-js, fancy-git-github-php, …) 301s
        // to it.
        if ($family = PackageFamily::find($package)) {
            if ($package !== $family['slug']) {
                return redirect()->route('packages.show', $family['slug'], 301);
            }

            return $this->family($family);
        }

        // findAny() also resolves the headless companion packages (fancy-query,
        // mcp-relay-client, …) so they get a real in-house docs page instead of
        // bouncing out to npm/Packagist.
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
     * Render the family page — every related package in one place, grouped by
     * the family's labelled sections (Engine / React UI / GitHub provider / …),
     * each member carrying its own install command and links.
     *
     * @param  array<string, mixed>  $family
     */
    private function family(array $family): Response
    {
        $stars = GithubRepoStat::starMap();

        $sections = array_map(fn (array $section): array => [
            'label' => $section['label'],
            'capability' => $section['capability'],
            'members' => array_map(fn (array $m): array => $this->presentFamilyMember($m, $stars), $section['members']),
        ], $family['sections']);

        // Members share one product, so render ONE README as the family's docs —
        // the first member that ships one, in declaration order.
        $readmeHtml = null;
        foreach ($family['sections'] as $section) {
            foreach ($section['members'] as $member) {
                $record = PackageRegistry::findAny($member['slug']);
                if ($record === null) {
                    continue;
                }
                $readmeHtml = $this->readmeHtmlFor($record);
                if ($readmeHtml !== null) {
                    break 2;
                }
            }
        }

        return Inertia::render('Packages/Family', [
            'family' => [
                'slug' => $family['slug'],
                'name' => $family['name'],
                'tagline' => $family['tagline'],
                'sections' => $sections,
            ],
            'context' => PackageContext::find($family['slug']),
            'readmeHtml' => $readmeHtml,
        ]);
    }

    /**
     * Shape one family member for the family page.
     *
     * @param  array{language: string, slug: string}  $m
     * @param  array<string, int>  $stars
     * @return array<string, mixed>
     */
    private function presentFamilyMember(array $m, array $stars): array
    {
        $rec = PackageRegistry::findAny($m['slug']) ?? [];

        return [
            'language' => $m['language'],
            'slug' => $m['slug'],
            'name' => $rec['name'] ?? $m['slug'],
            'tagline' => $rec['tagline'] ?? '',
            'ecosystem' => $rec['ecosystem'] ?? (($rec['language'] ?? '') === 'PHP' ? 'php' : 'ts'),
            'npm' => $rec['npm'] ?? null,
            'composer' => $rec['composer'] ?? null,
            'install' => isset($rec['npm'])
                ? "npm install {$rec['npm']}"
                : (isset($rec['composer']) ? "composer require {$rec['composer']}" : null),
            'components_count' => count($rec['components'] ?? []),
            'stars' => isset($rec['repo']) ? ($stars[strtolower((string) $rec['repo'])] ?? null) : null,
            'repoUrl' => isset($rec['repo']) ? "https://github.com/{$rec['repo']}" : null,
            'npmUrl' => isset($rec['npm']) ? "https://www.npmjs.com/package/{$rec['npm']}" : null,
            'packagistUrl' => isset($rec['packagist']) ? "https://packagist.org/packages/{$rec['packagist']}" : null,
        ];
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

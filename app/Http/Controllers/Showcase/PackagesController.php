<?php

namespace App\Http\Controllers\Showcase;

use App\Http\Controllers\Controller;
use App\Models\GithubRepoStat;
use App\Support\ComponentContext;
use App\Support\PackageContext;
use App\Support\PackageFamily;
use App\Support\PackageRegistry;
use App\Support\Registry\ReadmeSource;
use App\Support\Registry\RegistrySource;
use App\Support\Registry\TuiPreviewSource;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;
use League\CommonMark\GithubFlavoredMarkdownConverter;

class PackagesController extends Controller
{
    public function __construct(
        private readonly RegistrySource $registry,
        private readonly ReadmeSource $readmes,
        private readonly TuiPreviewSource $tuiPreviews,
    ) {}

    public function index(): Response
    {
        // ONE merged catalog — the UI grid packages (all()) plus the no-UI ones
        // (companions()) — each carrying the design classification
        // (group / accent / ecosystem / kind) the listing buckets + styles by.
        //
        // `group` is a THEME, not a tier: Core / Surfaces / Documents /
        // Commerce & growth / Web platform / Agents & tooling. Nothing is a
        // second-class "companion" — a headless writer is as first-class as a
        // canvas. `kind` only picks the tile style (ui/bridge → preview tile,
        // headless → install-snippet tile).
        //
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
            'href' => "/packages/family/{$family['slug']}",
            'family' => true,
            'languages' => $languages,
            'member_count' => count($slugs),
            'members' => $slugs,
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
            'href' => "/packages/{$p['slug']}",
            'family' => false,
            'languages' => null,
            'member_count' => 1,
        ];
    }

    public function show(string $package): Response|RedirectResponse
    {
        // Families render at /packages/family/{slug}, so a package slug that is
        // ALSO a family slug (fancy-3d, fancy-flow, holy-sheet, …) still serves
        // its own page here — with its component demos, previews and props.
        // Only a member with nothing of its own to show is sent to the family.
        $family = PackageFamily::find($package);
        if ($family !== null && ! $this->memberKeepsOwnPage(PackageRegistry::findAny($package))) {
            return redirect()->route('packages.family', $family['slug'], 301);
        }

        // findAny() also resolves the headless packages (fancy-query,
        // mcp-relay-client, …) so they get a real in-house docs page instead of
        // bouncing out to npm/Packagist.
        $pkg = PackageRegistry::findAny($package);
        abort_if($pkg === null, 404);

        // Headless packages render no UI, so they carry no component grid.
        $pkg['components'] ??= [];

        // fancy-tui renders to a TERMINAL, so its previews are captured ANSI
        // frames rather than React. Attached here so a tile can render the real
        // thing; the alternative was 51 "coming soon" boxes on a package whose
        // capture harness has existed all along.
        if ($pkg['slug'] === 'fancy-tui') {
            $pkg['components'] = array_map(function (array $component): array {
                $frame = $this->tuiPreviews->forComponent((string) ($component['slug'] ?? ''));

                return $frame === null
                    ? $component
                    : $component + ['frame' => $frame['frame'], 'columns' => $frame['columns']];
            }, $pkg['components']);
        }

        // A page with no live demo shows its README instead, so it is never a
        // dead "No UI surface" stub.
        //
        // Keyed on `kind`, not on an empty component list. Those were treated as
        // the same thing and are not: `fancy-pwa` is classified headless AND
        // lists a component, so it fetched no README, then rendered through the
        // headless body with nothing in it — a completely blank page from one
        // word of metadata disagreeing with another.
        $isHeadless = ($pkg['kind'] ?? null) === 'headless';
        $readmeHtml = $isHeadless || $pkg['components'] === [] ? $this->readmeHtmlFor($pkg) : null;

        return Inertia::render('Packages/Show', [
            'package' => $pkg,
            'context' => PackageContext::find($pkg['slug']),
            'readmeHtml' => $readmeHtml,
            // So a member page can point back at the product it belongs to.
            'family' => $family === null ? null : [
                'slug' => $family['slug'],
                'name' => $family['name'],
                'href' => "/packages/family/{$family['slug']}",
            ],
        ]);
    }

    /**
     * Render the family page — every related package in one place, grouped by
     * the family's labelled sections (Engine / React UI / GitHub provider / …),
     * each member carrying its own install command and links.
     */
    public function family(string $family): Response
    {
        $family = PackageFamily::find($family);
        abort_if($family === null, 404);

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
     * Does this family member warrant its own page? Yes when it has real
     * content of its own — live component demos or a shipped README. Members
     * with neither would be a thin stub, so those 301 to the family page and we
     * never link them. Nothing is lost by grouping.
     *
     * @param  array<string, mixed>|null  $rec
     */
    private function memberKeepsOwnPage(?array $rec): bool
    {
        if ($rec === null) {
            return false;
        }

        return ($rec['components'] ?? []) !== [] || $this->readmeHtmlFor($rec) !== null;
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
            'href' => $this->memberKeepsOwnPage($rec) ? "/packages/{$m['slug']}" : null,
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
    /**
     * A package's README as HTML.
     *
     * Sourced by {@see ReadmeSource} from the package's own repo, NOT from
     * whatever the showcase installs — that made documentation a side effect of
     * this app's dependency list, and left every uninstalled package (the `-js`
     * twins, the git provider adapters) with none at all.
     */
    private function readmeHtmlFor(array $pkg): ?string
    {
        $markdown = $this->readmes->markdownFor($pkg);

        if ($markdown === null) {
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

        // Same captured frame the grid tile shows. Without this the detail page
        // is the one place a fancy-tui component still falls back to a
        // placeholder — after the grid has just shown the real render.
        if (($frame = $this->tuiPreviews->forComponent($component)) !== null && $pkg['slug'] === 'fancy-tui') {
            $comp = $comp + ['frame' => $frame['frame'], 'columns' => $frame['columns']];
        }

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

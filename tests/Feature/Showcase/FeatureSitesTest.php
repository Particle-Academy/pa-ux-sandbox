<?php

use App\Support\FeatureSites;
use App\Support\PackageFamily;
use App\Support\PackageRegistry;
use Tests\TestCase;

uses(TestCase::class);

/*
 * The Features dropdown and its micro-sites (.ai/plans/features-microsites.md).
 *
 * The eight Features are ONE server-side list (App\Support\FeatureSites), read
 * by the nav through shared props, by the /features index and by each page.
 * These tests pin the contract the Phase B micro-sites build on: the slugs, the
 * order, the redirects from the old top-level pages, that every member package
 * resolves in the registry, and that each page names itself for SEO.
 */

const FEATURE_SLUGS = ['flow', 'tui', 'cms', 'documents', 'git', '3d', 'ecommerce', 'gamification'];

/** The Inertia page object an initial (HTML) visit carries. */
function inertiaPage(string $html): array
{
    preg_match('#<script data-page="app" type="application/json">(.*?)</script>#s', $html, $page);

    return json_decode($page[1] ?? '{}', true) ?? [];
}

it('serves the Features index', function () {
    $page = inertiaPage($this->get('/features')->assertOk()->getContent());

    expect($page['component'] ?? null)->toBe('Features/Index')
        ->and(array_column($page['props']['features'] ?? [], 'slug'))->toBe(FEATURE_SLUGS);
});

it('serves every Feature micro-site', function (string $slug) {
    $page = inertiaPage($this->get("/features/{$slug}")->assertOk()->getContent());

    expect($page['component'] ?? '')->toStartWith('Features/')
        ->and($page['component'])->toEndWith('/Index')
        ->and($page['props']['feature']['slug'] ?? null)->toBe($slug)
        ->and($page['props']['feature']['members'] ?? [])->not->toBeEmpty();
})->with(FEATURE_SLUGS);

it('404s a Feature that does not exist', function (string $slug) {
    $this->get("/features/{$slug}")->assertNotFound();
})->with(['nope', 'fancy-flow', 'Flow', 'tui-x']);

it('301s the old top-level pages to their Feature, keeping the query string', function (string $from, string $to) {
    $this->get($from)->assertStatus(301)->assertRedirect($to);
    $this->get("{$from}?example=cohort&x=1")->assertStatus(301)->assertRedirect("{$to}?example=cohort&x=1");
})->with([
    ['/flow', '/features/flow'],
    ['/fancy-tui', '/features/tui'],
]);

it('leaves the TUI session API where the live terminal calls it', function () {
    // Only the PAGE moved. The session endpoints DocsTui talks to stay put.
    expect(route('fancy-tui.session', absolute: false))->toBe('/fancy-tui/session')
        ->and(route('fancy-tui.session.stream', absolute: false))->toBe('/fancy-tui/session/stream');
});

it('shares the eight Features with every page, in order, for the nav', function (string $url) {
    $features = inertiaPage($this->get($url)->assertOk()->getContent())['props']['features'] ?? null;

    expect($features)->toBeArray()
        ->and(array_column($features, 'slug'))->toBe(FEATURE_SLUGS);

    foreach ($features as $feature) {
        expect($feature['name'])->toBeString()->not->toBe('')
            ->and($feature['tagline'])->toBeString()->not->toBe('')
            ->and($feature['icon'])->toMatch('/^[a-z0-9]+(-[a-z0-9]+)*$/')
            ->and($feature['href'])->toBe('/features/'.$feature['slug']);
    }
})->with(['/', '/packages', '/features/cms']);

it('resolves every member package through the registry', function () {
    foreach (FeatureSites::all() as $feature) {
        expect($feature['memberSlugs'])->not->toBeEmpty("{$feature['slug']} lists no packages");

        foreach ($feature['memberSlugs'] as $slug) {
            expect(PackageRegistry::findAny($slug))->not->toBeNull("{$feature['slug']} lists {$slug}, which is not in PackageRegistry");
        }
    }
});

it('expands every family reference to a real family', function () {
    // A typo'd `family:` entry would expand to nothing and silently drop
    // packages from a page that still looks complete.
    $references = FeatureSites::familyReferences();

    expect($references)->not->toBeEmpty();
    foreach ($references as $family) {
        expect(PackageFamily::find($family)['slug'] ?? null)->toBe($family, "family:{$family} names no package family")
            ->and(PackageFamily::memberSlugsOf($family))->not->toBeEmpty();
    }
});

it('lists the Ecommerce members in the order the plan gives them', function () {
    expect(array_slice(FeatureSites::find('ecommerce')['memberSlugs'], 0, 4))
        ->toBe(['laravel-catalog', 'fancy-catalog-js', 'laravel-fms', 'fancy-features-js']);
});

it('takes member names and install commands from the registry, never typed', function () {
    $flow = FeatureSites::resolved('flow');
    $engine = collect($flow['members'])->firstWhere('slug', 'fancy-flow');
    $record = PackageRegistry::findAny('fancy-flow');

    expect($engine['name'])->toBe($record['name'])
        ->and($engine['install'])->toBe('npm install '.$record['npm'])
        ->and($engine['href'])->toBe('/packages/fancy-flow');

    $php = collect($flow['members'])->firstWhere('slug', 'fancy-flow-php');
    expect($php['install'])->toBe('composer require '.PackageRegistry::findAny('fancy-flow-php')['composer'])
        ->and($php['language'])->toBe('PHP');
});

it('gives each Feature its own identity tokens', function () {
    foreach (FeatureSites::all() as $feature) {
        expect($feature['theme']['accent'])->toMatch('/^#[0-9a-f]{6}$/')
            ->and($feature['theme']['accentDark'])->toMatch('/^#[0-9a-f]{6}$/')
            ->and($feature['theme']['surface'])->toMatch('/^#[0-9a-f]{6}$/')
            ->and($feature['theme']['surfaceDark'])->toMatch('/^#[0-9a-f]{6}$/')
            ->and($feature['theme']['font'])->toBeIn(['sans', 'display', 'mono', 'serif']);
    }

    expect(collect(FeatureSites::all())->pluck('theme.accent')->unique())->toHaveCount(8);
});

it('names every Features page for search and share, with its own canonical', function (string $path) {
    $base = rtrim((string) config('app.url'), '/');
    $html = $this->get($path)->assertOk()->getContent();

    $meta = static function (string $key) use ($html): string {
        foreach (preg_match_all('#<meta\s[^>]*>#i', $html, $tags) ? $tags[0] : [] as $tag) {
            if (preg_match('#\s(?:name|property)="'.preg_quote($key, '#').'"#i', $tag) && preg_match('#\scontent="([^"]*)"#i', $tag, $c)) {
                return html_entity_decode($c[1], ENT_QUOTES);
            }
        }

        return '';
    };
    preg_match('#<title[^>]*>(.*?)</title>#si', $html, $title);
    preg_match('#rel="canonical" href="([^"]*)"#i', $html, $canonical);

    $titleText = html_entity_decode(trim($title[1] ?? ''), ENT_QUOTES);

    expect($canonical[1] ?? null)->toBe($base.$path)
        ->and($titleText)->not->toBe((string) config('fancy-seo.site_name'))
        ->and($titleText)->toContain('Features')
        ->and($meta('description'))->not->toBe('')
        ->and($meta('description'))->not->toBe((string) config('fancy-seo.description'))
        ->and($meta('og:image'))->toContain('/og/features/');

    $card = $this->get((string) parse_url($meta('og:image'), PHP_URL_PATH));
    expect($card->status())->toBe(200)
        ->and($card->headers->get('Content-Type'))->toBe('image/png');
})->with(['/features', ...array_map(fn (string $slug): string => "/features/{$slug}", FEATURE_SLUGS)]);

it('lists Features in the sitemap instead of the old top-level pages', function () {
    $xml = $this->get('/sitemap.xml')->assertOk()->getContent();
    $base = rtrim((string) config('app.url'), '/');

    expect($xml)->toContain("<loc>{$base}/features</loc>");
    foreach (FEATURE_SLUGS as $slug) {
        expect($xml)->toContain("<loc>{$base}/features/{$slug}</loc>");
    }
    expect($xml)->not->toContain("<loc>{$base}/flow</loc>")
        ->and($xml)->not->toContain("<loc>{$base}/fancy-tui</loc>");
});

it('drops Flow and TUI from the top-level nav in favour of a Features dropdown', function () {
    $layout = (string) file_get_contents(resource_path('js/Pages/Layout.tsx'));

    preg_match('/const NAV_ITEMS[^=]*=\s*\[(.*?)\];/s', $layout, $nav);
    expect($nav[1] ?? null)->not->toBeNull('NAV_ITEMS was not found in Layout.tsx');

    $targets = preg_match_all('/to:\s*"([^"]+)"/', $nav[1], $m) ? $m[1] : [];
    expect($targets)->not->toContain('/flow')
        ->and($targets)->not->toContain('/fancy-tui')
        ->and($targets)->toContain('/docs');

    // The dropdown is react-fancy's, fed from the shared `features` prop, not a
    // second hand-typed list.
    expect($layout)->toContain('<FeaturesMenu')
        ->and($layout)->toMatch('/props\.features/');
    expect((string) file_get_contents(resource_path('js/Pages/Features/shared/FeaturesMenu.tsx')))
        ->toContain('<Dropdown');
});

it('points nothing at the old Flow and TUI URLs', function () {
    // A link to a 301 still works, but it costs every visitor a round trip and
    // tells a crawler the old URL is the one we use.
    expect(PackageRegistry::findAny('fancy-flow')['showcase'])->toBe('/features/flow')
        ->and(PackageRegistry::findAny('fancy-tui')['showcase'])->toBe('/features/tui');

    $offenders = [];
    $files = [
        app_path('Support/UseCases/UseCaseContent.php'),
        resource_path('js/Pages/Layout.tsx'),
        resource_path('js/Pages/Packages/Component.tsx'),
        resource_path('js/components/SiteWalkthrough.tsx'),
    ];
    foreach ($files as $file) {
        if (preg_match('#["\'](/flow|/fancy-tui)["\'?\#]#', (string) file_get_contents($file), $hit)) {
            $offenders[] = basename($file).": {$hit[1]}";
        }
    }

    expect($offenders)->toBe([]);
});

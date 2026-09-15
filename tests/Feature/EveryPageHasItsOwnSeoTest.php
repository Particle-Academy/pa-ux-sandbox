<?php

use App\Http\Controllers\Showcase\StarterKitController;
use App\Support\Curriculum\FancyCurriculumContent;
use App\Support\Docs\DocsArchive;
use App\Support\Docs\DocsRegistry;
use App\Support\GalleryRegistry;
use App\Support\PackageFamily;
use App\Support\PackageRegistry;
use App\Support\UseCases\UseCaseContent;
use Illuminate\Support\Facades\File;
use Tests\TestCase;

uses(TestCase::class);

/*
 * Every page says what it is, and no two pages say the same thing.
 *
 * A family page shared to Discord unfurled as "Fancy UI — Components for the
 * surfaces where humans and agents work together" with the site's default
 * card: it had no SEO of its own, and neither did the starter kits, the
 * courses, the flow editor, the storefront or every companion package page
 * ("Package — Fancy UI"). The docs pages had their own titles and all shared
 * one card. Each of those was a page that stopped describing itself the moment
 * its link left the site.
 *
 * `SeoTest` checks the head is present. This crawls the site and checks it is
 * DIFFERENT on every page: its own title, its own description and its own card.
 * A new page type with no resolver fails here with the list of pages that
 * collide, instead of being found in a chat preview.
 */

/** @return list<string> */
function everyPublicPage(): array
{
    $urls = ['/', '/packages', '/docs', '/use-cases', '/starter-kits', '/inspiration', '/agent-playground', '/dreaming', '/dreaming/archived', '/showcase', '/leaderboard', '/shop', '/flow', '/fancy-tui', '/learn', '/pw', '/subscriptions', '/products'];

    foreach (PackageFamily::all() as $family) {
        $urls[] = '/packages/family/'.$family['slug'];
    }
    foreach (array_merge(PackageRegistry::all(), PackageRegistry::companions()) as $pkg) {
        $urls[] = '/packages/'.$pkg['slug'];
        foreach ($pkg['components'] ?? [] as $component) {
            $urls[] = '/packages/'.$pkg['slug'].'/'.$component['slug'];
        }
    }
    foreach (DocsRegistry::flat() as $doc) {
        $urls[] = '/docs/'.$doc['slug'];
    }
    foreach (DocsArchive::versions() as $version) {
        $version = is_array($version) ? (string) ($version['version'] ?? '') : (string) $version;
        if ($version === '' || $version === DocsArchive::current() || ! DocsArchive::exists($version)) {
            continue;
        }
        foreach (DocsArchive::flat($version) as $doc) {
            $urls[] = "/docs/{$version}/{$doc['slug']}";
        }
    }
    foreach (UseCaseContent::all() as $useCase) {
        $urls[] = '/use-cases/'.$useCase['slug'];
    }
    foreach (StarterKitController::kits() as $kit) {
        $urls[] = '/starter-kits/'.$kit['slug'];
    }
    foreach (GalleryRegistry::collections() as $collection) {
        $urls[] = '/inspiration/'.$collection['id'];
        foreach (GalleryRegistry::styles($collection['id']) as $style) {
            $urls[] = '/inspiration/'.$collection['id'].'/'.$style['id'];
        }
    }
    foreach (FancyCurriculumContent::courses() as $course) {
        $urls[] = '/learn/'.$course['slug'];
    }

    return array_values(array_unique($urls));
}

/** @return array{title: string, description: string, image: string, canonical: string} */
function headOf(string $html): array
{
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

    return [
        'title' => html_entity_decode(trim($title[1] ?? ''), ENT_QUOTES),
        'description' => $meta('description'),
        'image' => $meta('og:image'),
        'canonical' => $canonical[1] ?? '',
    ];
}

it('gives every public page its own title, description and share card', function () {
    $base = rtrim((string) config('app.url'), '/');
    $defaultTitle = (string) config('fancy-seo.site_name');
    $defaultDescription = (string) config('fancy-seo.description');
    $defaultImage = $base.config('fancy-seo.image');

    $heads = [];
    $problems = [];

    foreach (everyPublicPage() as $url) {
        $response = $this->get($url);

        // A member package 301s to its family page, which is crawled on its own.
        if ($response->isRedirection()) {
            continue;
        }
        if ($response->status() !== 200) {
            $problems[] = "{$url} answered {$response->status()}";

            continue;
        }

        $head = headOf($response->getContent());
        // A page that declares itself a copy of another is allowed to match it.
        if ($head['canonical'] !== '' && $head['canonical'] !== $base.($url === '/' ? '/' : $url)) {
            continue;
        }

        if ($head['title'] === '' || $head['title'] === $defaultTitle) {
            $problems[] = "{$url} has the site's default title";
        }
        if ($head['description'] === '' || $head['description'] === $defaultDescription) {
            $problems[] = "{$url} has the site's default description";
        }
        if ($url !== '/' && ($head['image'] === '' || $head['image'] === $defaultImage)) {
            $problems[] = "{$url} has the site's default share card";
        }

        $heads[$url] = $head;
    }

    expect(count($heads))->toBeGreaterThan(300, 'the crawl reached almost nothing; this check would assert nothing');

    foreach (['title', 'description', 'image'] as $field) {
        foreach (collect($heads)->groupBy(fn (array $h): string => $h[$field], preserveKeys: true) as $value => $pages) {
            if ($value !== '' && $pages->count() > 1) {
                $problems[] = "{$pages->count()} pages share one {$field} [".mb_strimwidth((string) $value, 0, 90, '…').']: '.$pages->keys()->take(6)->implode(', ');
            }
        }
    }

    expect($problems)->toBe([], "Pages without their own SEO:\n  ".implode("\n  ", $problems));
});

it('hands the client the same head the server sent, so hydration changes nothing', function () {
    // The client <Seo> takes the head over after hydration. When pages passed
    // their own values, the browser showed a different title from the server's
    // ("Fancy 3D — Fancy UI" over "Fancy 3D — package family — Fancy UI"), and a
    // crawler that runs JavaScript indexes the browser's version.
    foreach (['/', '/packages/family/'.PackageFamily::all()[0]['slug'], '/docs/plugin', '/packages/react-fancy/button', '/learn'] as $url) {
        $html = $this->get($url)->assertOk()->getContent();
        preg_match('#<script data-page="app" type="application/json">(.*?)</script>#s', $html, $page);
        $seo = json_decode($page[1] ?? '{}', true)['props']['seo'] ?? null;
        $head = headOf($html);

        expect($seo)->not->toBeNull("{$url} shares no seo prop");
        expect($seo['title'])->toBe($head['title'], "{$url}: the client title differs from the server's");
        expect($seo['description'])->toBe($head['description'], "{$url}: the client description differs from the server's");
        expect($seo['image'])->toBe($head['image'], "{$url}: the client card differs from the server's");
    }
});

it('lets no page pass its own title to <Seo>', function () {
    // One source. A page that hands <Seo> its own values brings back the
    // mismatch above; <ServerSeo /> is the only way a page sets its head.
    // Read as the import, not the tag: comments explaining the history name
    // <Seo>, and a page cannot render it without importing it.
    $offenders = collect(File::allFiles(resource_path('js/Pages')))
        ->filter(fn ($file) => preg_match('/import\s*\{[^}]*\bSeo\b[^}]*\}\s*from\s*"@particle-academy\/fancy-inertia\/seo"/', (string) file_get_contents($file->getPathname())))
        ->map(fn ($file) => str_replace('\\', '/', $file->getRelativePathname()))
        ->values()
        ->all();

    expect($offenders)->toBe([], 'these pages set their own head: '.implode(', ', $offenders));
});

it('draws a real card for every kind of page', function () {
    $cards = [
        '/og/families/'.PackageFamily::all()[0]['slug'].'.png',
        '/og/docs/'.DocsRegistry::flat()[0]['slug'].'.png',
        '/og/use-cases/'.UseCaseContent::all()[0]['slug'].'.png',
        '/og/starter-kits/'.StarterKitController::kits()[0]['slug'].'.png',
        '/og/learn/'.FancyCurriculumContent::courses()[0]['slug'].'.png',
        '/og/learn/index.png',
        '/og/inspiration/index.png',
        '/og/pages/flow.index.png',
        '/og/components/react-fancy/button.png',
        '/og/packages/holy-sheet.png',
    ];

    foreach ($cards as $card) {
        $response = $this->get($card);
        expect($response->status())->toBe(200, "{$card} did not render");
        expect($response->headers->get('Content-Type'))->toBe('image/png');
        $size = getimagesizefromstring($response->getContent());
        expect([$size[0], $size[1]])->toBe([1200, 630], "{$card} is not a 1200x630 card");
    }

    // A key that names nothing is a 404, not a blank card.
    $this->get('/og/families/not-a-family.png')->assertNotFound();
    $this->get('/og/pages/not.a.route.png')->assertNotFound();
});

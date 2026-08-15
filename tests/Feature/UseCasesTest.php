<?php

declare(strict_types=1);

use App\Support\PackageRegistry;
use App\Support\UseCases\UseCaseContent;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

uses(TestCase::class, RefreshDatabase::class);

/**
 * The use-case pages.
 *
 * Beyond "it renders", two things here are load-bearing and both fail silently
 * without a test:
 *
 * 1. **Every package slug must resolve.** The controller skips a slug it cannot
 *    find, so a typo or a renamed package removes the link and renders a
 *    perfectly good-looking page with one fewer package on it. Nothing errors,
 *    nothing logs, and the page still passes a smoke test.
 * 2. **Every `link` must be a real, PUBLIC route.** Three of these originally
 *    pointed at auth-walled pages, which sends a logged-out visitor -- the exact
 *    reader this page is for -- to a login screen.
 */
it('lists every use case, grouped by category', function () {
    $this->get('/use-cases')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('UseCases/Index')
            ->has('useCases', count(UseCaseContent::all()))
            ->has('categories')
        );
});

it('renders each use case with a problem and steps', function () {
    foreach (UseCaseContent::all() as $useCase) {
        $this->get("/use-cases/{$useCase['slug']}")
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('UseCases/Show')
                ->where('useCase.slug', $useCase['slug'])
                ->etc()
            );
    }
})->with([[null]]);

it('404s an unknown use case', function () {
    $this->get('/use-cases/does-not-exist')->assertNotFound();
});

it('references only packages that exist in the registry', function () {
    // The controller SKIPS an unresolvable slug rather than failing, so this is
    // the only thing standing between a renamed package and a page that quietly
    // stops advertising it.
    $bad = [];

    foreach (UseCaseContent::all() as $useCase) {
        foreach ($useCase['packages'] as $slug) {
            // findAny(), not find(): 27 of the 48 referenced packages are
            // companions -- the headless halves and the -js ports.
            if (! PackageRegistry::findAny($slug)) {
                $bad[] = "{$useCase['slug']} -> {$slug}";
            }
        }
    }

    expect($bad)->toBe([]);
});

it('actually renders a package link for every slug referenced', function () {
    // The check above proves the slugs resolve; this proves they SURVIVE the
    // controller. A resolver returning null for a package the registry knows
    // about would pass the previous test and still drop the link.
    foreach (UseCaseContent::all() as $useCase) {
        $expected = count($useCase['packages']);

        $this->get("/use-cases/{$useCase['slug']}")
            ->assertInertia(fn ($page) => $page
                ->has('useCase.packages', $expected)
                ->etc()
            );
    }
})->with([[null]]);

it('links only to routes a logged-out visitor can actually reach', function () {
    // Not merely "the route exists" -- a 302 to /login is a real route and a
    // dead end for the reader this page is written for.
    foreach (UseCaseContent::all() as $useCase) {
        if (empty($useCase['link'])) {
            continue;
        }

        $response = $this->get($useCase['link']);

        expect($response->getStatusCode())
            ->toBe(200, "{$useCase['slug']} links to {$useCase['link']}");
    }
})->with([[null]]);

it('keeps slugs unique and categories declared', function () {
    $slugs = array_column(UseCaseContent::all(), 'slug');
    expect($slugs)->toBe(array_unique($slugs));

    $declared = UseCaseContent::categories();

    foreach (UseCaseContent::all() as $useCase) {
        // A category that is not declared silently vanishes from the index:
        // the page groups BY the declared list, so the use case renders at
        // /use-cases/{slug} and is unreachable from the index.
        //
        // `toContain` is VARIADIC in Pest -- a second argument is another
        // expected element, not a failure message. Passing one here asserted
        // the category list contained the message string too.
        expect(in_array($useCase['category'], $declared, true))
            ->toBeTrue("{$useCase['slug']} has undeclared category [{$useCase['category']}]");
    }
});

it('states the problem before naming any solution', function () {
    // The editorial rule the page is built around. A problem section that opens
    // by naming the package is a feature list with a different heading, and the
    // reader who does not yet know they have the problem stops reading.
    foreach (UseCaseContent::all() as $useCase) {
        expect($useCase['problem'])->not->toContain('particle-academy/');
        expect(trim($useCase['problem']))->not->toBe('');
        expect($useCase['steps'])->not->toBeEmpty();
    }
});

it('every package link actually loads a page', function () {
    // Resolving in the registry is not the same as having a page. 27 of the 48
    // referenced packages are companions, and the question of whether
    // /packages/<companion> renders or 404s is answered by the router, not by
    // the registry -- so ask the router.
    $checked = [];
    $broken = [];

    foreach (UseCaseContent::all() as $useCase) {
        foreach ($useCase['packages'] as $slug) {
            if (isset($checked[$slug])) {
                continue;
            }

            $checked[$slug] = true;
            $status = $this->get("/packages/{$slug}")->getStatusCode();

            if ($status !== 200) {
                $broken[] = "/packages/{$slug} = {$status}";
            }
        }
    }

    expect($checked)->not->toBeEmpty();
    expect($broken)->toBe([]);
});

it('only tells people to install packages that actually exist', function () {
    // The highest-cost error on this page, and the one no other check can see.
    // Package names live inside `code` strings, so a typo is not a broken link
    // or a failed lookup -- it renders perfectly and fails on the reader's
    // machine, at the first command they run, in someone else's project.
    //
    // `fancy-cli` vs the blocked bare `fancy-ui`, and the `-php` / `-js` twin
    // suffixes, are exactly the kind of detail that gets recalled wrong.
    $src = file_get_contents(app_path('Support/UseCases/UseCaseContent.php'));
    preg_match_all('/(?:composer require|npm install)\s+(@?[a-z0-9\-\/]+)/', $src, $matches);

    $claimed = array_values(array_unique($matches[1]));
    expect($claimed)->not->toBeEmpty();

    $known = [];

    foreach ([...PackageRegistry::all(), ...PackageRegistry::companions()] as $package) {
        foreach (['npm', 'composer', 'package', 'install_name', 'name'] as $key) {
            if (! empty($package[$key]) && is_string($package[$key])) {
                $known[$package[$key]] = true;
            }
        }
    }

    $unknown = array_values(array_filter($claimed, fn (string $n) => ! isset($known[$n])));

    expect($unknown)->toBe([]);
});

it('is reachable from the top navigation', function () {
    // The nav is where this replaced Starter Kits; if the link is dropped the
    // pages still exist and nobody finds them.
    $layout = file_get_contents(resource_path('js/Pages/Layout.tsx'));

    expect($layout)->toContain('"/use-cases"');
});

/**
 * The richer template — screens and code samples.
 *
 * These pages exist to show someone what they are about to build, and the two
 * things that do that are the composed previews and real code. Both are keyed
 * or typed by strings in PHP that only mean something to React, which is the
 * classic silently-broken pairing: a `screens` key with no matching entry in
 * `screens.tsx` renders NOTHING, on a page that still returns 200 with a
 * perfectly good problem statement. Nobody notices until a reader does.
 */
it('names only screens the React registry actually implements', function () {
    // The registry is the source of truth; parse the keys straight out of it so
    // this cannot drift by being updated in one place.
    $registry = file_get_contents(resource_path('js/Pages/UseCases/screens.tsx'));
    preg_match_all('/^\s{4}"([a-z0-9-]+\/[a-z0-9-]+)":\s*\{/m', $registry, $m);
    $implemented = $m[1];

    expect($implemented)->not->toBeEmpty('parsed no screen keys — the regex no longer matches the registry');

    foreach (UseCaseContent::all() as $useCase) {
        foreach ($useCase['screens'] ?? [] as $key) {
            // NOT `toContain($key, $message)` -- Pest reads extra arguments as
            // further EXPECTED VALUES, so the message became a second thing the
            // array had to contain and the test failed on its own wording.
            expect(in_array($key, $implemented, true))->toBeTrue(
                "use case [{$useCase['slug']}] names screen [{$key}], which screens.tsx does not implement",
            );
        }
    }
});

it('gives every code sample a language and a label', function () {
    // An unlabelled sample renders as an anonymous block, and one with no
    // language renders unhighlighted — both look like a mistake to a reader
    // deciding whether this kit is worth their afternoon.
    foreach (UseCaseContent::all() as $useCase) {
        foreach ($useCase['code'] ?? [] as $i => $sample) {
            expect($sample)->toHaveKeys(['label', 'language', 'code'], "use case [{$useCase['slug']}] code sample #{$i}");
            expect(trim($sample['code']))->not->toBe('', "use case [{$useCase['slug']}] code sample #{$i} is empty");
            expect($sample['language'])->toBeIn(
                ['php', 'ts', 'tsx', 'js', 'jsx', 'bash', 'json', 'blade'],
                "use case [{$useCase['slug']}] code sample #{$i} has an unknown language",
            );
        }
    }
});

it('carries the richer fields through to the page', function () {
    $withScreens = collect(UseCaseContent::all())->first(fn ($u) => ! empty($u['screens']));

    expect($withScreens)->not->toBeNull('no use case has screens yet');

    $this->get("/use-cases/{$withScreens['slug']}")
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('UseCases/Show')
            ->has('useCase.screens')
            ->has('useCase.code')
        );
});

/**
 * SEO — these pages are the highest-INTENT content on the site.
 *
 * Someone searching "how do I build a storefront" is further down the funnel
 * than someone browsing packages, and every one of these pages shipped with the
 * generic baseline title, no description, no JSON-LD, and no sitemap entry at
 * all. That is exactly the defect already fixed once for /docs, repeated here
 * because nothing asserted it.
 *
 * All three failures are invisible from inside the app: the page renders
 * perfectly, and only a crawler ever notices.
 */
it('gives every use case a unique title and its own description', function () {
    $titles = [];

    foreach (UseCaseContent::all() as $useCase) {
        $html = $this->get("/use-cases/{$useCase['slug']}")->assertOk()->getContent();

        preg_match_all('#<title[^>]*>(.*?)</title>#s', $html, $m);

        // Exactly one. Two is the fancy-seo baseline fighting a raw <Head>,
        // which is the bug this replaced.
        expect($m[1])->toHaveCount(1, "use case [{$useCase['slug']}] rendered ".count($m[1]).' <title> tags');

        // Decode first: a title containing an apostrophe renders as `&#039;`,
        // so a raw string comparison fails on correct output.
        $title = trim(html_entity_decode($m[1][0], ENT_QUOTES | ENT_HTML5));
        // `toContain($needle, $message)` reads the message as a SECOND needle --
        // the same trap as the screens test above. Assert the boolean instead.
        expect(str_contains($title, $useCase['title']))->toBeTrue(
            "use case [{$useCase['slug']}] has a generic title: {$title}",
        );
        expect(in_array($title, $titles, true))->toBeFalse(
            "use case [{$useCase['slug']}] shares its title with another page",
        );
        $titles[] = $title;

        expect($html)->toContain('name="description"');
    }
});

it('emits HowTo structured data for a use case with steps', function () {
    $withSteps = collect(UseCaseContent::all())->first(fn ($u) => ! empty($u['steps']));

    $html = $this->get("/use-cases/{$withSteps['slug']}")->assertOk()->getContent();

    // These pages ARE numbered instructions, so HowTo is the accurate schema and
    // the one eligible for a how-to rich result.
    expect($html)->toContain('"@type":"HowTo"');
    expect($html)->toContain('"@type":"HowToStep"');
    expect($html)->toContain('"@type":"BreadcrumbList"');
});

/**
 * The CLIENT must agree with the server about the head.
 *
 * A bare `<Seo />` falls back to the provider's defaultTitle/description, so the
 * server sends the correct per-page head and hydration immediately replaces it
 * with the generic one. The server-HTML test above passes throughout — the only
 * places it shows are the browser tab and any crawler that executes JS.
 *
 * A rendering test cannot hydrate here, so assert the contract that makes them
 * agree: the page passes an explicit title through <Seo>, and the provider
 * template `%s — Fancy UI` turns it into exactly what the server emitted.
 */
it('passes an explicit title to <Seo> rather than relying on the defaults', function () {
    // Strip JSX comments first: these files DISCUSS `<Seo />` in prose
    // explaining why the bare form is wrong, and a scan over raw source counts
    // that explanation as the very thing it forbids.
    $strip = static fn (string $src): string => (string) preg_replace('/\{\/\*.*?\*\/\}/s', '', $src);

    $show = $strip(file_get_contents(resource_path('js/Pages/UseCases/Show.tsx')));
    $index = $strip(file_get_contents(resource_path('js/Pages/UseCases/Index.tsx')));

    foreach (['Show.tsx' => $show, 'Index.tsx' => $index] as $name => $source) {
        // Boolean assertions throughout: `toContain($needle, $message)` reads the
        // message as a SECOND needle, so the test fails on its own wording.
        expect(str_contains($source, '<Seo'))->toBeTrue("{$name} no longer renders <Seo>");
        expect((bool) preg_match('/<Seo\s*\/>/', $source))->toBeFalse(
            "{$name} renders a bare <Seo />, which resets the head to the provider defaults on hydration",
        );
        expect(str_contains($source, 'title='))->toBeTrue("{$name} passes no title to <Seo>");
    }

    // And the shape has to match the server's, or the title flips on hydration.
    expect($show)->toContain('— Use cases`');
});

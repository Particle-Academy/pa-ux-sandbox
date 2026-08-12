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

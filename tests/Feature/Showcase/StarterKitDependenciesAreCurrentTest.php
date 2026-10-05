<?php

use App\Http\Controllers\Showcase\StarterKitController;
use App\Http\Controllers\Showcase\StarterKitDownloadController;
use Tests\TestCase;

uses(TestCase::class);

/*
 * A downloaded starter kit installs the versions this app runs.
 *
 * ## Why this exists
 *
 * `StarterKitDownloadController` generates each kit's `package.json`, and its
 * dependency versions were written by hand. Its own docblock warned exactly what
 * that costs:
 *
 *     "on 0.x carets that matters, because `^0.N` never advances to `^0.N+1` —
 *      a stale pin here ships users an old (or vulnerable) release forever."
 *
 * The warning was correct and nothing enforced it. Measured 2026-10-04, every
 * one of the six had drifted, and none could self-heal because a caret on a 0.x
 * pins the minor:
 *
 *     fancy-flow        ^0.5.3  →  0.79.2      (74 minors)
 *     fancy-whiteboard  ^0.2.1  →  0.5.1
 *     fancy-query       ^0.5.0  →  0.8.0
 *     fancy-code        ^0.8.0  →  0.11.0
 *     fancy-sheets      ^0.9.0  →  0.11.0
 *     fancy-echarts     ^5.0.0  →  6.1.0       (a whole major)
 *
 * So anyone downloading a kit got a runnable project built on releases from
 * long before — while the page offering it described the current ones.
 *
 * ## Why it compares against THIS APP rather than the registry
 *
 * The showcase is dogfooded: a rule already requires it to take every
 * first-party release in the same session, and `kit:dogfood` enforces it. So its
 * `package.json` is a current, LOCAL, offline, deterministic source of truth.
 *
 * Asking npm instead would make this test need the network, make it flake, and
 * — worse — a failed lookup reads as "nothing to report". A check that turns
 * green when it cannot reach its source is the shape this estate keeps paying
 * for.
 */

it('generates kit dependencies from the versions this app installs', function () {
    $appDeps = json_decode(
        (string) file_get_contents(base_path('package.json')),
        true,
        512,
        JSON_THROW_ON_ERROR
    )['dependencies'] ?? [];

    expect(count($appDeps))->toBeGreaterThan(10,
        'the showcase declares almost no dependencies; this check would compare against nothing');

    $method = new ReflectionMethod(StarterKitDownloadController::class, 'extraDependencies');
    $controller = new StarterKitDownloadController;

    $visited = 0;
    $stale = [];

    foreach (StarterKitController::kits() as $kit) {
        /** @var array<string, string> $deps */
        $deps = $method->invoke($controller, $kit['slug']);

        foreach ($deps as $name => $version) {
            $visited++;

            // A dependency this app does not itself install cannot be checked
            // here, and silently skipping it is how a gap hides. Name it.
            // `array_key_exists`, not `toHaveKey`: that helper resolves its argument
            // as a path rather than a literal key, so a package name is not the
            // lookup you wrote. It reported `@particle-academy/fancy-query` absent
            // from an array that plainly contains it. Third assertion helper this
            // session to mean something other than it reads as.
            expect(array_key_exists($name, $appDeps))->toBeTrue(
                "kit '{$kit['name']}' ships {$name}, which the showcase does not install — "
                .'so nothing keeps its version current. Install it here, or drop it from the kit.');

            if ($appDeps[$name] !== $version) {
                $stale[] = "{$kit['slug']}: {$name} pinned {$version}, app runs {$appDeps[$name]}";
            }
        }
    }

    // Vacuity guard. If `extraDependencies` stops returning anything — renamed,
    // refactored, reached by a different path — every kit looks perfectly
    // current, which is the failure this file is about pointed at itself.
    expect($visited)->toBeGreaterThan(8,
        "only {$visited} kit dependencies were examined; the extraction is broken and a pass here would mean nothing");

    expect($stale)->toBe([], implode("\n", array_merge(
        ['These kits ship versions the showcase has moved past:', ''],
        array_map(fn (string $s): string => '  '.$s, $stale),
        [
            '',
            'A caret on a 0.x pins the MINOR, so these never self-heal — a downloaded',
            'kit installs them forever. Generate the version from the app\'s own',
            'package.json rather than writing it by hand.',
        ],
    )));
});

/*
 * The one above reads `extraDependencies` through reflection, which checks the
 * helper rather than the thing a consumer receives. This reads the GENERATED
 * ZIP, so the whole path — slug, dependency list, version lookup, package.json
 * assembly — is covered end to end.
 *
 * Worth having both: a helper can be right while nothing calls it, which is the
 * most common defect shape in this estate.
 */
it('ships those versions in the package.json a consumer actually downloads', function () {
    $appDeps = json_decode(
        (string) file_get_contents(base_path('package.json')),
        true,
        512,
        JSON_THROW_ON_ERROR
    )['dependencies'] ?? [];

    $checked = 0;
    $wrong = [];

    foreach (StarterKitController::kits() as $kit) {
        $response = $this->get("/starter-kits/{$kit['slug']}/download.zip");
        expect($response->getStatusCode())->toBe(200, "kit '{$kit['name']}' did not download");

        $zip = new ZipArchive;
        expect($zip->open($response->getFile()->getPathname()))->toBeTrue();

        /** @var array{dependencies?: array<string, string>} $manifest */
        $manifest = json_decode(
            (string) $zip->getFromName("{$kit['slug']}-starter/package.json"),
            true,
            512,
            JSON_THROW_ON_ERROR
        );
        $zip->close();

        foreach ($manifest['dependencies'] ?? [] as $name => $version) {
            // Only first-party and the libraries we pin for a kit are ours to
            // keep current; react/react-dom come from the template.
            if (! array_key_exists($name, $appDeps)) {
                continue;
            }

            $checked++;

            if ($appDeps[$name] !== $version) {
                $wrong[] = "{$kit['slug']}: {$name} shipped {$version}, app runs {$appDeps[$name]}";
            }
        }
    }

    expect($checked)->toBeGreaterThan(8,
        "only {$checked} shipped dependencies were comparable; the zips are not being read and a pass means nothing");

    expect($wrong)->toBe([], implode('
', array_merge(
        ['Downloaded kits carry versions this app has moved past:', ''],
        array_map(fn (string $w): string => '  '.$w, $wrong),
    )));
});

<?php

use App\Support\PackageRegistry;
use Tests\TestCase;

uses(TestCase::class);

/*
 * Every submodule that PUBLISHES a package must be in PackageRegistry.
 *
 * ## Why this is a test and not a convention
 *
 * There are two registries and they answer different questions.
 * `.gitmodules` / `project.json` answer *"does a fresh clone get this repo"*.
 * `PackageRegistry` answers *"does the kit list, serve and install this
 * package"*. A fix for one looks complete while leaving the other wrong, and
 * nothing reports the gap — because a package missing from PackageRegistry is
 * indistinguishable from one that was never built.
 *
 * It happened twice in two days:
 *
 * - **`fancy-grid`.** Commit 93da23a (2026-08-09) found it published, on disk
 *   and in the org but absent from the envelope, and fixed exactly that —
 *   `.gitmodules`, `project.json`, the submodule pointer. Three files. It never
 *   touched `PackageRegistry`, so `kit:status` could not see it, `/packages` did
 *   not list it and the MCP did not serve it, for sixteen days.
 *   That commit's own reasoning is the argument for this test: *"an untracked
 *   directory looks identical to one nobody has touched yet."*
 * - **`particle-academy/prism`**, found the day before, for the adjacent reason:
 *   it is a maintained FORK, so it did not look like a Fancy package and nobody
 *   added it at all.
 *
 * `PackageStatusTest` already fails a slug that is in BOTH `PLANNED` and `META`.
 * Being in NEITHER was unrepresentable — which is precisely why it happened
 * twice and why this exists.
 *
 * ## What it deliberately does NOT do
 *
 * It does not require every submodule to be registered. Plenty legitimately
 * publish nothing: the `.github` profile repo, the plugins, the apps. The test
 * keys on evidence of PUBLISHING — a manifest declaring a distribution name —
 * because that is the thing that makes absence from the registry consequential.
 */

/**
 * Every submodule path in `.gitmodules`, read rather than listed.
 *
 * A hand-maintained list here would be one more copy of the thing being
 * guarded, with the same failure mode — the exact defect this file is about.
 *
 * @return list<string>
 */
function submodulePaths(): array
{
    $gitmodules = base_path('../../.gitmodules');

    expect(file_exists($gitmodules))->toBeTrue(
        'Cannot find the envelope .gitmodules. This test asserts a relationship '.
        'between the envelope and this app; if the layout moved, fix the path — '.
        'a check that cannot find its input must fail, not skip.',
    );

    preg_match_all('/^\s*path\s*=\s*(.+)$/m', (string) file_get_contents($gitmodules), $matches);

    return array_map('trim', $matches[1]);
}

/**
 * The distribution this repo publishes, or null if it publishes nothing.
 *
 * Reads the manifests rather than guessing from the directory name: a repo
 * called `fancy-flow-py` publishes `fancy-flow`, and a repo may carry a
 * manifest that declares no name at all.
 */
function publishedDistribution(string $repoPath): ?string
{
    $package = $repoPath.'/package.json';
    if (is_file($package)) {
        $json = json_decode((string) file_get_contents($package), true);
        // `private: true` is the explicit way to say "not published".
        if (is_array($json) && ($json['private'] ?? false) !== true && is_string($json['name'] ?? null)) {
            return $json['name'];
        }
    }

    $composer = $repoPath.'/composer.json';
    if (is_file($composer)) {
        $json = json_decode((string) file_get_contents($composer), true);
        // A Laravel APP has a composer.json and publishes nothing; the marker is
        // its type, which is `project` rather than `library`.
        if (is_array($json) && ($json['type'] ?? 'library') !== 'project' && is_string($json['name'] ?? null)) {
            return $json['name'];
        }
    }

    $pyproject = $repoPath.'/pyproject.toml';
    if (is_file($pyproject) && preg_match('/^name\s*=\s*"([^"]+)"/m', (string) file_get_contents($pyproject), $m) === 1) {
        return $m[1];
    }

    return null;
}

it('registers every submodule that publishes a package', function () {
    $registered = array_column(PackageRegistry::everything(), 'slug');
    $planned = array_column(PackageRegistry::planned(), 'slug');
    $known = array_merge($registered, $planned);

    $unregistered = [];
    $checked = 0;

    foreach (submodulePaths() as $path) {
        $name = basename($path);
        $repo = base_path('../../'.$path);

        if (! is_dir($repo)) {
            continue; // a submodule nobody has initialised locally
        }

        $distribution = publishedDistribution($repo);
        if ($distribution === null) {
            continue; // publishes nothing — legitimately unregistered
        }

        $checked++;

        // Match on the SLUG, and also on the distribution name, because a repo
        // and its package often disagree: `fancy-flow-py` publishes
        // `fancy-flow`, `fancy-ui-cli` publishes `fancy-cli`.
        $isKnown = in_array($name, $known, true)
            || collect(PackageRegistry::everything())->contains(
                fn (array $pkg) => ($pkg['npm'] ?? null) === $distribution
                    || ($pkg['composer'] ?? null) === $distribution
                    || ($pkg['pypi'] ?? null) === $distribution
                    || ($pkg['name'] ?? null) === $distribution,
            );

        if (! $isKnown) {
            $unregistered[] = "{$name} (publishes {$distribution})";
        }
    }

    // The vacuity guard. A discovery that finds nothing passes the assertion
    // below and proves nothing — which is the same failure this test is about.
    expect($checked)->toBeGreaterThan(40, 'only checked '.$checked.' publishing submodules; discovery is broken');

    expect($unregistered)->toBe([], implode("\n", [
        'These submodules publish a package and appear in NO registry here:',
        '  '.implode("\n  ", $unregistered),
        '',
        'Add each to PackageRegistry (META + all()/companions()), or to PLANNED if it',
        'is decided-but-unbuilt. Unregistered, kit:status cannot see it, /packages does',
        'not list it and the MCP does not serve it — and nothing else reports that,',
        'because a package missing from the registry looks exactly like one that was',
        'never built.',
    ]));
});

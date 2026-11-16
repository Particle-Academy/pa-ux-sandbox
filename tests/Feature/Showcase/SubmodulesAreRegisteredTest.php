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
 *
 * ## Where it runs — group('envelope'), and why that is not a cop-out
 *
 * Its inputs live ABOVE this repo: the envelope's `.gitmodules`, and every
 * sibling submodule's manifest on disk. A single-repo checkout cannot see
 * either, so this test is excluded from this app's own CI
 * (`--exclude-group=envelope` in `.github/workflows/ci.yml`) and runs instead
 * from the envelope, where its inputs actually exist:
 * `Particle-Academy/fancy.agi` → `.github/workflows/submodule-registry.yml`.
 *
 * It still runs by default for anyone working inside the envelope — which is
 * everyone, since that is the only place this app is developed.
 *
 * **This exclusion is load-bearing. Do not "fix" CI by deleting the group.**
 * The test ran in CI for six days and failed every push, ~33 of them, for
 * exactly this reason; the failure was read as noise because sibling jobs
 * stayed green. Two earlier attempts to repair it in place do not work, and
 * both look plausible:
 *
 * - **Fetching the envelope's `.gitmodules` alone.** Not enough — the loop
 *   below also stats each submodule's manifest, so with no submodule
 *   directories `$checked` is 0 and the vacuity guard fails instead. It moves
 *   the red, it does not remove it.
 * - **Mirroring the "third-party allowlist" sparse-checkout in `ci.yml`.**
 *   That precedent works because `Particle-Academy/.github` is PUBLIC. The
 *   envelope is PRIVATE, this app is PUBLIC, and it holds no secrets — the
 *   default `GITHUB_TOKEN` cannot read the envelope at all.
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
        // its type, which is `project` rather than `library`. An ABANDONED package
        // (Composer's own field: a replacement name, or `true`) publishes no more
        // releases, so it needs no registry entry either.
        $abandoned = $json['abandoned'] ?? false;
        if (is_array($json) && ($abandoned === true || (is_string($abandoned) && $abandoned !== ''))) {
            return null;
        }
        if (is_array($json) && ($json['type'] ?? 'library') !== 'project' && is_string($json['name'] ?? null)) {
            return $json['name'];
        }
    }

    $pyproject = $repoPath.'/pyproject.toml';
    if (is_file($pyproject)) {
        $toml = (string) file_get_contents($pyproject);

        // Python's equivalent of `private: true`. PyPI REFUSES an upload
        // carrying this classifier, so it is a real safeguard and not just a
        // hint to this test. Without this branch the two other ecosystems had
        // a declarative way to say "publishes nothing" and Python did not, so
        // any repo with a pyproject was read as publishing — which is how a
        // deliberately unpublished local toolkit in the envelope failed a
        // registry check it was never meant to be subject to.
        if (preg_match('/["\']Private\s*::\s*Do Not Upload["\']/i', $toml) === 1) {
            return null;
        }

        if (preg_match('/^name\s*=\s*"([^"]+)"/m', $toml, $m) === 1) {
            return $m[1];
        }
    }

    return null;
}

/**
 * Whether a submodule directory publishing $distribution is in a registry.
 *
 * Built packages match on the SLUG, and also on the distribution name, because
 * a repo and its package often disagree: `fancy-flow-py` publishes
 * `fancy-flow`, `fancy-ui-cli` publishes `fancy-cli`.
 *
 * Planned packages match on the key and also on the repo's name. A planned key
 * is the package the repo WILL publish (`fancy-sign` for repo
 * `Particle-Academy/fancy-sign-php`), so the key alone never equals the
 * directory. The comparison ignores case, because GitHub does.
 *
 * @param  list<array<string, mixed>>  $everything  PackageRegistry::everything()
 * @param  list<array<string, mixed>>  $planned  PackageRegistry::planned()
 */
function submoduleIsRegistered(string $name, string $distribution, array $everything, array $planned): bool
{
    $known = array_merge(array_column($everything, 'slug'), array_column($planned, 'slug'));

    return in_array($name, $known, true)
        || collect($planned)->contains(
            fn (array $pkg) => strcasecmp(basename((string) ($pkg['repo'] ?? '')), $name) === 0,
        )
        || collect($everything)->contains(
            fn (array $pkg) => ($pkg['npm'] ?? null) === $distribution
                || ($pkg['composer'] ?? null) === $distribution
                || ($pkg['pypi'] ?? null) === $distribution
                || ($pkg['name'] ?? null) === $distribution,
        );
}

it('registers every submodule that publishes a package', function () {
    $everything = PackageRegistry::everything();
    $planned = PackageRegistry::planned();

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

        if (! submoduleIsRegistered($name, $distribution, $everything, $planned)) {
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
})->group('envelope');

/*
 * A PLANNED entry is keyed by the package it WILL publish, not by its repo,
 * by design: moving it to META later must not leave a stale planned twin
 * behind. So `fancy-sign` (repo Particle-Academy/fancy-sign-php) has a key
 * that never equals the directory `fancy-sign-php`, and matching planned
 * entries by key alone reported a registered package as unregistered on the
 * day its repo was created. A planned entry matches by its `repo` too.
 */
it('matches a planned entry by its repo as well as by its key', function () {
    $planned = [
        ['slug' => 'fancy-sign', 'name' => 'particle-academy/fancy-sign', 'repo' => 'Particle-Academy/fancy-sign-php'],
        ['slug' => 'fancy-sign-js', 'name' => '@particle-academy/fancy-sign', 'repo' => 'Particle-Academy/fancy-sign-js'],
    ];

    // By repo: the directory is the repo's name, the key is the package's.
    expect(submoduleIsRegistered('fancy-sign-php', 'particle-academy/fancy-sign', [], $planned))->toBeTrue();
    // By key, as before.
    expect(submoduleIsRegistered('fancy-sign-js', '@particle-academy/fancy-sign', [], $planned))->toBeTrue();
    // Still discriminates: a repo nothing plans is not matched by a neighbour.
    expect(submoduleIsRegistered('fancy-sign-py', 'fancy-sign', [], $planned))->toBeFalse();
    expect(submoduleIsRegistered('other-sign-php', 'particle-academy/other-sign', [], $planned))->toBeFalse();
});

/*
 * The escape hatches themselves, asserted directly.
 *
 * `publishedDistribution` is the whole discriminator: get it wrong in the
 * permissive direction and this file demands a registry entry for something
 * that is deliberately not part of the kit; get it wrong in the strict
 * direction and a real package goes unregistered while the suite stays green.
 * Both ways round are checked here, against manifests written for the purpose,
 * because the envelope's own submodules cannot exercise a case none of them
 * currently has.
 */
it('reads each ecosystem\'s declarative not-published marker', function () {
    $root = sys_get_temp_dir().'/submodule-marker-'.bin2hex(random_bytes(6));

    $write = function (string $name, string $file, string $body) use ($root): string {
        $dir = $root.'/'.$name;
        mkdir($dir, 0777, true);
        file_put_contents($dir.'/'.$file, $body);

        return $dir;
    };

    // Publishes: a plain manifest in each of the three ecosystems.
    expect(publishedDistribution($write('npm-pub', 'package.json', '{"name":"@scope/thing"}')))
        ->toBe('@scope/thing');
    expect(publishedDistribution($write('php-pub', 'composer.json', '{"name":"vendor/thing"}')))
        ->toBe('vendor/thing');
    expect(publishedDistribution($write('py-pub', 'pyproject.toml', "[project]\nname = \"thing\"\n")))
        ->toBe('thing');

    // Publishes nothing: each ecosystem's own way of saying so.
    expect(publishedDistribution($write('npm-priv', 'package.json', '{"name":"x","private":true}')))
        ->toBeNull();
    expect(publishedDistribution($write('php-app', 'composer.json', '{"name":"x/y","type":"project"}')))
        ->toBeNull();
    expect(publishedDistribution($write('py-priv', 'pyproject.toml',
        "[project]\nname = \"thing\"\nclassifiers = [\"Private :: Do Not Upload\"]\n")))
        ->toBeNull();

    // A repo with no manifest at all publishes nothing.
    expect(publishedDistribution($write('bare', 'README.md', '# nothing here')))->toBeNull();

    // Composer's own `abandoned` marker: a package that publishes no more releases
    // (fancy-chat-prism-php, merged into fancy-chat-php 0.2.0) needs no registry
    // entry. Both forms Composer accepts: a replacement name, or `true`.
    expect(publishedDistribution($write('php-abandoned', 'composer.json', '{"name":"vendor/old","abandoned":"vendor/new"}')))
        ->toBeNull();
    expect(publishedDistribution($write('php-abandoned-true', 'composer.json', '{"name":"vendor/old","abandoned":true}')))
        ->toBeNull();
    // ...but `abandoned: false`, or any other value, is still publishing.
    expect(publishedDistribution($write('php-not-abandoned', 'composer.json', '{"name":"vendor/live","abandoned":false}')))
        ->toBe('vendor/live');
})->group('envelope');

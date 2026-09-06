<?php

use Illuminate\Contracts\Console\Kernel;
use Tests\TestCase;

uses(TestCase::class);

/*
 * Every `php artisan <cmd>` this repo NAMES must be a command it HAS.
 *
 * ## Why a test rather than the audit that produced it
 *
 * The audit came first and found nothing: seven commands named in guards, all
 * seven real. Then a peer estate pointed out what that actually established —
 * the remedies were **correct by maintenance**, not by construction. They were
 * right that afternoon and nothing kept them right.
 *
 * Which is the same finding this file's neighbour makes about artifacts, and
 * the same one the kit keeps making about hand-kept mirrors. A hand audit is
 * BESIDE the path: it runs when somebody thinks to run it, which is never the
 * time a command gets renamed.
 *
 * The stakes are not "a guard prints a bad hint". `CompiledArtifactsAreCurrent`
 * tells you to run `php artisan readmes:build`; `kit:status` and `kit:dogfood`
 * are named in the envelope's AGENTS.md as the way to check the whole kit. A
 * remedy that does not work costs the reader the outage twice — once for the
 * failure and once for the advice.
 *
 * ## Why the pattern is narrow
 *
 * The audit's own grep produced a false positive — `composer forms`, which was
 * a test NAME in prose — and nearly got reported as a defect. A pattern loose
 * enough to find every remedy is loose enough to manufacture them. So this
 * matches `php artisan <namespace>:<command>` and nothing else: no bare
 * `php artisan`, no prose, no `composer <word>`.
 *
 * Signature-less commands (`migrate`, `test`, `serve`) are deliberately out of
 * scope — they are Laravel's, they are not going to be renamed by us, and
 * including them would mean matching any word after `artisan`, which is the
 * loose pattern this exists to avoid.
 */

/**
 * Every command this app registers.
 *
 * The console kernel is NOT bootstrapped in a feature test, so `Artisan::all()`
 * returns a partial set there and reports real commands as missing — which is
 * how the first version of this file failed on `registry:build`, a command that
 * plainly exists. Bootstrapping first is the difference between asking the app
 * and asking a half-built one.
 *
 * @return list<string>
 */
function registeredArtisanCommands(): array
{
    $kernel = app(Kernel::class);
    $kernel->bootstrap();

    return array_keys($kernel->all());
}

/**
 * Commands named in tracked files, with where each was found.
 *
 * @return array<string,list<string>>
 */
function namedArtisanCommands(): array
{
    // Walked in PHP rather than shelled out to `git grep`.
    //
    // The first version shelled out, and on Windows `exec` could not find git —
    // so the sweep returned ZERO files and every "no missing commands"
    // assertion below passed by checking nothing. The vacuity guard is the only
    // reason that surfaced as a failure instead of a green tick, which is the
    // entire argument for having one.
    $skip = ['vendor', 'node_modules', '.git', 'storage', 'public/build', 'bootstrap/cache'];
    $exts = ['php', 'md', 'yml', 'yaml', 'json', 'ts', 'tsx', 'js', 'mjs', 'sh', 'blade'];

    $found = [];
    $it = new RecursiveIteratorIterator(
        new RecursiveCallbackFilterIterator(
            new RecursiveDirectoryIterator(base_path(), FilesystemIterator::SKIP_DOTS),
            function (SplFileInfo $file) use ($skip): bool {
                $rel = str_replace(DIRECTORY_SEPARATOR, '/', substr($file->getPathname(), strlen(base_path()) + 1));
                foreach ($skip as $dir) {
                    if ($rel === $dir || str_starts_with($rel, $dir.'/')) {
                        return false;
                    }
                }

                return true;
            }
        )
    );

    foreach ($it as $file) {
        if (! $file->isFile() || ! in_array($file->getExtension(), $exts, true)) {
            continue;
        }

        $body = @file_get_contents($file->getPathname());
        if ($body === false) {
            continue;
        }

        if (! preg_match_all('/php artisan ([a-z][a-z0-9]*:[a-z][a-z0-9-]*)/', $body, $m)) {
            continue;
        }

        $rel = str_replace(DIRECTORY_SEPARATOR, '/', substr($file->getPathname(), strlen(base_path()) + 1));
        foreach ($m[1] as $command) {
            $found[$command][] = $rel;
        }
    }

    foreach ($found as $cmd => $files) {
        $found[$cmd] = array_values(array_unique($files));
    }

    ksort($found);

    return $found;
}

it('names only artisan commands that exist', function () {
    $named = namedArtisanCommands();

    // Vacuity: a sweep that matched nothing would satisfy every assertion below
    // by checking no files at all. This repo genuinely names a couple of dozen.
    expect(count($named))->toBeGreaterThan(10,
        'The sweep found almost no `php artisan <cmd>` references, which means the '
        .'pattern stopped matching rather than that the repo stopped naming commands.');

    $registered = registeredArtisanCommands();

    $missing = [];
    foreach ($named as $command => $files) {
        if (! in_array($command, $registered, true)) {
            $missing[] = sprintf('  %s — named in %s', $command, implode(', ', $files));
        }
    }

    expect($missing)->toBe([], implode("\n", [
        'These `php artisan` commands are NAMED in tracked files and do not exist:',
        '',
        ...$missing,
        '',
        'Either the command was renamed and its references were not, or the',
        'reference is a typo. Both publish advice that fails when followed —',
        'which costs a reader the outage twice, once for the failure and once',
        'for the remedy.',
    ]));
});

it('actually resolves the commands the guards tell you to run', function () {
    // The narrower claim the neighbouring guards depend on. If any of these
    // stops existing, a failing artifact test starts printing a remedy that
    // does nothing, and the reader has no way to know the hint is the problem.
    $loadBearing = [
        'registry:build',
        'readmes:build',
        'tui:build',
        'flow:build',
        'docs:snapshot',
        'kit:status',
        'kit:dogfood',
    ];

    $registered = registeredArtisanCommands();

    foreach ($loadBearing as $command) {
        // `toContain($a, $b)` asserts the array holds BOTH values — it takes
        // no message argument, so the first version was asserting the array
        // contained its own error string.
        expect(in_array($command, $registered, true))->toBeTrue(
            "`php artisan {$command}` is named as a remedy by a guard or by the envelope's "
            .'AGENTS.md, and no longer exists.');
    }
})->group('envelope');

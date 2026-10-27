<?php

use Symfony\Component\Finder\Finder;
use Tests\TestCase;

uses(TestCase::class);

/**
 * Nothing we serve types how many node kinds ship inside fancy-flow.
 *
 * The /flow page caption, two package blurbs, the MCP server instructions and
 * two docs pages all said "27". fancy-flow 0.81.0 ships 31: the four terminal
 * kinds were added and none of the six places was told. A typed count goes
 * stale silently, because a wrong number reads exactly like a right one.
 *
 * The /flow caption now reads `__FANCY_FLOW_CORE_KINDS__`, counted from the
 * installed engine at build time (see vite.config.js). PHP and Markdown cannot
 * read a build constant, so they name the kinds or say "the built-in kinds"
 * instead of a number.
 *
 * Frozen docs snapshots (`resources/docs/<version>/`) are excluded: they record
 * what was true when that line shipped, and are never edited.
 */
it('never types a fancy-flow core node kind count', function () {
    $patterns = [
        '/\b\d+\s+(?:core\s+|built-?in\s+)+(?:node\s+)?kinds\b/i',
        '/\b\d+\s+(?:core\s+)?builtins\b/i',
        '/builtins[^.]{0,60}?\b\d+\s+kinds\b/i',
    ];

    $files = Finder::create()->files()
        ->in([
            base_path('app'),
            resource_path('js/Pages'),
            resource_path('docs'),
        ])
        ->exclude(array_map(
            fn (string $dir): string => basename($dir),
            glob(resource_path('docs/*'), GLOB_ONLYDIR) ?: [],
        ))
        ->name(['*.php', '*.tsx', '*.ts', '*.md']);

    $visited = 0;
    $offenders = [];

    foreach ($files as $file) {
        $visited++;
        $contents = $file->getContents();

        foreach ($patterns as $pattern) {
            if (preg_match($pattern, $contents, $match)) {
                $offenders[] = $file->getRelativePathname().': "'.$match[0].'"';
            }
        }
    }

    // The vacuity guard: a scan that found no files found no offenders either.
    expect($visited)->toBeGreaterThan(100);

    expect($offenders)->toBe([], implode("\n", [
        'A typed fancy-flow core node kind count:',
        ...$offenders,
        '',
        'In TSX, read __FANCY_FLOW_CORE_KINDS__ (counted at build time from the installed engine).',
        'In PHP or Markdown, name the kinds or say "the built-in kinds" instead of a number.',
    ]));
});

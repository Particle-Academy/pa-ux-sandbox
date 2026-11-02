<?php

use Symfony\Component\Finder\Finder;
use Tests\TestCase;

uses(TestCase::class);

/**
 * fancy-flow 0.83.0 stopped reading these undocumented tokens, and no list ever
 * declared them, so a read here resolves to nothing or its fallback. The negative
 * lookahead keeps real tokens such as --ff-border-strong out of the match.
 */
it('reads no fancy-flow token that 0.83.0 removed', function (): void {
    $removed = '/--ff-(?:bg(?:-[0-9])?|fg-[0-9]|border-1|font-mono)(?![a-z0-9-])/';

    $files = Finder::create()
        ->files()
        ->in(resource_path('js'))
        ->in(resource_path('css'))
        ->name(['*.tsx', '*.ts', '*.css']);

    $visited = 0;
    $offenders = [];

    foreach ($files as $file) {
        $visited++;

        if (preg_match($removed, $file->getContents(), $match) === 1) {
            $offenders[] = $file->getRelativePathname().': '.$match[0];
        }
    }

    expect($visited)->toBeGreaterThan(100)
        ->and($offenders)->toBe([]);
});

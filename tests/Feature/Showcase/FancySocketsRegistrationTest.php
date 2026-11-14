<?php

use App\Support\PackageRegistry;
use Tests\TestCase;

uses(TestCase::class);

/*
 * CC-fancy-0041, owner approved 2026-11-14: a Pusher-protocol WebSockets
 * server. Moved out of PLANNED the day the repo was built. The npm name 404s
 * until the owner's first publish, so the entry is built but HIDDEN: no public
 * surface may offer an install for a name that does not resolve.
 * Design: .ai/plans/fancy-sockets.md.
 */
it('is built, no longer planned', function () {
    expect(PackageRegistry::PLANNED)->not->toHaveKey('fancy-sockets');

    $meta = (new ReflectionClass(PackageRegistry::class))->getConstant('META');
    expect($meta)->toHaveKey('fancy-sockets')
        ->and($meta['fancy-sockets']['ecosystem'])->toBe('ts')
        ->and($meta['fancy-sockets']['kind'])->toBe('headless');

    $row = collect(PackageRegistry::everything())->firstWhere('slug', 'fancy-sockets');
    expect($row)->not->toBeNull()
        ->and($row['name'])->toBe('@particle-academy/fancy-sockets')
        ->and($row['npm'])->toBe('@particle-academy/fancy-sockets')
        ->and($row['repo'])->toBe('Particle-Academy/fancy-sockets');
});

it('stays off every public listing until its npm name resolves', function () {
    expect(PackageRegistry::isHidden('fancy-sockets'))->toBeTrue();
    $public = collect(PackageRegistry::all())->merge(PackageRegistry::companions())->pluck('slug');
    expect($public)->not->toContain('fancy-sockets');
    expect(PackageRegistry::findAny('fancy-sockets'))->toBeNull();
    $this->get('/packages/fancy-sockets')->assertNotFound();
});

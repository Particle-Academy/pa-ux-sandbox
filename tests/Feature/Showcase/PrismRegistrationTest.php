<?php

use App\Support\PackageRegistry;
use Tests\TestCase;

uses(TestCase::class);

/*
 * `particle-academy/prism` must stay registered.
 *
 * It is a MAINTAINED FORK rather than a package we authored, and that is
 * precisely how it went missing: it does not look like a Fancy package, so
 * nobody added it, and it was published, consumed and released for months
 * while appearing in no registry of ours. `kit:status` could not see it,
 * `/packages` did not list it, the MCP did not serve it.
 *
 * The cost was not cosmetic. Nothing tracked the package, so nothing tracked
 * what the package depended on — and a provider inside it turned out to be
 * five weeks from a vendor deprecation that no surface here could have
 * surfaced. It was found because a consumer asked an unrelated question.
 *
 * Same shape as the two failures the registration rule already exists for:
 * `fancy-trading`, where six approved packages were never started and nothing
 * said so, and `HIDDEN`, which hid four packages that had already shipped.
 * Both were a claim about a registry that nothing re-checked.
 *
 * So this test is the re-check. A future tidy-up that removes the fork on the
 * grounds that it "isn't really ours" reintroduces the exact blind spot, and
 * would do it for a reason that sounds principled.
 */

it('keeps the prism fork in the registry', function () {
    $prism = PackageRegistry::findAny('prism');

    expect($prism)->not->toBeNull(
        'particle-academy/prism is published, consumed and maintained by us. Unregistered, '.
        'kit:status cannot see it and nothing tracks its releases — which is how a five-week '.
        'vendor deprecation inside it went unnoticed.',
    );

    expect($prism['composer'])->toBe('particle-academy/prism');
    expect($prism['packagist'])->toBe('particle-academy/prism');
    expect($prism['repo'])->toBe('Particle-Academy/prism');
    expect($prism['language'])->toBe('PHP');
});

it('does not hide it, and does not leave it stranded in PLANNED', function () {
    // Registered-but-hidden is the `HIDDEN` failure: a live package invisible
    // to every surface on the strength of a stale claim.
    expect(PackageRegistry::isHidden('prism'))->toBeFalse();

    // Registered-but-planned is the other direction — a shipped package still
    // described as future work. `PackageStatusTest` fails a slug in both, and
    // this asserts the specific one that matters here.
    $planned = array_column(PackageRegistry::planned(), 'slug');
    expect($planned)->not->toContain('prism');
});

it('is reachable from the surfaces that had been blind to it', function () {
    // The point of registering was not the entry — it was these three.
    $everything = array_column(PackageRegistry::everything(), 'slug');
    expect($everything)->toContain('prism');

    // `all()` + `companions()` is what /packages and the MCP mirror read. A
    // package present in META but absent from both is registered in name only.
    $listed = array_merge(
        array_column(PackageRegistry::all(), 'slug'),
        array_column(PackageRegistry::companions(), 'slug'),
    );
    expect($listed)->toContain('prism');
});

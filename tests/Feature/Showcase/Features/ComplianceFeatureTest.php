<?php

use App\Support\FeatureSites;
use App\Support\PackageFamily;
use Tests\TestCase;

uses(TestCase::class);

/*
 * /features/compliance: consent (fancy-compliance + fancy-compliance-ui).
 * Bot protection moved to /features/security on 2026-11-13 (owner: "Features
 * are about features, not just specific packages"); SecurityFeatureTest owns
 * the captcha route and demo now.
 *
 * PHP cannot render the React page, so this pins what the server sends (the
 * members, through their families) and the page source: real components,
 * demos that never post a consent decision, and each shipped capability the
 * page promotes.
 */

const COMPLIANCE_DIR = 'resources/js/Pages/Features/Compliance';

function compliancePage(TestCase $test): array
{
    $html = $test->get('/features/compliance')->assertOk()->getContent();
    preg_match('#<script data-page="app" type="application/json">(.*?)</script>#s', $html, $page);

    return json_decode($page[1] ?? '{}', true) ?? [];
}

/** @return array<string, string> */
function complianceSources(): array
{
    $files = [];
    foreach (glob(base_path(COMPLIANCE_DIR.'/*')) ?: [] as $path) {
        $files[basename($path)] = (string) file_get_contents($path);
    }

    return $files;
}

it('serves the Compliance page with the consent family, from the registry', function () {
    $page = compliancePage($this);
    $members = collect($page['props']['feature']['members'] ?? []);

    expect($page['component'] ?? null)->toBe('Features/Compliance/Index')
        ->and($members->pluck('slug')->all())->toBe(['fancy-compliance', 'fancy-compliance-ui'])
        ->and($page['props']['feature']['languages'])->toBe(['PHP', 'React'])
        ->and($page['props']['feature']['course'])->toBeNull();
});

it('includes every consent family in the registry', function () {
    // The owner asked for a page "promoting all of our compliance based
    // packages": a new consent family must not be left off it silently.
    $families = collect(PackageFamily::all())->pluck('slug')
        ->filter(fn (string $slug): bool => (bool) preg_match('/complian|consent/', $slug))
        ->values()->all();

    expect($families)->not->toBeEmpty();
    foreach ($families as $family) {
        expect(FeatureSites::find('compliance')['memberSlugs'])->toContain(...PackageFamily::memberSlugsOf($family));
    }
});

it('hands bot protection to Security cleanly', function () {
    // Moved, not duplicated: no captcha member, demo or route here, and the old
    // #captcha anchor still lands somewhere useful.
    expect(FeatureSites::find('compliance')['memberSlugs'])->not->toContain('fancy-captcha')
        ->and(FeatureSites::find('compliance')['memberSlugs'])->not->toContain('fancy-captcha-ui')
        ->and(complianceSources())->not->toHaveKey('CaptchaDemo.tsx')
        ->and(app('router')->getRoutes()->getByName('features.compliance.captcha'))->toBeNull()
        ->and(complianceSources()['Index.tsx'])->toContain('id="captcha"', 'href="/features/security#captcha"')
        ->and(complianceSources()['compliance.css'])->not->toContain('captcha');
});

it('runs the real components and never posts a consent decision', function () {
    $sources = complianceSources();
    $all = implode("\n", $sources);

    expect($all)->toContain('from "@particle-academy/fancy-compliance-ui"')
        ->and($all)->toContain('from "@particle-academy/agent-integrations/dom-navigation"')
        ->and($all)->toContain('<ConsentBanner', '<ConsentPreferences', '<ConsentPreferencesTrigger', '<ConsentGate')
        // A demo decision is not the visitor's consent to this site.
        ->and($all)->not->toContain('useConsentController')
        ->and($all)->not->toContain('/fancy-compliance/consent')
        ->and($all)->not->toContain('TODO');
});

it('promotes each shipped capability the owner listed', function () {
    $sources = complianceSources();
    $all = implode("\n", $sources);

    expect($sources['Index.tsx'])
        ->toContain('<DemoFrame', '<FeatureTour', '<HowItFits', '<InstallSteps', '<PackagesGrid', '<FeatureCta')
        ->toContain('Per-category consent', 'An append-only consent record', 'Withdrawal, and re-consent', 'Styled to your app')
        ->toContain('data-agent-off-limits="consent"', 'agent-integrations 0.58.0')
        ->not->toContain('Bot protection for forms');
    // Variants and theme tokens are live controls, not only prose.
    expect($sources['ConsentDemo.tsx'])->toContain('"bar"', '"card"', '"corner"', 'cmp-theme--');
    expect($sources['compliance.css'])->toContain('--fancy-surface:', '--fancy-text:');
    // reserveSpace and the variable it publishes, demonstrated on the live document.
    expect($sources['ReserveSpaceDemo.tsx'])->toContain('reserveSpace', 'CONSENT_BANNER_SPACE_VARS.bottom');
    // The agent fence is exercised by the real walker, not described only.
    expect($sources['AgentFenceDemo.tsx'])->toContain('createDomNavigationAgent', '.click(FENCE_ACCEPT_HANDLE)');
});

it('imports only packages the showcase installs', function () {
    $dependencies = array_keys(json_decode((string) file_get_contents(base_path('package.json')), true)['dependencies'] ?? []);
    preg_match_all('#from\s*"(@particle-academy/[a-z0-9-]+)#', implode("\n", complianceSources()), $imports);

    foreach (array_unique($imports[1]) as $package) {
        expect($dependencies)->toContain($package);
    }
});

<?php

use App\Support\FeatureSites;
use App\Support\PackageFamily;
use App\Support\PackageRegistry;
use FancyCaptcha\Facades\Captcha;
use Tests\TestCase;

uses(TestCase::class);

/*
 * /features/compliance: consent (fancy-compliance + fancy-compliance-ui) and
 * bot protection (fancy-captcha + fancy-captcha-ui).
 *
 * PHP cannot render the React page, so this pins what the server sends (the
 * members, through their families), the live captcha route behind the real
 * middleware, and the page source: real components, demos that never post a
 * consent decision, and each shipped capability the page promotes.
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

it('serves the Compliance page with both families, from the registry', function () {
    $page = compliancePage($this);
    $members = collect($page['props']['feature']['members'] ?? []);

    expect($page['component'] ?? null)->toBe('Features/Compliance/Index')
        ->and($members->pluck('slug')->all())->toBe(['fancy-compliance', 'fancy-compliance-ui', 'fancy-captcha', 'fancy-captcha-ui'])
        ->and($page['props']['feature']['languages'])->toBe(['PHP', 'React'])
        ->and($page['props']['feature']['course'])->toBeNull()
        ->and($members->firstWhere('slug', 'fancy-captcha')['install'])->toBe('composer require '.PackageRegistry::findAny('fancy-captcha')['composer']);
});

it('includes every consent or captcha family in the registry', function () {
    // The owner asked for a page "promoting all of our compliance based
    // packages": a new consent family must not be left off it silently.
    $families = collect(PackageFamily::all())->pluck('slug')
        ->filter(fn (string $slug): bool => (bool) preg_match('/complian|consent|captcha/', $slug))
        ->values()->all();

    expect($families)->not->toBeEmpty();
    foreach ($families as $family) {
        expect(FeatureSites::familyReferences())->toContain($family);
    }
});

it('shares the captcha props the demo renders from, with proof-of-work on', function () {
    $page = compliancePage($this);
    $captcha = $page['props']['fancyCaptcha'] ?? null;

    expect($captcha)->toBeArray()
        ->and($captcha['provider'])->toBe('builtin')
        ->and($captcha['pow']['enabled'])->toBeTrue()
        ->and($captcha['pow']['challengeUrl'])->toBe('/fancy-captcha/challenge')
        ->and($captcha['started'])->toBeString()->not->toBe('');
});

it('refuses a demo submission that carries no captcha fields', function () {
    $this->from('/features/compliance')
        ->post('/features/compliance/captcha', ['message' => 'hello'])
        ->assertRedirect('/features/compliance')
        ->assertSessionHasErrors('captcha');
});

it('passes a demo submission the verifier accepts, under the demo action', function () {
    $fake = Captcha::fake();

    $this->from('/features/compliance')
        ->post('/features/compliance/captcha', ['message' => 'hello'])
        ->assertRedirect('/features/compliance')
        ->assertSessionHasNoErrors();

    $fake->assertVerified('feature-demo');
});

it('uses the same action in the component as on the route', function () {
    $route = app('router')->getRoutes()->getByName('features.compliance.captcha');

    expect($route->gatherMiddleware())->toContain('captcha:feature-demo')
        ->and(complianceSources()['CaptchaDemo.tsx'])->toContain('CAPTCHA_DEMO_ACTION = "feature-demo"');
});

it('runs the real components and never posts a consent decision', function () {
    $sources = complianceSources();
    $all = implode("\n", $sources);

    expect($all)->toContain('from "@particle-academy/fancy-compliance-ui"')
        ->and($all)->toContain('from "@particle-academy/fancy-captcha-ui"')
        ->and($all)->toContain('from "@particle-academy/agent-integrations/dom-navigation"')
        ->and($all)->toContain('<ConsentBanner', '<ConsentPreferences', '<ConsentPreferencesTrigger', '<ConsentGate', '<Captcha')
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
        ->toContain('Bot protection for forms');
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

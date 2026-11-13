<?php

use App\Support\FeatureSites;
use App\Support\PackageRegistry;
use FancyCaptcha\Facades\Captcha;
use Tests\TestCase;

uses(TestCase::class);

/*
 * /features/security: every security-shaped capability in the kit, across
 * packages (owner, 2026-11-13). Passkeys, the captcha (moved here from
 * Compliance) and security.txt.
 *
 * Only PUBLISHED packages are members. The planned service tokens and request
 * guards wait in FeatureSites `whenPublished` and must not reach this page,
 * its members, or its copy until the registry resolves them.
 */

const SECURITY_DIR = 'resources/js/Pages/Features/Security';

function securityPage(TestCase $test): array
{
    $html = $test->get('/features/security')->assertOk()->getContent();
    preg_match('#<script data-page="app" type="application/json">(.*?)</script>#s', $html, $page);

    return json_decode($page[1] ?? '{}', true) ?? [];
}

/** @return array<string, string> */
function securitySources(): array
{
    $files = [];
    foreach (glob(base_path(SECURITY_DIR.'/*')) ?: [] as $path) {
        $files[basename($path)] = (string) file_get_contents($path);
    }

    return $files;
}

it('serves the Security page with passkeys, captcha and security.txt, from the registry', function () {
    $page = securityPage($this);
    $slugs = collect($page['props']['feature']['members'] ?? [])->pluck('slug')->all();

    expect($page['component'] ?? null)->toBe('Features/Security/Index')
        ->and($slugs)->toBe([
            'fancy-passkeys', 'fancy-passkeys-js', 'fancy-passkeys-ui',
            'fancy-captcha', 'fancy-captcha-ui',
            'fancy-x-files', 'fancy-x-files-js', 'fancy-x-files-ui',
        ])
        ->and(collect($page['props']['feature']['bridges'])->pluck('name')->all())->toBe(['registerPasskeyBridge']);
});

it('lists only installable packages, and holds the planned ones back', function () {
    $members = FeatureSites::find('security')['memberSlugs'];

    foreach ($members as $slug) {
        $record = PackageRegistry::findAny($slug);
        expect($record)->not->toBeNull()
            ->and(PackageRegistry::isHidden($slug))->toBeFalse()
            ->and(array_key_exists($slug, PackageRegistry::PLANNED))->toBeFalse("{$slug} is planned, so it must not be advertised");
    }

    // The data hook for the packages that will join (CC-fancy-0030, CC-fancy-0031).
    expect(FeatureSites::whenPublished()['security'] ?? [])
        ->toContain('fancy-service-token', 'fancy-http-guard');

    // The page copy names none of them while they are planned.
    $all = implode('
', securitySources());
    foreach (FeatureSites::whenPublished()['security'] as $slug) {
        if (array_key_exists($slug, PackageRegistry::PLANNED)) {
            expect($all)->not->toContain($slug);
        }
    }
    expect($all)->not->toContain('service token')
        ->and($all)->not->toContain('request guard');
});

it('does not advertise signing, which belongs under Documents', function () {
    expect(implode('
', securitySources()))->not->toContain('fancy-sign');
});

it('shares the captcha props the demo renders from, with proof-of-work on', function () {
    $captcha = securityPage($this)['props']['fancyCaptcha'] ?? null;

    expect($captcha)->toBeArray()
        ->and($captcha['provider'])->toBe('builtin')
        ->and($captcha['pow']['enabled'])->toBeTrue()
        ->and($captcha['pow']['challengeUrl'])->toBe('/fancy-captcha/challenge')
        ->and($captcha['started'])->toBeString()->not->toBe('');
});

it('refuses a demo submission that carries no captcha fields', function () {
    $this->from('/features/security')
        ->post('/features/security/captcha', ['message' => 'hello'])
        ->assertRedirect('/features/security')
        ->assertSessionHasErrors('captcha');
});

it('passes a demo submission the verifier accepts, under the demo action', function () {
    $fake = Captcha::fake();

    $this->from('/features/security')
        ->post('/features/security/captcha', ['message' => 'hello'])
        ->assertRedirect('/features/security')
        ->assertSessionHasNoErrors();

    $fake->assertVerified('feature-demo');
});

it('uses the same action and URL in the component as on the route', function () {
    $route = app('router')->getRoutes()->getByName('features.security.captcha');

    expect($route)->not->toBeNull()
        ->and($route->gatherMiddleware())->toContain('captcha:feature-demo')
        ->and('/'.$route->uri())->toBe('/features/security/captcha')
        ->and(securitySources()['CaptchaDemo.tsx'])->toContain('CAPTCHA_DEMO_ACTION = "feature-demo"')
        ->and(securitySources()['CaptchaDemo.tsx'])->toContain('CAPTCHA_DEMO_URL = "/features/security/captcha"');
});

it('runs the real components, and completes no passkey ceremony', function () {
    $sources = securitySources();
    $all = implode('
', $sources);

    expect($all)->toContain('from "@particle-academy/fancy-passkeys-ui"')
        ->and($all)->toContain('from "@particle-academy/fancy-captcha-ui"')
        ->and($all)->toContain('<PasskeyManager', '<PasskeyStatus', '<Captcha')
        ->and($sources['Index.tsx'])->toContain('<DemoFrame', '<FeatureTour', '<HowItFits', '<InstallSteps', '<PackagesGrid', '<FeatureCta')
        ->and($sources['Index.tsx'])->toContain('id="passkeys"', 'id="captcha"', 'security.txt (RFC 9116)')
        // A demo never signs anyone in: no ceremony helper is called here.
        ->and($all)->not->toContain('authenticateWithPasskey(')
        ->and($all)->not->toContain('registerPasskey(')
        ->and($all)->not->toContain('TODO');
});

it('imports only packages the showcase installs', function () {
    $dependencies = array_keys(json_decode((string) file_get_contents(base_path('package.json')), true)['dependencies'] ?? []);
    preg_match_all('#from "(@particle-academy/[a-z0-9-]+)#', implode('
', securitySources()), $imports);

    expect($imports[1])->not->toBeEmpty();
    foreach (array_unique($imports[1]) as $package) {
        expect($dependencies)->toContain($package);
    }
});

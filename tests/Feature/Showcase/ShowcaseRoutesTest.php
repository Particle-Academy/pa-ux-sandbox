<?php

use App\Http\Controllers\Showcase\StarterKitController;
use App\Support\PackageRegistry;
use Illuminate\Support\Facades\URL;
use Tests\TestCase;

uses(TestCase::class);

it('renders the showcase home', function () {
    $response = $this->get('/');
    $response->assertOk();
    // Inertia's initial visit returns HTML with a data-page attribute carrying the page name.
    $response->assertSee('"component":"Home"', escape: false);
});

it('renders the agent playground', function () {
    $response = $this->get('/agent-playground');
    $response->assertOk();
    $response->assertSee('"component":"AgentPlayground"', escape: false);
});

it('renders the Fancy TUI dual-surface showcase', function () {
    $response = $this->get('/fancy-tui');

    $response->assertOk();
    $response->assertSee('"component":"FancyTui\\/Index"', escape: false);
});

it('renders the packages index', function () {
    $this->get('/packages')->assertOk();
});

it('renders the starter-kits index', function () {
    $this->get('/starter-kits')->assertOk();
});

it('renders the dreaming gallery', function () {
    $this->get('/dreaming')->assertOk();
});

it('renders the archived dreams page', function () {
    $this->get('/dreaming/archived')->assertOk();
});

it('renders the leaderboard', function () {
    $this->get('/leaderboard')->assertOk();
});

it('renders the showcase index', function () {
    $this->get('/showcase')->assertOk();
});

it('shows a package detail page', function () {
    $first = PackageRegistry::all()[0];
    $this->get("/packages/{$first['slug']}")->assertOk();
});

it('shows a component detail page', function () {
    $first = PackageRegistry::all()[0];
    $comp = $first['components'][0]['slug'];
    $this->get("/packages/{$first['slug']}/{$comp}")->assertOk();
});

it('404s on an unknown package', function () {
    $this->get('/packages/does-not-exist')->assertNotFound();
});

it('404s on an unknown component', function () {
    $first = PackageRegistry::all()[0];
    $this->get("/packages/{$first['slug']}/does-not-exist")->assertNotFound();
});

it('rejects unauthenticated showcase submission', function () {
    $this->get('/showcase/submit')->assertRedirect('/login');
});

it('generates https submission URLs under a forced scheme (proxy mixed-content guard)', function () {
    // Reproduces the production condition: behind Forge's TLS proxy the request
    // looks like http, but URL generation must stay https or the browser blocks
    // the showcase-submission redirect to ".../installed" as mixed content.
    config(['app.url' => 'https://ui.particle.academy']);
    URL::forceScheme('https');

    expect(route('showcase.showcase.installed', ['submission' => 1]))->toStartWith('https://');
});

it('shows every starter kit detail page', function (array $kit) {
    $this->get("/starter-kits/{$kit['slug']}")->assertOk();
})->with(fn () => array_map(fn ($k) => [$k], StarterKitController::kits()));

it('404s on an unknown starter kit', function () {
    $this->get('/starter-kits/does-not-exist')->assertNotFound();
});

it('serves the leaderboard contributors json feed (fancy-query refetch)', function () {
    $this->getJson('/api/leaderboard/contributors')
        ->assertOk()
        ->assertJson(['scope' => 'all_time', 'snapshot' => null, 'rows' => []]);

    $this->getJson('/api/leaderboard/contributors?scope=last_30_days')
        ->assertOk()
        ->assertJsonPath('scope', 'last_30_days');

    // Unknown scope falls back to all_time, never errors.
    $this->getJson('/api/leaderboard/contributors?scope=bogus')
        ->assertOk()
        ->assertJsonPath('scope', 'all_time');
});

/**
 * Guards the download-zip dependency bug: a kit's bundled package.json must
 * list every @particle-academy package its Kit.tsx imports, at the current
 * (non-stale) major, or `npm install` breaks for whoever downloads it.
 */
it('bundles every imported package into the download zip', function (array $kit) {
    $slug = $kit['slug'];

    $response = $this->get("/starter-kits/{$slug}/download.zip");
    $response->assertOk();
    $response->assertHeader('content-type', 'application/zip');

    // Capture the streamed binary file response.
    ob_start();
    $response->baseResponse->sendContent();
    $bytes = ob_get_clean();

    $tmp = tempnam(sys_get_temp_dir(), 'kit-test-');
    file_put_contents($tmp, $bytes);
    $zip = new ZipArchive;
    expect($zip->open($tmp))->toBeTrue();

    $root = "{$slug}-starter/";
    $pkgJson = json_decode($zip->getFromName($root.'package.json'), true);
    $kitSrc = $zip->getFromName($root.'src/Kit.tsx');
    $zip->close();
    @unlink($tmp);

    $deps = array_keys(array_merge(
        $pkgJson['dependencies'] ?? [],
        $pkgJson['devDependencies'] ?? [],
    ));

    /*
     * react-fancy must match what THIS APP installs — not a major written here.
     *
     * This assertion used to read `->toStartWith('^4')`, under the comment
     * "must be current-major, never the long-stale ^3". So a previous stale-kit
     * incident was fixed by hardcoding the next literal, and the guard then held
     * the kits at 4 for as long as 4 was written here: by 2026-10-04 the app was
     * on 5.33.0 and every downloaded kit still installed react-fancy 4, with
     * this check green the entire time.
     *
     * A check written against a literal stops being protection the moment the
     * right answer moves, and quietly becomes the thing enforcing the staleness.
     * Comparing against the app cannot freeze, because the app is kept current by
     * the dogfood rule.
     */
    $appVersion = json_decode(
        (string) file_get_contents(base_path('package.json')),
        true,
        512,
        JSON_THROW_ON_ERROR
    )['dependencies']['@particle-academy/react-fancy'] ?? '';

    expect($appVersion)->not->toBe('', 'the showcase does not install react-fancy; nothing to compare against');
    expect($pkgJson['dependencies']['@particle-academy/react-fancy'] ?? '')->toBe($appVersion);

    // Every @particle-academy/* the kit imports must be a declared dependency.
    preg_match_all('#@particle-academy/[a-z0-9-]+#', $kitSrc, $m);
    foreach (array_unique($m[0]) as $imported) {
        // Strip subpath imports like @particle-academy/react-fancy/icons.
        expect($deps)->toContain($imported);
    }
})->with(fn () => array_map(fn ($k) => [$k], StarterKitController::kits()));

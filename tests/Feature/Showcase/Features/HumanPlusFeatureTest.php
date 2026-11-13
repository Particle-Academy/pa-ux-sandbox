<?php

use App\Support\FeatureSites;
use Tests\TestCase;

uses(TestCase::class);

/*
 * /features/human-plus: the suite's headline capability, listed FIRST in the
 * Features menu. Humans and agents share one UI and trade control through MCP
 * bridges (docs/human-plus-ux.md).
 *
 * The bridge list is data in FeatureSites. It is checked here against the
 * INSTALLED agent-integrations package, both ways: a bridge the package exports
 * and the page omits fails, and so does one the page names that the package
 * does not export. A hand list with nothing checking it is how the CLAUDE.md
 * table came to say 21 bridges while the package shipped 24.
 */

const HUMAN_PLUS_DIR = 'resources/js/Pages/Features/HumanPlus';

function humanPlusPage(TestCase $test): array
{
    $html = $test->get('/features/human-plus')->assertOk()->getContent();
    preg_match('#<script data-page="app" type="application/json">(.*?)</script>#s', $html, $page);

    return json_decode($page[1] ?? '{}', true) ?? [];
}

/** @return array<string, string> */
function humanPlusSources(): array
{
    $files = [];
    foreach (glob(base_path(HUMAN_PLUS_DIR.'/*')) ?: [] as $path) {
        $files[basename($path)] = (string) file_get_contents($path);
    }

    return $files;
}

/** @return array<string, mixed> */
function agentIntegrationsPackage(): array
{
    $path = base_path('node_modules/@particle-academy/agent-integrations/package.json');
    expect(is_file($path))->toBeTrue('agent-integrations is not installed; run npm install before the suite');

    return json_decode((string) file_get_contents($path), true);
}

it('is the first Feature, in the nav and on the index', function () {
    expect(FeatureSites::slugs()[0])->toBe('human-plus');

    $index = $this->get('/features')->assertOk()->getContent();
    preg_match('#<script data-page="app" type="application/json">(.*?)</script>#s', $index, $page);
    $props = json_decode($page[1] ?? '{}', true)['props'] ?? [];

    expect($props['features'][0]['slug'] ?? null)->toBe('human-plus')
        ->and($props['features'][0]['name'] ?? null)->toBe('Human+')
        ->and($props['sites'][0]['slug'] ?? null)->toBe('human-plus');
});

it('serves the page with the shared-control packages, cross-listing the CMS', function () {
    $page = humanPlusPage($this);
    $slugs = collect($page['props']['feature']['members'] ?? [])->pluck('slug')->all();

    expect($page['component'] ?? null)->toBe('Features/HumanPlus/Index')
        ->and($slugs)->toContain('agent-integrations', 'fancy-auto-common', 'fancy-diff', 'fancy-pixel', 'fancy-cf-relay', 'fancy-cms', 'fancy-cms-ui', 'charlotte')
        ->and(FeatureSites::find('cms')['memberSlugs'])->toContain('fancy-cms', 'fancy-cms-ui');
});

it('names every bridge the installed agent-integrations exports, and no other', function () {
    $exported = collect(array_keys(agentIntegrationsPackage()['exports']))
        ->filter(fn (string $key): bool => str_starts_with($key, './bridges/'))
        ->map(fn (string $key): string => '@particle-academy/agent-integrations/'.substr($key, 2))
        ->sort()->values()->all();

    $listed = collect(FeatureSites::find('human-plus')['bridges'])->pluck('import')->sort()->values()->all();

    expect($exported)->not->toBeEmpty()
        ->and($listed)->toBe($exported);
});

it('names each bridge by the function its subpath really exports', function () {
    foreach (FeatureSites::find('human-plus')['bridges'] as $bridge) {
        $sub = substr($bridge['import'], strlen('@particle-academy/agent-integrations/bridges/'));
        $types = base_path("node_modules/@particle-academy/agent-integrations/dist/bridges/{$sub}.d.ts");

        expect(is_file($types))->toBeTrue("no type file for bridges/{$sub}")
            // `(` or `<`: registerDocBridge is generic.
            ->and((string) file_get_contents($types))->toMatch('/function '.preg_quote($bridge['name'], '/').'[(<]/')
            ->and($bridge['tools'])->not->toBe('');
    }
});

it('explains On-The-Fly UI without claiming storage that does not exist', function () {
    $index = humanPlusSources()['Index.tsx'];

    // What is true at fancy-cms 0.9.1 and charlotte 0.3.0: the page is JSON
    // configuration, Charlotte edits its draft, Charlotte stores it in the
    // database by default behind a PageRepository you can replace, and a
    // document can be rendered without being stored.
    expect($index)->toContain('id="on-the-fly"', 'On-The-Fly UI', 'PageDoc', 'PageRepository', 'approve_on_save', 'never saves it');

    // Neither package ships a file or an HTTP-session store, so the page must
    // not say they do.
    foreach (['sessionStorage', 'localStorage', 'saved as a file', 'in a file', 'in the session', 'in a session'] as $claim) {
        expect($index)->not->toContain($claim);
    }
});

it('drives a real component through the real bridge, never the DOM', function () {
    $sources = humanPlusSources();

    expect($sources['SharedControlDemo.tsx'])
        ->toContain('<ContentReaction', 'registerContentReactionBridge', 'MicroMcpServer', 'attachInProcess', '"tools/call"', 'pendingMode', 'agent_undo')
        ->not->toContain('querySelector')
        ->and($sources['Index.tsx'])->toContain('<DemoFrame', '<FeatureTour', '<HowItFits', '<InstallSteps', '<PackagesGrid', '<FeatureCta', 'clientOnly(');
});

it('imports only packages the showcase installs', function () {
    $dependencies = array_keys(json_decode((string) file_get_contents(base_path('package.json')), true)['dependencies'] ?? []);
    preg_match_all('#from "(@particle-academy/[a-z0-9-]+)#', implode('
', humanPlusSources()), $imports);

    expect($imports[1])->not->toBeEmpty();
    foreach (array_unique($imports[1]) as $package) {
        expect($dependencies)->toContain($package);
    }
});

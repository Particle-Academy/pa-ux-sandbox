<?php

use App\Support\PackageRegistry;
use Tests\TestCase;

uses(TestCase::class);

/*
 * /features/accessibility: a page that teaches. Each lesson names its WCAG 2.2
 * criteria, says how Fancy UI meets them (each point tied to the react-fancy
 * release it shipped in), and demos the real components.
 *
 * PHP cannot render the React page, so this pins the props, the lesson list,
 * the criteria, and the promise kept about fancy-i18n: it is "coming", never
 * described as shipped, until 0.1 can be installed.
 */

const ACCESSIBILITY_DIR = 'resources/js/Pages/Features/Accessibility';

/** The lessons, in page order, with the WCAG criteria each must name. */
const ACCESSIBILITY_LESSONS = [
    'contrast' => ['1.4.3', '1.4.11'],
    'focus' => ['2.1.1', '2.4.3', '2.4.7', '2.4.11'],
    'language' => ['3.1.1', '3.1.2'],
    'targets' => ['2.5.8', '2.5.5'],
    'codes' => ['1.3.5', '3.3.8'],
    'status' => ['4.1.3'],
    'agents' => [],
];

function accessibilityPage(TestCase $test): array
{
    $html = $test->get('/features/accessibility')->assertOk()->getContent();
    preg_match('#<script data-page="app" type="application/json">(.*?)</script>#s', $html, $page);

    return json_decode($page[1] ?? '{}', true) ?? [];
}

/** @return array<string, string> */
function accessibilitySources(): array
{
    $files = [];
    foreach (glob(base_path(ACCESSIBILITY_DIR.'/*')) ?: [] as $path) {
        $files[basename($path)] = (string) file_get_contents($path);
    }

    return $files;
}

it('serves the Accessibility page on react-fancy, the one installable member', function () {
    $page = accessibilityPage($this);

    expect($page['component'] ?? null)->toBe('Features/Accessibility/Index')
        ->and(array_column($page['props']['feature']['members'], 'slug'))->toBe(['react-fancy'])
        ->and($page['props']['feature']['course'])->toBeNull();
});

it('teaches every lesson in order, each with its WCAG criteria', function () {
    $index = accessibilitySources()['Index.tsx'];

    preg_match_all('#<Lesson\s+id="([a-z]+)"#', $index, $ids);
    expect($ids[1])->toBe(array_keys(ACCESSIBILITY_LESSONS));

    foreach (ACCESSIBILITY_LESSONS as $id => $codes) {
        preg_match('#<Lesson\s+id="'.$id.'".*?criteria=\{(\[.*?\])\}#s', $index, $block);
        foreach ($codes as $code) {
            expect($block[1] ?? '')->toContain("code: \"{$code}\"");
        }
    }
});

it('names the releases the owner listed', function () {
    $index = accessibilitySources()['Index.tsx'];

    // Outlines at 3:1 (6.15), per-option lang/dir (6.13), OTP autofill (6.14),
    // the off-limits fence (agent-integrations 0.58).
    expect($index)->toContain('react-fancy 6.15.0', 'react-fancy 6.13.0', 'react-fancy 6.14.0', 'agent-integrations 0.58.0')
        ->toContain('--fancy-border-strong', '--fancy-text-muted', 'data-agent-off-limits');
});

it('demos the real components, and measures instead of typing numbers', function () {
    $sources = accessibilitySources();

    expect($sources['ContrastDemo.tsx'])->toContain('<Input', '<Select', 'measureAgainst(')
        ->and($sources['FocusDemo.tsx'])->toContain('<Modal', 'document.activeElement')
        ->and($sources['LanguageDemo.tsx'])->toContain('lang: "ar", dir: "rtl"', '<Select')
        ->and($sources['TargetSizeDemo.tsx'])->toContain('getBoundingClientRect')
        ->and($sources['OtpDemo.tsx'])->toContain('<OtpInput', 'autocomplete')
        ->and($sources['LiveRegionDemo.tsx'])->toContain('<ReorderableGrid', 'data-react-fancy-reorderable-grid-live');

    foreach (['ContrastDemo.tsx', 'FocusDemo.tsx', 'LanguageDemo.tsx', 'TargetSizeDemo.tsx', 'OtpDemo.tsx', 'LiveRegionDemo.tsx'] as $file) {
        expect($sources[$file])->toContain('from "@particle-academy/react-fancy"');
    }
});

it('says fancy-i18n is coming and claims nothing else about it', function () {
    $index = accessibilitySources()['Index.tsx'];

    preg_match_all('/fancy-i18n/', $index, $mentions);
    expect($index)->toContain('coming with fancy-i18n')
        ->and($index)->not->toMatch('/npm install @particle-academy\/fancy-i18n|fancy-i18n (ships|is available|supports)/');
    // One mention in the docblock, one in the callout and its handle.
    expect(count($mentions[0]))->toBeLessThanOrEqual(4);
});

it('registers fancy-i18n as planned, off every public listing', function () {
    expect(PackageRegistry::PLANNED)->toHaveKey('fancy-i18n');
    $entry = PackageRegistry::PLANNED['fancy-i18n'];

    expect($entry['repo'])->toBe('Particle-Academy/fancy-i18n')
        ->and($entry['registries'])->toBe(['npm' => '@particle-academy/fancy-i18n'])
        ->and($entry['why'])->toContain('.ai/plans/kit-i18n.md')
        ->and(PackageRegistry::find('fancy-i18n'))->toBeNull();
    $this->get('/packages/fancy-i18n')->assertNotFound();
});

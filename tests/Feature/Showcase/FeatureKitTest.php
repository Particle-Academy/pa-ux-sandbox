<?php

use App\Support\FeatureSites;
use Tests\TestCase;

uses(TestCase::class);

/*
 * The Features micro-site kit (resources/js/Pages/Features/shared +
 * resources/css/showcase/features.css) holds every Feature to the same floor:
 * styles present on first paint, nothing under 14px, 44px tap targets, an AA
 * call to action in the Feature's own accent, and a hero that fits a 375 screen.
 *
 * Each of these was first worked around page by page during Phase B; the kit
 * now owns them, and these tests stop the page-local copies coming back.
 */

function kitPath(string $relative): string
{
    return resource_path('js/Pages/Features/'.$relative);
}

function kitSource(string $relative): string
{
    return (string) file_get_contents(kitPath($relative));
}

function featuresCss(): string
{
    return (string) file_get_contents(resource_path('css/showcase/features.css'));
}

/** @return list<string> every Feature's own stylesheet, relative to Pages/Features */
function featurePageStylesheets(): array
{
    $files = glob(kitPath('*/*.css')) ?: [];

    return array_values(array_map(
        fn (string $path): string => basename(dirname($path)).'/'.basename($path),
        array_filter($files, fn (string $path): bool => basename(dirname($path)) !== 'shared'),
    ));
}

/** WCAG 2.x relative luminance of an sRGB triple (0-255). */
function relativeLuminance(array $rgb): float
{
    $channel = function (float $c): float {
        $c /= 255;

        return $c <= 0.04045 ? $c / 12.92 : (($c + 0.055) / 1.055) ** 2.4;
    };

    return 0.2126 * $channel($rgb[0]) + 0.7152 * $channel($rgb[1]) + 0.0722 * $channel($rgb[2]);
}

function contrastRatio(array $a, array $b): float
{
    $la = relativeLuminance($a);
    $lb = relativeLuminance($b);

    return (max($la, $lb) + 0.05) / (min($la, $lb) + 0.05);
}

function hexRgb(string $hex): array
{
    return array_map(fn (string $pair): int => (int) hexdec($pair), str_split(ltrim($hex, '#'), 2));
}

/** `color-mix(in srgb, <rgb> P%, black)`: each gamma-encoded channel scaled by P. */
function mixWithBlack(array $rgb, float $share): array
{
    return array_map(fn (int $c): int => (int) round($c * $share), $rgb);
}

it('loads every Feature stylesheet with the site CSS, never from the page chunk', function () {
    $showcase = (string) file_get_contents(resource_path('css/showcase.css'));
    $sheets = featurePageStylesheets();

    expect($sheets)->toHaveCount(8);
    foreach ($sheets as $sheet) {
        expect($showcase)->toContain('@import "../js/Pages/Features/'.$sheet.'";');
    }

    // A page-level `import "./x.css"` puts the CSS in the page's lazy chunk,
    // which paints the page unstyled first.
    $offenders = [];
    foreach (glob(kitPath('*/*.tsx')) ?: [] as $file) {
        if (preg_match('#^import\s+["\'][^"\']+\.css["\'];#m', (string) file_get_contents($file))) {
            $offenders[] = basename(dirname($file)).'/'.basename($file);
        }
    }
    expect($offenders)->toBe([]);
});

it('keeps all kit text at 14px or more', function () {
    foreach (['DemoFrame', 'FeatureHero', 'HowItFits', 'InstallSteps', 'PackagesGrid', 'FeatureCta', 'FeatureTour'] as $piece) {
        $source = kitSource("shared/{$piece}.tsx");
        expect($source)->not->toMatch('#<Badge[^>]*size="(xs|sm)"#')
            ->and($source)->not->toMatch('#<(Text|Button)[^>]*size="xs"#');
    }
    expect(kitSource('shared/InstallSteps.tsx'))->not->toMatch('#<Button[^>]*size="sm"#s');

    // The micro-site kit and the /features index. The header dropdown's trigger
    // after them is a site nav link and matches its neighbours' size.
    $kit = strstr(featuresCss(), '/* ── Header dropdown', true);
    expect($kit)->not->toBeFalse();
    preg_match_all('#font-size:\s*([0-9.]+)px#', (string) $kit, $sizes);
    $small = array_filter($sizes[1], fn (string $px): bool => (float) $px < 14);
    expect($small)->toBe([]);
});

it('gives every kit link and button a 44px tap target', function () {
    $css = (string) preg_replace('#/\*.*?\*/#s', '', featuresCss());
    preg_match('#([^{}]+)\{[^}]*min-height:\s*44px#', $css, $rule);
    $selectors = array_map('trim', explode(',', $rule[1] ?? ''));

    foreach (['.feature-crumbs a', '.feature-fits__list a', '.feature-steps__copy', '.feature-cta__actions > *'] as $selector) {
        expect($selectors)->toContain($selector);
    }
    expect(kitSource('shared/InstallSteps.tsx'))->toContain('className="feature-steps__copy"');
});

it('paints the primary call to action in the Feature accent at AA contrast', function () {
    $cta = kitSource('shared/FeatureCta.tsx');
    expect($cta)->not->toContain('violet')
        ->and($cta)->toContain('"brand"');

    $css = featuresCss();
    expect($css)->toContain('--color-brand: color-mix(in srgb, var(--feature-accent) 75%, black);')
        ->and($css)->toContain('--color-brand-hover: color-mix(in srgb, var(--feature-accent) 65%, black);')
        ->and($css)->toContain('--color-brand-contrast: #ffffff;')
        ->and($css)->toContain('--color-brand: var(--feature-accent);')
        ->and($css)->toContain('--color-brand-hover: color-mix(in srgb, var(--feature-accent) 90%, black);')
        ->and($css)->toContain('--color-brand-contrast: #0b0b10;');

    // The same numbers, computed against every Feature's real accent: a new
    // or recoloured Feature cannot ship a CTA that fails AA.
    $white = [255, 255, 255];
    $ink = hexRgb('#0b0b10');
    $failures = [];
    foreach (FeatureSites::all() as $feature) {
        $light = hexRgb($feature['theme']['accent']);
        $dark = hexRgb($feature['theme']['accentDark']);
        $checks = [
            'light' => contrastRatio($white, mixWithBlack($light, 0.75)),
            'light hover' => contrastRatio($white, mixWithBlack($light, 0.65)),
            'dark' => contrastRatio($ink, $dark),
            'dark hover' => contrastRatio($ink, mixWithBlack($dark, 0.90)),
        ];
        foreach ($checks as $state => $ratio) {
            if ($ratio < 4.5) {
                $failures[] = sprintf('%s %s %.2f', $feature['slug'], $state, $ratio);
            }
        }
    }
    expect($failures)->toBe([]);
});

it('stretches the stacked hero to the screen and shrinks its heading', function () {
    preg_match('#@media \(max-width: 640px\) \{(.*?)\n\}#s', featuresCss(), $block);
    $mobile = $block[1] ?? '';

    expect($mobile)->toContain('.feature-hero__main { align-self: stretch; }')
        ->and($mobile)->toMatch('#\.feature-hero h1\.feature-display \{[^}]*font-size: 30px#');
});

it('leaves no page-local copy of a kit fix behind', function () {
    $kitFixes = [
        '#\.feature-code[^{]*\{[^}]*font-size#',
        '#\.feature-steps__(n|cmd|meta|copy)\b#',
        '#\.feature-fits__(list|bridges)\b#',
        '#\.feature-cta__actions#',
        '#\.feature-hero__actions#',
        '#\.feature-hero__main\s*\{\s*align-self#',
    ];
    $offenders = [];
    foreach (featurePageStylesheets() as $sheet) {
        $css = kitSource($sheet);
        foreach ($kitFixes as $pattern) {
            if (preg_match($pattern, $css)) {
                $offenders[] = "{$sheet} {$pattern}";
            }
        }
    }

    expect($offenders)->toBe([]);
});

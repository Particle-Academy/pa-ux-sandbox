<?php

use Tests\TestCase;

uses(TestCase::class);

/**
 * The showcase follows the kit's own typography policy (resources/docs/typography.md):
 * fonts are self-hosted and served from the same origin, never hot-linked from a
 * font CDN. Until 2026-11-01 the root layout pulled Geist + Geist Mono from
 * fonts.googleapis.com — the site that publishes the rule was breaking it.
 *
 * The faces are Vercel's Geist v1.9.0 variable woff2 files, bytes unmodified,
 * provenance in resources/fonts/geist/NOTICE.md.
 */
const FONT_CDN_HOSTS = ['fonts.googleapis.com', 'fonts.gstatic.com', 'fonts.bunny.net'];

const GEIST_FACES = [
    'resources/fonts/geist/Geist-Variable.woff2',
    'resources/fonts/geist/GeistMono-Variable.woff2',
];

/** Forward slashes only, so a path compares equal on Windows and in CI. */
function fontPolicyPath(string $path): string
{
    return str_replace('\\', '/', $path);
}

/** Every source file a page head, a stylesheet or the bundler could carry a font link in. */
function fontPolicyScannedFiles(): array
{
    $files = [fontPolicyPath(base_path('vite.config.js'))];

    foreach (['resources/views', 'resources/css', 'resources/js', 'app'] as $dir) {
        $it = new RecursiveIteratorIterator(new RecursiveDirectoryIterator(base_path($dir), FilesystemIterator::SKIP_DOTS));
        foreach ($it as $file) {
            if (preg_match('/\.(php|css|js|jsx|ts|tsx|mjs|json)$/', $file->getFilename())) {
                $files[] = fontPolicyPath($file->getPathname());
            }
        }
    }

    return $files;
}

it('references no font CDN in any view, stylesheet, script or the Vite config', function () {
    $files = fontPolicyScannedFiles();

    // Prove the scan saw what it claims to have seen, so a moved directory
    // cannot turn this into a test that passes by reading nothing.
    expect(count($files))->toBeGreaterThan(100)
        ->and($files)->toContain(fontPolicyPath(resource_path('views/showcase-app.blade.php')));

    $offenders = [];
    foreach ($files as $path) {
        $source = file_get_contents($path);
        foreach (FONT_CDN_HOSTS as $host) {
            if (str_contains($source, $host)) {
                $offenders[] = str_replace(fontPolicyPath(base_path()).'/', '', $path)." -> {$host}";
            }
        }
    }

    expect($offenders)->toBe([]);
});

it('ships the Geist faces as real woff2, with the OFL and a NOTICE that records their sha256', function () {
    $notice = resource_path('fonts/geist/NOTICE.md');

    expect(resource_path('fonts/geist/OFL.txt'))->toBeFile()
        ->and(file_get_contents(resource_path('fonts/geist/OFL.txt')))->toContain('SIL Open Font License, Version 1.1')
        ->and($notice)->toBeFile();

    $noticeText = file_get_contents($notice);

    foreach (GEIST_FACES as $face) {
        $path = base_path($face);

        expect($path)->toBeFile()
            ->and(file_get_contents($path, length: 4))->toBe('wOF2')
            ->and($noticeText)->toContain(hash_file('sha256', $path));
    }

    expect($noticeText)->toContain('https://github.com/vercel/geist-font/releases/download/v1.9.0/geist-font-v1.9.0.zip')
        ->toContain(hash_file('sha256', resource_path('fonts/geist/OFL.txt')));
});

it('declares the @font-face rules against the local files with font-display swap', function () {
    $css = file_get_contents(resource_path('css/showcase.css'));

    preg_match_all('/@font-face\s*\{(.*?)\}/s', $css, $faces);

    expect($faces[1])->toHaveCount(2);

    $byFamily = [];
    foreach ($faces[1] as $body) {
        preg_match('/font-family:\s*["\']([^"\']+)["\']/', $body, $family);
        $byFamily[$family[1]] = $body;
        expect($body)->toContain('font-display: swap')
            ->and($body)->toMatch('/font-weight:\s*100 900/');
    }

    expect(array_keys($byFamily))->toEqualCanonicalizing(['Geist', 'Geist Mono'])
        ->and($byFamily['Geist'])->toContain("url('../fonts/geist/Geist-Variable.woff2') format('woff2')")
        ->and($byFamily['Geist Mono'])->toContain("url('../fonts/geist/GeistMono-Variable.woff2') format('woff2')");

    // The tokens keep the names the site already uses, now resolving to these faces.
    $tokens = file_get_contents(resource_path('css/showcase/tokens.css'));
    expect($tokens)->toMatch('/--font-sans:\s*"Geist",/')
        ->and($tokens)->toMatch('/--font-mono:\s*"Geist Mono",/');
});

it('builds the faces into same-origin assets the compiled stylesheet points at', function () {
    $manifest = json_decode(file_get_contents(public_path('build/manifest.json')), true);

    foreach (GEIST_FACES as $face) {
        expect($manifest)->toHaveKey($face);
    }

    $css = file_get_contents(public_path('build/'.$manifest['resources/css/showcase.css']['file']));

    expect($css)->toContain('/build/'.$manifest['resources/fonts/geist/Geist-Variable.woff2']['file'])
        ->and($css)->toContain('/build/'.$manifest['resources/fonts/geist/GeistMono-Variable.woff2']['file']);

    foreach (FONT_CDN_HOSTS as $host) {
        expect($css)->not->toContain($host);
    }
});

it('preloads the Geist face and links no font CDN on the rendered pages', function (string $uri) {
    $html = $this->get($uri)->assertOk()->getContent();

    // Match the host as a URL (`//host`), not as a word: /docs/typography is the
    // page whose prose NAMES these hosts in order to forbid them.
    foreach (FONT_CDN_HOSTS as $host) {
        expect($html)->not->toContain('//'.$host);
    }

    $manifest = json_decode(file_get_contents(public_path('build/manifest.json')), true);
    expect($manifest)->toHaveKey('resources/fonts/geist/Geist-Variable.woff2');
    $asset = '/build/'.$manifest['resources/fonts/geist/Geist-Variable.woff2']['file'];

    preg_match_all('/<link\b[^>]*rel="preload"[^>]*>/', $html, $preloads);
    $fontPreloads = array_values(array_filter($preloads[0], fn ($tag) => str_contains($tag, 'as="font"')));

    expect($fontPreloads)->toHaveCount(1);
    expect($fontPreloads[0])->toContain($asset.'"')
        ->toContain('type="font/woff2"')
        ->toContain('crossorigin');
})->with(['/', '/docs/typography']);

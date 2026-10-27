<?php

use Tests\TestCase;

uses(TestCase::class);

/*
 * /features/git (Phase B). Pest cannot render React, so this pins the two
 * halves it can see: the Inertia page the server sends, and the page source
 * that consumes it. The source checks are what fail on the Phase A stub.
 */

function gitFeaturePage(TestCase $test): array
{
    $html = $test->get('/features/git')->assertOk()->getContent();
    preg_match('#<script data-page="app" type="application/json">(.*?)</script>#s', $html, $match);

    return json_decode($match[1] ?? '{}', true) ?? [];
}

function gitFeatureSource(): string
{
    $dir = resource_path('js/Pages/Features/Git');
    $source = '';
    foreach (new RecursiveIteratorIterator(new RecursiveDirectoryIterator($dir, FilesystemIterator::SKIP_DOTS)) as $file) {
        if (in_array($file->getExtension(), ['tsx', 'ts', 'css'], true)) {
            $source .= file_get_contents($file->getPathname())."\n";
        }
    }

    return $source;
}

it('renders the Git micro-site with its registry members and the git bridge', function () {
    $page = gitFeaturePage($this);

    expect($page['component'] ?? null)->toBe('Features/Git/Index')
        ->and($page['props']['feature']['slug'])->toBe('git')
        ->and(array_column($page['props']['feature']['members'], 'slug'))
        ->toContain('fancy-git-ui', 'fancy-git', 'fancy-git-js', 'fancy-git-github-php', 'fancy-git-gitlab-js', 'fancy-git-bitbucket-php')
        ->and(array_column($page['props']['feature']['bridges'], 'name'))->toBe(['registerGitBridge']);
});

it('demos the real fancy-git-ui surfaces through the real git bridge', function () {
    $source = gitFeatureSource();

    expect($source)
        ->toContain('from "@particle-academy/fancy-git-ui"')
        ->toContain('<WorkingTree')
        ->toContain('<DiffViewer')
        ->toContain('<CommitHistory')
        ->toContain('<ReviewList')
        ->toContain('<BranchPicker')
        ->toContain('registerGitBridge')
        ->toContain('MicroMcpServer')
        ->toContain('<DemoFrame')
        ->toContain('<FeatureTour')
        ->toContain('<HowItFits')
        ->toContain('<InstallSteps')
        ->toContain('<PackagesGrid')
        ->toContain('<FeatureCta');
});

it('leaves no Phase A placeholder behind', function () {
    $source = gitFeatureSource();

    expect($source)->not->toContain('TODO')
        ->and($source)->not->toContain('feature-todo')
        ->and($source)->not->toContain('circle-dashed');
});

it('makes no network calls from the demo', function () {
    // The demo answers every intent in local state: no fetch, no axios, no
    // provider SDK, so it can never reach a real repository or host.
    expect(gitFeatureSource())
        ->not->toContain('fetch(')
        ->not->toContain('axios')
        ->not->toContain('@octokit')
        ->not->toContain('fancy-git-github-js');
});

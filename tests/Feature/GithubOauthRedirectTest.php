<?php

use Tests\TestCase;

uses(TestCase::class);

/**
 * The GitHub OAuth callback URL must resolve to something real whether or not
 * the deployment sets `GITHUB_REDIRECT_URI`.
 *
 * Production was sending GitHub an EMPTY `redirect_uri=` for exactly the reason
 * this file guards: `env('KEY', $default)` only uses `$default` when the key is
 * ABSENT. A present-but-empty `GITHUB_REDIRECT_URI=` — which is what
 * `.env.example` stubs, and what a copied deploy env contains — returns `""`,
 * and the fallback never fires.
 *
 * The tests read `config/services.php` directly rather than the loaded config,
 * because the config is cached in some environments and the point is the
 * expression, not one machine's resolved value.
 */
function servicesConfig(array $env): array
{
    $original = [];
    foreach ($env as $key => $value) {
        $original[$key] = $_ENV[$key] ?? null;
        if ($value === null) {
            unset($_ENV[$key], $_SERVER[$key]);
            putenv($key);
        } else {
            $_ENV[$key] = $value;
            $_SERVER[$key] = $value;
            putenv("{$key}={$value}");
        }
    }

    try {
        return require base_path('config/services.php');
    } finally {
        foreach ($original as $key => $value) {
            if ($value === null) {
                unset($_ENV[$key], $_SERVER[$key]);
                putenv($key);
            } else {
                $_ENV[$key] = $value;
                $_SERVER[$key] = $value;
                putenv("{$key}={$value}");
            }
        }
    }
}

it('falls back to APP_URL when GITHUB_REDIRECT_URI is EMPTY, not just missing', function () {
    // The live bug. An empty string is falsy but present, so `env()`'s default
    // argument is skipped and GitHub receives `redirect_uri=`.
    $config = servicesConfig([
        'GITHUB_REDIRECT_URI' => '',
        'APP_URL' => 'https://ui.particle.academy',
    ]);

    expect($config['github']['redirect'])->toBe('https://ui.particle.academy/auth/github/callback');
});

it('falls back when GITHUB_REDIRECT_URI is absent', function () {
    $config = servicesConfig([
        'GITHUB_REDIRECT_URI' => null,
        'APP_URL' => 'https://ui.particle.academy',
    ]);

    expect($config['github']['redirect'])->toBe('https://ui.particle.academy/auth/github/callback');
});

it('uses GITHUB_REDIRECT_URI when it is actually set', function () {
    $config = servicesConfig([
        'GITHUB_REDIRECT_URI' => 'https://staging.example.com/auth/github/callback',
        'APP_URL' => 'https://ui.particle.academy',
    ]);

    expect($config['github']['redirect'])->toBe('https://staging.example.com/auth/github/callback');
});

it('does not double the slash when APP_URL has a trailing one', function () {
    // `https://host//auth/github/callback` would not match the callback
    // registered on the OAuth App, and GitHub rejects a mismatch outright.
    $config = servicesConfig([
        'GITHUB_REDIRECT_URI' => '',
        'APP_URL' => 'https://ui.particle.academy/',
    ]);

    expect($config['github']['redirect'])->toBe('https://ui.particle.academy/auth/github/callback');
});

it('never yields an empty redirect', function () {
    // The invariant, stated plainly: whatever the env looks like, GitHub must
    // not be handed a blank callback.
    foreach ([['', ''], ['', null], [null, null]] as [$redirect, $appUrl]) {
        $config = servicesConfig(['GITHUB_REDIRECT_URI' => $redirect, 'APP_URL' => $appUrl ?? 'https://x.test']);

        expect($config['github']['redirect'])->not->toBe('');
        expect($config['github']['redirect'])->toContain('/auth/github/callback');
    }
});

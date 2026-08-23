<?php

/**
 * The backend search tool, and the one behaviour that makes it worth having.
 *
 * Components had list / search / get / install. Nodes had the same four.
 * Server-side packages had NONE — the only route in was `start_project`, which
 * opens with "choose your backend" and is therefore useless to the commonest
 * case: an app that already exists, whose author needs one package.
 *
 * **The load-bearing assertion here is `not_in_your_stack`.** A capability we
 * ship in PHP and Node but not Python must not come back as an empty list,
 * because an empty list reads as "Fancy does not do that" — false, and
 * unrecoverable for the caller, who has no way to learn otherwise.
 */

use App\Mcp\Tools\SearchBackendPackages;
use Laravel\Mcp\Request;

function backendSearch(array $args): array
{
    $response = app(SearchBackendPackages::class)->handle(new Request($args));

    return json_decode($response->content()->toArray()['text'] ?? '{}', true) ?? [];
}

it('finds a Python package for a capability Python actually has', function () {
    $body = backendSearch(['query' => 'feature', 'stack' => 'python']);

    expect($body['stack'])->toBe('python')
        ->and(collect($body['packages'])->pluck('name'))->toContain('fancy-features');
});

it('gives the install command for the stack that was asked for', function () {
    $pip = collect(backendSearch(['query' => 'xlsx', 'stack' => 'python'])['packages'])->firstWhere('name', 'fancy-holy-sheet');
    $composer = collect(backendSearch(['query' => 'xlsx', 'stack' => 'php'])['packages'])->firstWhere('name', 'particle-academy/holy-sheet');

    expect($pip['install'])->toStartWith('pip install fancy-holy-sheet')
        ->and($composer['install'])->toBe('composer require particle-academy/holy-sheet');
});

it('accepts the framework someone would actually name', function () {
    // Nobody types "node" when they are on Next.js, or "python" when they are
    // on FastAPI. A stack filter that only matches its own canonical name is a
    // filter most callers will miss.
    expect(backendSearch(['stack' => 'fastapi'])['stack'])->toBe('python')
        ->and(backendSearch(['stack' => 'laravel'])['stack'])->toBe('php')
        ->and(backendSearch(['stack' => 'nextjs'])['stack'])->toBe('node');
});

it('NAMES a capability that exists in another stack instead of returning nothing', function () {
    // Workflow graphs ship in all three, so pick something Python does not have.
    $body = backendSearch(['query' => 'referral', 'stack' => 'python']);

    expect($body['packages'])->toBe([])
        ->and($body)->toHaveKey('not_in_your_stack');

    $named = collect($body['not_in_your_stack'])->pluck('capability')->implode(' ');
    expect($named)->not->toBe('');

    // And it must say where it IS available, or the caller is no better off.
    $where = collect($body['not_in_your_stack'])->first()['available_in'];
    expect($where)->not->toBeEmpty();
});

it('does not claim a miss is a gap when nothing matched at all', function () {
    // A genuine no-match is different from "wrong stack", and conflating them
    // would send someone hunting for a package that was never proposed.
    $body = backendSearch(['query' => 'quantum tunnelling', 'stack' => 'php']);

    expect($body['packages'])->toBe([])
        ->and($body)->not->toHaveKey('not_in_your_stack')
        ->and($body['note'])->toContain('Nothing matched');
});

it('requires every query word to match, so two words narrow rather than widen', function () {
    $one = backendSearch(['query' => 'stripe']);
    $two = backendSearch(['query' => 'stripe catalog']);

    expect(count($two['packages']))->toBeLessThanOrEqual(count($one['packages']));
});

it('lists only server-side packages, never a React surface', function () {
    $names = collect(backendSearch([])['packages'])->pluck('name');

    expect($names)->not->toContain('@particle-academy/react-fancy')
        ->and($names)->not->toContain('@particle-academy/fancy-whiteboard');
});

it('never reports a capability as missing when it was just returned', function () {
    // Found by READING the output, not by a failing test: a Python search for
    // "feature" returned fancy-features AND listed "Feature management" under
    // not_in_your_stack, because the sibling PHP and Node mirrors also matched
    // the query. Telling someone a capability is unavailable in the same breath
    // as handing them the package is worse than saying nothing — it invites
    // them to go and build the sidecar they do not need.
    $body = backendSearch(['query' => 'feature', 'stack' => 'python']);

    $delivered = collect($body['packages'])->pluck('capability')->filter()->all();
    $claimedMissing = collect($body['not_in_your_stack'] ?? [])->pluck('capability')->all();

    expect(array_intersect($delivered, $claimedMissing))->toBe([]);
});

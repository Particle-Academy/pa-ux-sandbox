<?php

use Illuminate\Support\Facades\Vite;
use Tests\TestCase;

uses(TestCase::class);

/*
 * A test's result must not depend on whether a Vite dev server is running.
 *
 * `public/hot` is written by `npm run dev` and removed when it shuts down
 * cleanly, so the file is present for as long as a dev server is RUNNING -- the
 * normal state of a dev machine, not an edge case -- and it also outlives one
 * that was killed or crashed. Laravel's `Vite::isRunningHot()`
 * is just `is_file()` on that path, and plenty of production code branches on
 * it. `App\Ssr\TimeoutHttpGateway::dispatch()` is the one that bit:
 *
 *     $url = $isHot ? $this->getHotUrl('/__inertia_ssr')
 *                   : $this->getProductionUrl('/render');
 *
 * With a stale hot file the SSR render is posted to the DEV SERVER's port
 * instead of 13733. `SsrRenderingTest` fakes 13733, the fake does not match, the
 * unmatched call returns an empty body, the gateway reads no JSON and falls back
 * to client rendering -- and five SSR tests plus both `AssetSchemeTest` cases
 * fail. Seven reds, from a file whose presence means nothing more than that
 * someone is working on the front end right now.
 *
 * That is worse than it sounds, because of WHICH tests they are.
 * `SsrRenderingTest` exists because SSR can stop working while every page still
 * returns a valid 200 -- it rotted exactly that way once. A suite that shows
 * seven permanent reds on a developer's machine is a suite whose reds get
 * skimmed, so the next real SSR failure arrives in a colour that already means
 * nothing. The ambient-state bug and the silent-rot bug defend against each
 * other badly.
 *
 * So `TestCase` pins the hot file to a path that cannot exist. This test asserts
 * the pin holds by CREATING the condition rather than waiting to encounter it:
 * without the pin it is red on CI too, where no `public/hot` exists and the
 * problem is therefore invisible.
 */

it('reports not-hot even when a stale dev-server hot file exists', function () {
    $hot = public_path('hot');
    $preexisting = is_file($hot) ? file_get_contents($hot) : null;

    try {
        if ($preexisting === null) {
            @mkdir(dirname($hot), 0777, true);
            file_put_contents($hot, 'http://127.0.0.1:5174');
        }

        // The file a dev server would have left is on disk right now.
        expect(is_file($hot))->toBeTrue();

        // And the framework must still say cold, because the suite pinned the
        // hot file somewhere else. Without that pin this is `true`.
        expect(Vite::isRunningHot())->toBeFalse();
    } finally {
        if ($preexisting === null) {
            @unlink($hot);
        }
    }
});

it('pins the hot file outside public/, so no dev server can create it', function () {
    expect(Vite::hotFile())->not->toBe(public_path('hot'));

    // A pin that pointed at a file something else writes would be no pin at all.
    expect(is_file(Vite::hotFile()))->toBeFalse();
});

<?php

namespace Tests;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Testing\TestCase as BaseTestCase;
use Illuminate\Support\Facades\Vite;

abstract class TestCase extends BaseTestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        // No test's result may depend on whether a Vite dev server happens to be
        // running. `public/hot` is written by `npm run dev` and exists for as
        // long as it runs -- which on a dev machine is most of the time, and it
        // also survives a server that was killed rather than shut down. Either
        // way it is ambient state the suite would otherwise read, and
        // `Vite::isRunningHot()` steers
        // real code, including which URL `App\Ssr\TimeoutHttpGateway` posts an
        // SSR render to. A leftover file sent those renders to the dev server's
        // port and turned seven passing tests red, five of them the SSR tests
        // that exist because SSR can fail while every page still returns 200.
        //
        // Pinned outside public/ so nothing but this line can create it.
        // Asserted by ViteHotStateIsDeterministicTest.
        Vite::useHotFile(storage_path('framework/testing/vite-hot-absent-by-design'));
    }
}

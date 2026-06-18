<?php

namespace App\Http\Controllers;

use Symfony\Component\HttpFoundation\Response;

/**
 * Serves the built service worker (public/build/sw.js, emitted by the fancyPwa()
 * Vite plugin) from the site ROOT so it can claim scope "/". A worker only
 * controls its own path's scope; bundled at /build/sw.js it could only control
 * /build/. This route streams it from /sw.js with Service-Worker-Allowed: /.
 *
 * Invokable controller (NOT a closure) so route:cache keeps working — the
 * codebase had a closure-route deploy bug, so SW serving must stay cacheable.
 */
class ServiceWorkerController extends Controller
{
    public function __invoke(): Response
    {
        $path = public_path('build/sw.js');

        // No built SW (e.g. dev / `npm run dev` with no build) → 404 so the
        // registration script (which only runs when the file exists) is a no-op.
        if (! is_file($path)) {
            abort(404);
        }

        return response((string) file_get_contents($path), 200, [
            'Content-Type' => 'application/javascript',
            'Service-Worker-Allowed' => '/',
            'Cache-Control' => 'no-cache',
        ]);
    }
}

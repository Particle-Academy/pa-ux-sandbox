<?php

namespace App\Http\Controllers\Showcase;

use App\Http\Controllers\Controller;
use App\Support\GalleryRegistry;
use Inertia\Inertia;
use Inertia\Response;

/**
 * The Inspiration Gallery — one fictional creative-studio portfolio
 * ("FIELDWORK") designed twenty ways, common → experimental. The index lists
 * every style; each per-style route mounts that style's bespoke page (a
 * tasteful "in progress" placeholder until the style component is built).
 */
class InspirationController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('Inspiration/Index', [
            'styles' => GalleryRegistry::all(),
        ]);
    }

    public function show(string $style): Response
    {
        $entry = GalleryRegistry::find($style);
        abort_if($entry === null, 404);

        return Inertia::render('Inspiration/Show', [
            'style' => $entry,
            // Ordered full list so the demo-frame can render "style N of 20" +
            // prev/next nav for flipping between styles.
            'styles' => GalleryRegistry::all(),
        ]);
    }
}

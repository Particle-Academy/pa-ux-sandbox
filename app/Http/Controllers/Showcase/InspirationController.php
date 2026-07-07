<?php

namespace App\Http\Controllers\Showcase;

use App\Http\Controllers\Controller;
use App\Support\GalleryRegistry;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

/**
 * The Inspiration Gallery — fictional businesses, each designed twenty ways
 * with restyled Fancy UI primitives. /inspiration lands on every collection;
 * /inspiration/{collection} is one catalog; /inspiration/{collection}/{style}
 * mounts that style's bespoke page. Legacy pre-collection style URLs
 * (/inspiration/swiss) permanently redirect to their collection.
 */
class InspirationController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('Inspiration/Index', [
            'collections' => array_map(
                fn (array $meta) => $meta + ['styles' => GalleryRegistry::styles($meta['id'])],
                GalleryRegistry::collections(),
            ),
        ]);
    }

    public function collection(string $collection): Response|RedirectResponse
    {
        $entry = GalleryRegistry::collection($collection);
        if ($entry !== null) {
            $styles = $entry['styles'];
            unset($entry['styles']);

            return Inertia::render('Inspiration/Collection', [
                'collection' => $entry,
                'styles' => $styles,
                'collections' => GalleryRegistry::collections(),
            ]);
        }

        // Legacy pre-collection style URL (/inspiration/swiss) → its collection.
        $style = GalleryRegistry::findAnywhere($collection);
        if ($style !== null) {
            return redirect()->to("/inspiration/{$style['collection']}/{$style['id']}", 301);
        }

        abort(404);
    }

    public function show(string $collection, string $style): Response
    {
        $entry = GalleryRegistry::find($collection, $style);
        abort_if($entry === null, 404);

        $meta = GalleryRegistry::collection($collection);
        unset($meta['styles']);

        return Inertia::render('Inspiration/Show', [
            'collection' => $meta,
            'style' => $entry,
            // Ordered full list so the demo-frame can render "style N of 20" +
            // prev/next nav for flipping between styles.
            'styles' => GalleryRegistry::styles($collection),
        ]);
    }
}

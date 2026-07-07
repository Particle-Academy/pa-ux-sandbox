<?php

namespace App\Http\Controllers\Showcase;

use App\Http\Controllers\Controller;
use App\Support\Gallery\GallerySource;
use Illuminate\Http\JsonResponse;

/**
 * Serves the Inspiration Gallery "grab" blueprints to agents + the gallery MCP
 * tools — a parallel to {@see RegistryController} (components), but for design
 * recipes instead of vendored source. CORS-open + cacheable.
 *
 * /gallery/index.json                     — all collections + every style card
 * /gallery/{collection}/index.json        — one collection's index
 * /gallery/{collection}/{style}.json      — one style's full grab-blueprint
 * /gallery/{style}.json                   — legacy pre-collection lookup
 */
class GalleryController extends Controller
{
    private const HEADERS = [
        'Cache-Control' => 'public, max-age=300, s-maxage=900',
        'Access-Control-Allow-Origin' => '*',
    ];

    public function __construct(private readonly GallerySource $source) {}

    /**
     * GET /gallery/index.json — every collection's meta + every style's card.
     */
    public function index(): JsonResponse
    {
        $index = $this->source->index();

        return response()->json([
            '$schema' => 'https://ui.particle.academy/schema/gallery.json',
            'name' => 'fancy-ui-inspiration',
            'homepage' => 'https://ui.particle.academy/inspiration',
            'kind' => 'design-blueprints',
            'usage' => 'Read-only design inspiration — recipes to re-implement (and mix-and-match) with the Fancy UI kit, not source to fork. Collections are fictional businesses, each designed twenty ways.',
            'count' => count($index['styles']),
            'collections' => $index['collections'],
            'styles' => $index['styles'],
        ], 200, self::HEADERS);
    }

    /**
     * GET /gallery/{collection}/{style}.json — one style's full grab-blueprint
     * ({style} "index" serves the collection's index instead).
     */
    public function show(string $collection, string $style): JsonResponse
    {
        $style = str_replace('.json', '', $style);

        if ($style === 'index') {
            $index = $this->source->collectionIndex($collection);
            if ($index === null) {
                return $this->missing("gallery collection '{$collection}'");
            }

            return response()->json($index, 200, self::HEADERS);
        }

        $blueprint = $this->source->blueprint($collection, $style);
        if ($blueprint === null) {
            return $this->missing("gallery style '{$collection}/{$style}'");
        }

        return response()->json($blueprint, 200, self::HEADERS);
    }

    /**
     * GET /gallery/{style}.json — legacy pre-collection blueprint URL; style
     * ids stay unique across collections so the bare id still resolves.
     */
    public function legacy(string $style): JsonResponse
    {
        $style = str_replace('.json', '', $style);

        $blueprint = $this->source->blueprintAnywhere($style);
        if ($blueprint === null) {
            return $this->missing("gallery style '{$style}'");
        }

        return response()->json($blueprint, 200, self::HEADERS);
    }

    private function missing(string $what): JsonResponse
    {
        return response()->json(['error' => "{$what} not found"], 404, self::HEADERS);
    }
}

<?php

namespace App\Http\Controllers\Showcase;

use App\Http\Controllers\Controller;
use App\Support\Gallery\GallerySource;
use Illuminate\Http\JsonResponse;

/**
 * Serves the Inspiration Gallery "grab" blueprints to agents + the gallery MCP
 * tools — a parallel to {@see RegistryController} (components), but for design
 * recipes instead of vendored source. CORS-open + cacheable.
 */
class GalleryController extends Controller
{
    private const HEADERS = [
        'Cache-Control' => 'public, max-age=300, s-maxage=900',
        'Access-Control-Allow-Origin' => '*',
    ];

    public function __construct(private readonly GallerySource $source) {}

    /**
     * GET /gallery/index.json — the 20 styles' card metadata + blueprint URLs.
     */
    public function index(): JsonResponse
    {
        $styles = $this->source->index();

        return response()->json([
            '$schema' => 'https://ui.particle.academy/schema/gallery.json',
            'name' => 'fancy-ui-inspiration',
            'homepage' => 'https://ui.particle.academy/inspiration',
            'kind' => 'design-blueprints',
            'usage' => 'Read-only design inspiration — recipes to re-implement (and mix-and-match) with the Fancy UI kit, not source to fork.',
            'count' => count($styles),
            'styles' => $styles,
        ], 200, self::HEADERS);
    }

    /**
     * GET /gallery/{style}.json — one style's full grab-blueprint.
     */
    public function show(string $style): JsonResponse
    {
        $style = str_replace('.json', '', $style);

        $blueprint = $this->source->blueprint($style);
        if ($blueprint === null) {
            return response()->json(['error' => "gallery style '{$style}' not found"], 404, self::HEADERS);
        }

        return response()->json($blueprint, 200, self::HEADERS);
    }
}

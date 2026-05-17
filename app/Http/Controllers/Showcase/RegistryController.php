<?php

namespace App\Http\Controllers\Showcase;

use App\Http\Controllers\Controller;
use App\Support\Registry\RegistrySource;
use Illuminate\Http\JsonResponse;

class RegistryController extends Controller
{
    public function __construct(private readonly RegistrySource $source) {}

    /**
     * GET /r/index.json — shadcn-compatible registry index.
     */
    public function index(): JsonResponse
    {
        $items = $this->source->all();

        return response()->json([
            '$schema' => 'https://ui.particle.academy/schema/registry.json',
            'name' => 'fancy-ui',
            'homepage' => 'https://ui.particle.academy',
            'items' => array_map(fn ($item) => $item->toSummary(), $items),
        ], 200, [
            'Cache-Control' => 'public, max-age=300, s-maxage=900',
            'Access-Control-Allow-Origin' => '*',
        ]);
    }

    /**
     * GET /r/{slug}.json — shadcn-compatible registry-item.
     */
    public function show(string $slug): JsonResponse
    {
        $slug = str_replace('.json', '', $slug);

        $item = $this->source->find($slug);
        if (! $item) {
            return response()->json([
                'error' => "registry item '$slug' not found",
            ], 404);
        }

        return response()->json($item->toArray(), 200, [
            'Cache-Control' => 'public, max-age=300, s-maxage=900',
            'Access-Control-Allow-Origin' => '*',
        ]);
    }
}

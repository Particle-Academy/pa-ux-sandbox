<?php

namespace App\Support\Gallery;

use App\Support\GalleryRegistry;
use Illuminate\Support\Facades\File;

/**
 * Source for the Inspiration Gallery's "grab" blueprints — the agent-readable
 * design recipes behind the 20 FIELDWORK styles.
 *
 * Each style ships a co-located `<id>.blueprint.json` (next to its component
 * under resources/js/Pages/Inspiration/styles/) authored when the style was
 * built. This source merges that recipe with the {@see GalleryRegistry} card
 * metadata and serves it via the /gallery/* routes + the gallery MCP tools.
 *
 * Blueprints are READ-ONLY inspiration: a recipe an agent RE-IMPLEMENTS in a
 * project (composable / mix-and-matchable), never vendored source.
 */
class GallerySource
{
    /** Recipe fields owned by the blueprint file (metadata comes from the registry). */
    private const RECIPE_KEYS = ['thesis', 'tokens', 'layout', 'sections', 'palette', 'contentArchetype', 'remix'];

    /**
     * The catalog index — every style's card metadata + its blueprint URL.
     *
     * @return list<array<string, mixed>>
     */
    public function index(): array
    {
        return array_map(fn (array $style) => [
            'id' => $style['id'],
            'num' => $style['num'],
            'name' => $style['name'],
            'note' => $style['note'],
            'mode' => $style['mode'],
            'thumb' => $style['thumb'],
            'url' => "/inspiration/{$style['id']}",
            'blueprint' => "/gallery/{$style['id']}.json",
        ], GalleryRegistry::all());
    }

    /**
     * One style's full grab-blueprint — card metadata + the design recipe — or
     * null if no such style exists.
     *
     * @return array<string, mixed>|null
     */
    public function blueprint(string $id): ?array
    {
        $style = GalleryRegistry::find($id);
        if ($style === null) {
            return null;
        }

        return array_merge([
            'id' => $style['id'],
            'num' => $style['num'],
            'name' => $style['name'],
            'note' => $style['note'],
            'mode' => $style['mode'],
            'thumb' => $style['thumb'],
            'url' => "/inspiration/{$style['id']}",
            'kind' => 'design-blueprint',
            'usage' => 'Read-only design inspiration. Re-implement this recipe in your project with the Fancy UI kit — restyle the primitives, bring your own content. Not source to vendor; composable with other gallery blueprints.',
        ], $this->loadRecipe($id));
    }

    /**
     * Read + validate the per-style recipe from its blueprint.json, keeping only
     * the recipe fields. Returns [] when the file is missing or malformed.
     *
     * @return array<string, mixed>
     */
    private function loadRecipe(string $id): array
    {
        $path = resource_path("js/Pages/Inspiration/styles/{$id}.blueprint.json");
        if (! File::exists($path)) {
            return [];
        }

        $data = json_decode(File::get($path), true);
        if (! is_array($data)) {
            return [];
        }

        return array_intersect_key($data, array_flip(self::RECIPE_KEYS));
    }
}

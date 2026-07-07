<?php

namespace App\Support\Gallery;

use App\Support\GalleryRegistry;
use Illuminate\Support\Facades\File;

/**
 * Source for the Inspiration Gallery's "grab" blueprints — the agent-readable
 * design recipes behind every collection's styles (FIELDWORK, Mom-n-Pops, …).
 *
 * Each style ships a co-located blueprint under
 * resources/js/Pages/Inspiration/styles/{collection}/{id}.blueprint.json,
 * authored when the style was built. This source merges that recipe with the
 * {@see GalleryRegistry} card metadata and serves it via the /gallery/* routes
 * + the gallery MCP tools.
 *
 * Blueprints are READ-ONLY inspiration: a recipe an agent RE-IMPLEMENTS in a
 * project (composable / mix-and-matchable), never vendored source.
 */
class GallerySource
{
    /** Recipe fields owned by the blueprint file (metadata comes from the registry). */
    private const RECIPE_KEYS = ['thesis', 'tokens', 'layout', 'sections', 'palette', 'contentArchetype', 'remix'];

    private const USAGE = 'Read-only design inspiration. Re-implement this recipe in your project with the Fancy UI kit — restyle the primitives, bring your own content. Not source to vendor; composable with other gallery blueprints.';

    /**
     * The full catalog index — every collection's meta + every style's card.
     *
     * @return array{collections: list<array<string, mixed>>, styles: list<array<string, mixed>>}
     */
    public function index(): array
    {
        $styles = [];
        foreach (GalleryRegistry::collections() as $collection) {
            foreach (GalleryRegistry::styles($collection['id']) as $style) {
                $styles[] = $this->card($style);
            }
        }

        return [
            'collections' => GalleryRegistry::collections(),
            'styles' => $styles,
        ];
    }

    /**
     * One collection's index — its meta + its styles' cards — or null.
     *
     * @return array<string, mixed>|null
     */
    public function collectionIndex(string $collection): ?array
    {
        $meta = GalleryRegistry::collection($collection);
        if ($meta === null) {
            return null;
        }

        $meta['styles'] = array_map($this->card(...), $meta['styles']);

        return $meta;
    }

    /**
     * One style's full grab-blueprint — card metadata + the design recipe — or
     * null if no such style exists in the collection.
     *
     * @return array<string, mixed>|null
     */
    public function blueprint(string $collection, string $id): ?array
    {
        $style = GalleryRegistry::find($collection, $id);
        if ($style === null) {
            return null;
        }

        return array_merge(
            $this->card($style),
            ['kind' => 'design-blueprint', 'usage' => self::USAGE],
            $this->loadRecipe($collection, $id),
        );
    }

    /**
     * Legacy pre-collection lookup — resolve a bare style id across every
     * collection (ids are globally unique; enforced by tests).
     *
     * @return array<string, mixed>|null
     */
    public function blueprintAnywhere(string $id): ?array
    {
        $style = GalleryRegistry::findAnywhere($id);

        return $style === null ? null : $this->blueprint($style['collection'], $id);
    }

    /**
     * A style's card — registry metadata + canonical URLs.
     *
     * @param  array<string, mixed>  $style
     * @return array<string, mixed>
     */
    private function card(array $style): array
    {
        return $style + [
            'url' => "/inspiration/{$style['collection']}/{$style['id']}",
            'blueprint' => "/gallery/{$style['collection']}/{$style['id']}.json",
        ];
    }

    /**
     * Read + validate the per-style recipe from its blueprint.json, keeping only
     * the recipe fields. Returns [] when the file is missing or malformed.
     *
     * @return array<string, mixed>
     */
    private function loadRecipe(string $collection, string $id): array
    {
        $path = resource_path("js/Pages/Inspiration/styles/{$collection}/{$id}.blueprint.json");
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

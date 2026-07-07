<?php

namespace App\Mcp\Tools;

use App\Support\Gallery\GallerySource;
use Illuminate\Contracts\JsonSchema\JsonSchema;
use Laravel\Mcp\Request;
use Laravel\Mcp\Response;
use Laravel\Mcp\Server\Attributes\Description;
use Laravel\Mcp\Server\Tool;

#[Description('Fetch one Inspiration Gallery style\'s full design BLUEPRINT — a recipe to re-create the look with the Fancy UI kit: design tokens (color/type/spacing/radii/motion), the layout, the per-section components, how each primitive is restyled, the content archetype, and remix notes. READ-ONLY inspiration, NOT source to vendor; it composes with other blueprints, so grab several and blend them into one direction. Style ids are unique across collections, so `style` alone is enough; pass `collection` ("fieldwork" or "mom-n-pops") to be explicit. Use `gallery_list_styles` for valid ids.')]
class GalleryGetBlueprint extends Tool
{
    public function handle(Request $request, GallerySource $gallery): Response
    {
        $style = (string) $request->get('style', '');
        if ($style === '') {
            return Response::error('`style` is required (e.g. "swiss", "neobrutal", "tacos", "boba"). Use `gallery_list_styles` to discover valid ids.');
        }

        $collection = (string) $request->get('collection', '');
        $blueprint = $collection !== ''
            ? $gallery->blueprint($collection, $style)
            : $gallery->blueprintAnywhere($style);

        if ($blueprint === null) {
            $where = $collection !== '' ? " in collection '{$collection}'" : '';

            return Response::error("Gallery style '{$style}' not found{$where}. Use `gallery_list_styles` to discover valid ids.");
        }

        return Response::json($blueprint);
    }

    /** @return array<string, JsonSchema> */
    public function schema(JsonSchema $schema): array
    {
        return [
            'style' => $schema->string()
                ->description('Style id from the gallery (e.g. "swiss", "editorial", "terminal", "agentic" — or "tacos", "ramen", "boba" from mom-n-pops). Get valid ids from `gallery_list_styles`.')
                ->required(),
            'collection' => $schema->string()
                ->description('Optional collection id ("fieldwork" or "mom-n-pops"). Ids are unique across collections, so this is only needed to be explicit.'),
        ];
    }
}

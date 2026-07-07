<?php

namespace App\Mcp\Tools;

use App\Support\Gallery\GallerySource;
use Illuminate\Contracts\JsonSchema\JsonSchema;
use Laravel\Mcp\Request;
use Laravel\Mcp\Response;
use Laravel\Mcp\Server\Attributes\Description;
use Laravel\Mcp\Server\Tool;

#[Description('List the Fancy UI Inspiration Gallery — fictional businesses, each designed 20 ways from restyled Fancy primitives: "fieldwork" (FIELDWORK, a studio portfolio, common → experimental) and "mom-n-pops" (a Milwaukee family food truck, one cuisine per style, storefront → data surface, with live Fancy surfaces woven in: order trackers, configurators, a reservations calendar, ⌘K ordering, agentic catering). These are READ-ONLY design blueprints (recipes to re-implement, never source to copy). Optional `collection` argument narrows to one collection; omit it for every collection + every style. Returns per style: id, collection, name, note, light/dark mode, the live URL, a thumbnail, and the blueprint URL. Use this in the DESIGN phase of a new project or a redesign; then `gallery_get_blueprint` fetches one style\'s full recipe (grab several to blend).')]
class GalleryListStyles extends Tool
{
    public function handle(Request $request, GallerySource $gallery): Response
    {
        $usage = 'Read-only design inspiration. Surface these to the user (or send them to browse the gallery at /inspiration); have them pick one or blend several, then fetch the recipe(s) with gallery_get_blueprint and re-implement the look with the Fancy UI kit — restyle the primitives, bring their own content. Not source to vendor.';

        $collection = (string) $request->get('collection', '');
        if ($collection !== '') {
            $index = $gallery->collectionIndex($collection);
            if ($index === null) {
                return Response::error("Gallery collection '{$collection}' not found. Omit `collection` (or use gallery_list_styles with no arguments) to discover valid collection ids.");
            }

            return Response::json([
                'kind' => 'design-blueprints',
                'usage' => $usage,
                'collection' => $collection,
                'count' => count($index['styles']),
            ] + $index);
        }

        $index = $gallery->index();

        return Response::json([
            'kind' => 'design-blueprints',
            'usage' => $usage,
            'count' => count($index['styles']),
            'collections' => $index['collections'],
            'styles' => $index['styles'],
        ]);
    }

    /** @return array<string, JsonSchema> */
    public function schema(JsonSchema $schema): array
    {
        return [
            'collection' => $schema->string()
                ->description('Optional collection id to narrow the listing ("fieldwork" or "mom-n-pops"). Omit for every collection + every style.'),
        ];
    }
}

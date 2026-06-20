<?php

namespace App\Mcp\Tools;

use App\Support\Gallery\GallerySource;
use Illuminate\Contracts\JsonSchema\JsonSchema;
use Laravel\Mcp\Request;
use Laravel\Mcp\Response;
use Laravel\Mcp\Server\Attributes\Description;
use Laravel\Mcp\Server\Tool;

#[Description('List the 20 styles in the Fancy UI Inspiration Gallery — one fictional studio portfolio ("FIELDWORK") designed 20 ways, common → experimental, every one from restyled Fancy primitives. These are READ-ONLY design blueprints (recipes to re-implement, never source to copy). No arguments. Returns id, name, note, light/dark mode, the live URL, a thumbnail, and the blueprint URL for each style. Use this in the DESIGN phase of a new project or a redesign; then `gallery_get_blueprint` fetches one style\'s full recipe (grab several to blend).')]
class GalleryListStyles extends Tool
{
    public function handle(Request $request, GallerySource $gallery): Response
    {
        $styles = $gallery->index();

        return Response::json([
            'kind' => 'design-blueprints',
            'usage' => 'Read-only design inspiration. Surface these to the user (or send them to browse the gallery at /inspiration); have them pick one or blend several, then fetch the recipe(s) with gallery_get_blueprint and re-implement the look with the Fancy UI kit — restyle the primitives, bring their own content. Not source to vendor.',
            'count' => count($styles),
            'styles' => $styles,
        ]);
    }

    /** @return array<string, JsonSchema> */
    public function schema(JsonSchema $schema): array
    {
        return [];
    }
}

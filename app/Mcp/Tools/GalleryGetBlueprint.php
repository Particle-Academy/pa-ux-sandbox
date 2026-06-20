<?php

namespace App\Mcp\Tools;

use App\Support\Gallery\GallerySource;
use Illuminate\Contracts\JsonSchema\JsonSchema;
use Laravel\Mcp\Request;
use Laravel\Mcp\Response;
use Laravel\Mcp\Server\Attributes\Description;
use Laravel\Mcp\Server\Tool;

#[Description('Fetch one Inspiration Gallery style\'s full design BLUEPRINT — a recipe to re-create the look with the Fancy UI kit: design tokens (color/type/spacing/radii/motion), the layout, the per-section components, how each primitive is restyled, the content archetype, and remix notes. READ-ONLY inspiration, NOT source to vendor; it composes with other blueprints, so grab several and blend them into one direction. Use `gallery_list_styles` for valid style ids.')]
class GalleryGetBlueprint extends Tool
{
    public function handle(Request $request, GallerySource $gallery): Response
    {
        $style = (string) $request->get('style', '');
        if ($style === '') {
            return Response::error('`style` is required (e.g. "swiss", "dark", "neobrutal"). Use `gallery_list_styles` to discover valid ids.');
        }

        $blueprint = $gallery->blueprint($style);
        if ($blueprint === null) {
            return Response::error("Gallery style '{$style}' not found. Use `gallery_list_styles` to discover valid ids.");
        }

        return Response::json($blueprint);
    }

    /** @return array<string, JsonSchema> */
    public function schema(JsonSchema $schema): array
    {
        return [
            'style' => $schema->string()
                ->description('Style id from the gallery (e.g. "swiss", "dark", "editorial", "bento", "terminal", "neobrutal", "agentic"). Get valid ids from `gallery_list_styles`.')
                ->required(),
        ];
    }
}

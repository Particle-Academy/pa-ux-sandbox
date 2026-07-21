<?php

namespace App\Mcp\Tools;

use App\Support\PackageFamily;
use App\Support\Registry\RegistrySource;
use Illuminate\Contracts\JsonSchema\JsonSchema;
use Laravel\Mcp\Request;
use Laravel\Mcp\Response;
use Laravel\Mcp\Server\Attributes\Description;
use Laravel\Mcp\Server\Tool;

#[Description('List every component available in the Fancy UI registry, grouped by package FAMILY (the same product grouping the /packages page uses — Core, Surfaces, Documents, Commerce, Platform, Tooling). No arguments. Each entry carries slug, title, package, one-line description, and its `family`/`familyName`/`group` so a client can present the constellation rather than a flat repo list. Pair with `get_component` to fetch full source.')]
class ListComponents extends Tool
{
    public function handle(Request $request, RegistrySource $registry): Response
    {
        // Family is looked up once per package, not once per component: 243
        // components span ~60 packages, and groupFor() walks every family.
        $families = [];

        $items = collect($registry->all())->map(function ($item) use (&$families) {
            $families[$item->package] ??= PackageFamily::groupFor($item->package);
            $group = $families[$item->package];

            return [
                'name' => $item->name,
                'title' => $item->title,
                'package' => $item->package,
                'description' => $item->description,
                'family' => $group['family'],
                'familyName' => $group['familyName'],
                'group' => $group['group'],
                'url' => "/r/{$item->name}.json",
            ];
        })->values()->all();

        return Response::json([
            'count' => count($items),
            // The theme order the listing groups families in, so a client shows
            // them the way /packages does rather than inventing its own order.
            'groups' => PackageFamily::themeOrder(),
            'items' => $items,
        ]);
    }

    /** @return array<string, JsonSchema> */
    public function schema(JsonSchema $schema): array
    {
        return [];
    }
}

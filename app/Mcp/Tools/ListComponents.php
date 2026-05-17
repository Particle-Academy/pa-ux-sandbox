<?php

namespace App\Mcp\Tools;

use App\Support\Registry\RegistrySource;
use Illuminate\Contracts\JsonSchema\JsonSchema;
use Laravel\Mcp\Request;
use Laravel\Mcp\Response;
use Laravel\Mcp\Server\Attributes\Description;
use Laravel\Mcp\Server\Tool;

#[Description('List every component available in the Fancy UI registry, grouped by package. No arguments. Returns slug, title, package, and a one-line description for each. Pair with `get_component` to fetch full source.')]
class ListComponents extends Tool
{
    public function handle(Request $request, RegistrySource $registry): Response
    {
        $items = collect($registry->all())->map(fn ($item) => [
            'name' => $item->name,
            'title' => $item->title,
            'package' => $item->package,
            'description' => $item->description,
            'url' => "/r/{$item->name}.json",
        ])->values()->all();

        return Response::json([
            'count' => count($items),
            'items' => $items,
        ]);
    }

    /** @return array<string, JsonSchema> */
    public function schema(JsonSchema $schema): array
    {
        return [];
    }
}

<?php

namespace App\Mcp\Tools;

use App\Support\Registry\RegistrySource;
use Illuminate\Contracts\JsonSchema\JsonSchema;
use Illuminate\Support\Str;
use Laravel\Mcp\Request;
use Laravel\Mcp\Response;
use Laravel\Mcp\Server\Attributes\Description;
use Laravel\Mcp\Server\Tool;

#[Description('Search Fancy UI components by substring across name, title, and description. Returns matching components with their slugs and one-line descriptions. Use this when the user mentions a UI concept ("calendar", "drag-and-drop", "data grid") and you need to find the right primitive.')]
class SearchComponents extends Tool
{
    public function handle(Request $request, RegistrySource $registry): Response
    {
        $query = Str::lower((string) $request->get('query', ''));
        if ($query === '') {
            return Response::error('`query` is required.');
        }

        $matches = collect($registry->all())
            ->filter(fn ($item) => Str::contains(
                Str::lower($item->name.' '.$item->title.' '.$item->description),
                $query,
            ))
            ->map(fn ($item) => [
                'name' => $item->name,
                'title' => $item->title,
                'package' => $item->package,
                'description' => $item->description,
                'url' => "/r/{$item->name}.json",
            ])
            ->values()
            ->all();

        return Response::json([
            'query' => $query,
            'count' => count($matches),
            'items' => $matches,
        ]);
    }

    /** @return array<string, JsonSchema> */
    public function schema(JsonSchema $schema): array
    {
        return [
            'query' => $schema->string()
                ->description('Substring to search for. Case-insensitive. Matches name, title, and description.')
                ->required(),
        ];
    }
}

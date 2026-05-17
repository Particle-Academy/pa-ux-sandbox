<?php

namespace App\Mcp\Tools;

use App\Support\Registry\RegistrySource;
use Illuminate\Contracts\JsonSchema\JsonSchema;
use Laravel\Mcp\Request;
use Laravel\Mcp\Response;
use Laravel\Mcp\Server\Attributes\Description;
use Laravel\Mcp\Server\Tool;

#[Description('Fetch the full registry bundle for one Fancy UI component — every source file with its content, npm dependencies, and registry dependencies. Use this when you are about to install (write the files into the user\'s codebase) or when you need to inspect the source.')]
class GetComponent extends Tool
{
    public function handle(Request $request, RegistrySource $registry): Response
    {
        $name = (string) $request->get('name', '');
        if ($name === '') {
            return Response::error('`name` is required.');
        }

        $item = $registry->find($name);
        if (! $item) {
            return Response::error("Component '$name' not found in the registry. Use `search_components` or `list_components` to discover valid slugs.");
        }

        return Response::json($item->toArray());
    }

    /** @return array<string, JsonSchema> */
    public function schema(JsonSchema $schema): array
    {
        return [
            'name' => $schema->string()
                ->description('Component slug (e.g. "card", "tabs", "magic-wand"). Get valid slugs from `list_components` or `search_components`.')
                ->required(),
        ];
    }
}

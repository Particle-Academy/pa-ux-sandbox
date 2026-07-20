<?php

namespace App\Mcp\Tools;

use App\Models\FlowNodePackage;
use Illuminate\Contracts\JsonSchema\JsonSchema;
use Laravel\Mcp\Request;
use Laravel\Mcp\Response;
use Laravel\Mcp\Server\Attributes\Description;
use Laravel\Mcp\Server\Tool;

#[Description('List every published fancy-flow MARKETPLACE node package, grouped by category. These are installable third-party nodes — fancy-flow\'s ~25 core builtins are NOT here, because they ship with the engine and need no installation. Each entry shows which runtimes it implements (ts / php): a node that does not implement the runtime the project executes on cannot run there.')]
class ListNodes extends Tool
{
    public function handle(Request $request): Response
    {
        $runtime = (string) $request->get('runtime', '');

        $items = FlowNodePackage::query()
            ->listed()
            ->orderBy('category')
            ->orderBy('kind')
            ->get()
            // Filter in PHP rather than SQL: `runtimes` is a JSON column and a
            // portable containment query across sqlite/mysql is not worth it
            // for a list this small.
            ->when($runtime !== '', fn ($rows) => $rows->filter(
                fn (FlowNodePackage $p) => in_array($runtime, $p->runtimes ?? [], true),
            ))
            ->map(fn (FlowNodePackage $p) => $p->toIndexEntry())
            ->values()
            ->all();

        return Response::json([
            'count' => count($items),
            'items' => $items,
            // Said explicitly, because an empty list otherwise reads as a
            // broken tool rather than an empty marketplace.
            'note' => $items === []
                ? 'No marketplace nodes are published yet. fancy-flow\'s core builtins ship with the engine and are not listed here — use them directly rather than installing anything.'
                : 'Install with: npx fancy-cli add node <kind>',
        ]);
    }

    /** @return array<string, JsonSchema> */
    public function schema(JsonSchema $schema): array
    {
        return [
            'runtime' => $schema->string()
                ->description('Optional. Only return nodes implementing this runtime ("ts" or "php"). Use it when the project executes on one of them, so you do not suggest a node that cannot run there.'),
        ];
    }
}

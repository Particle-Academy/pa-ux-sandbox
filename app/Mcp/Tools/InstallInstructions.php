<?php

namespace App\Mcp\Tools;

use App\Support\PackageRegistry;
use App\Support\Registry\RegistrySource;
use Illuminate\Contracts\JsonSchema\JsonSchema;
use Laravel\Mcp\Request;
use Laravel\Mcp\Response;
use Laravel\Mcp\Server\Attributes\Description;
use Laravel\Mcp\Server\Tool;

#[Description('Get install instructions for a Fancy UI component — both the npm-package path AND the vendor-the-source CLI path. Returns commands the agent can run (or instruct the user to run) plus the import line. Always prefer this over inventing install commands from memory.')]
class InstallInstructions extends Tool
{
    public function handle(Request $request, RegistrySource $registry): Response
    {
        $name = (string) $request->get('name', '');
        if ($name === '') {
            return Response::error('`name` is required.');
        }

        $item = $registry->find($name);
        if (! $item) {
            return Response::error("Component '$name' not found. Try `search_components` first.");
        }

        $pkg = PackageRegistry::find($item->package);
        $npmName = $pkg['npm'] ?? null;
        $composerName = $pkg['composer'] ?? null;
        $title = $item->title;

        return Response::json([
            'component' => $name,
            'title' => $title,
            'package' => $item->package,
            'npm_path' => $npmName ? [
                'install' => [
                    "npm install $npmName",
                    "pnpm add $npmName",
                    "yarn add $npmName",
                ],
                'import' => "import { $title } from \"$npmName\";",
            ] : null,
            'composer_path' => $composerName ? [
                'install' => "composer require $composerName",
            ] : null,
            // Copy-source path only applies to components we ship source files
            // for. npm-only items (e.g. the WebGL engine adapters, whose source
            // can't be vendored — it needs the engine) install via npm_path.
            'vendor_path' => ($npmName && $item->files !== []) ? [
                'install' => "npx fancy-ui@latest add $name",
                'lands_at' => "src/components/fancy/$name/",
                'import' => "import { $title } from \"@/components/fancy/$name\";",
                'pulls_in' => array_merge($item->dependencies, $item->registryDependencies),
            ] : null,
            'npm_only' => $item->files === [],
            'docs' => $name === $item->package
                ? "https://ui.particle.academy/packages/{$item->package}"
                : "https://ui.particle.academy/packages/{$item->package}/{$name}",
        ]);
    }

    /** @return array<string, JsonSchema> */
    public function schema(JsonSchema $schema): array
    {
        return [
            'name' => $schema->string()
                ->description('Component slug (e.g. "card"). Use `search_components` to discover.')
                ->required(),
        ];
    }
}

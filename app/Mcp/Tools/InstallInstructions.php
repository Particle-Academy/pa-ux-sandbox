<?php

namespace App\Mcp\Tools;

use App\Support\PackageFamily;
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

        $pkg = PackageRegistry::findAny($item->package);
        $npmName = $pkg['npm'] ?? null;
        $title = $item->title;
        $safeAlias = preg_replace('/[^A-Za-z0-9_$]/', '', ucwords((string) $title, '-_ ')) ?: 'pkg';

        // Every language this CAPABILITY ships in, not just the one the
        // component's own package happens to be written in.
        //
        // This used to read `$pkg['composer']` — the component's own package —
        // and a capability's PHP twin is a DIFFERENT package: `fancy-flow` on
        // npm, `fancy-flow-php` on Packagist, `fancy-flow` on PyPI. So the key
        // was never there, the tool answered `composer_path: null`, and there
        // was no `pypi` field at all.
        //
        // A consumer building a trading system checked this exact call before
        // concluding our Python runtime did not exist. It did — it had shipped
        // that morning. Their words: "I'd rather be told 'unknown' than told
        // 'no'." The tool was not silent; it was confidently wrong, on the one
        // surface that exists to answer this question.
        $twins = PackageFamily::twinsFor($item->package);
        $composerName = $pkg['composer'] ?? ($twins['composer'] ?? null);
        $pypiName = $pkg['pypi'] ?? ($twins['pypi'] ?? null);

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
                // A component title is an identifier; a PACKAGE title is not.
                // `import { fancy-flow } from ...` is a syntax error, and it was
                // being emitted for every package-level lookup.
                'import' => preg_match('/^[A-Za-z_$][A-Za-z0-9_$]*$/', $title) === 1
                    ? "import { $title } from \"$npmName\";"
                    : "import * as $safeAlias from \"$npmName\";",
            ] : null,
            'composer_path' => $composerName ? [
                'install' => "composer require $composerName",
            ] : null,
            'pypi_path' => $pypiName ? [
                'install' => "pip install $pypiName",
            ] : null,
            // Copy-source path only applies to components we ship source files
            // for. npm-only items (e.g. the WebGL engine adapters, whose source
            // can't be vendored — it needs the engine) install via npm_path.
            'vendor_path' => ($npmName && $item->files !== []) ? [
                'install' => "npx fancy-cli@latest add $name",
                'lands_at' => "src/components/fancy/$name/",
                'import' => "import { $title } from \"@/components/fancy/$name\";",
                'pulls_in' => array_merge($item->dependencies, $item->registryDependencies),
            ] : null,
            // DERIVED, never assumed — and it used to mean something else.
            //
            // `npm_only` was `$item->files === []`, which answers "is there
            // vendorable source", not "is npm the only way to get this". For a
            // capability with a PHP and a Python twin it reported TRUE, which is
            // simply false, and consumers reasonably read it as authoritative.
            //
            // `vendor_only_via_npm` keeps the original question under a name
            // that asks it, so nothing silently changes meaning for a reader who
            // knew the old field.
            'npm_only' => $composerName === null && $pypiName === null && $npmName !== null,
            'vendor_only_via_npm' => $item->files === [],
            'available_in' => array_values(array_filter([
                $npmName ? 'npm' : null,
                $composerName ? 'packagist' : null,
                $pypiName ? 'pypi' : null,
            ])),
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

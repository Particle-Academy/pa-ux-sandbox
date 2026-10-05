<?php

namespace App\Http\Controllers\Showcase;

use App\Http\Controllers\Controller;
use Illuminate\Support\Facades\File;
use Symfony\Component\HttpFoundation\BinaryFileResponse;
use ZipArchive;

/**
 * Bundles a starter kit's source into a downloadable, runnable Vite + React +
 * Fancy UI project zip.
 *
 * Each kit's main React component lives at
 * resources/js/Pages/StarterKits/kits/{Name}.tsx in the showcase. We read it
 * from disk, rename the export to `Kit`, and wrap it in a tiny standalone
 * project template (package.json, vite.config.ts, tsconfig, index.html,
 * main.tsx, App.tsx). The user gets a zip they can `npm install && npm run
 * dev` to spin up.
 */
class StarterKitDownloadController extends Controller
{
    /** Map kit slug → source-file basename (no extension). */
    private const SOURCE_BY_SLUG = [
        'fancy-query' => 'RealtimeChatKit',
        'react-fancy' => 'ReactDashboardKit',
        'fancy-flow' => 'WorkflowStudioKit',
        'fancy-whiteboard' => 'CollabBoardKit',
        'fancy-code' => 'EmbeddedIdeKit',
        'fancy-sheets' => 'SpreadsheetStudioKit',
        'fancy-echarts' => 'DiagramStudioKit',
        'shop-n-sub' => 'ShopNSubKit',
    ];

    /**
     * Kits that import the vendored catalog-fms components (`@/components/fancy/
     * catalog-fms`). Their zip must bundle those component files + an `@` alias.
     */
    private const BUNDLES_CATALOG_FMS = ['shop-n-sub'];

    public function __invoke(string $slug): BinaryFileResponse
    {
        $kit = collect(StarterKitController::kits())->firstWhere('slug', $slug);
        abort_if($kit === null, 404, "Unknown starter kit: $slug");

        $sourceName = self::SOURCE_BY_SLUG[$slug] ?? abort(404, "Unknown starter kit source: $slug");
        $sourcePath = base_path("resources/js/Pages/StarterKits/kits/$sourceName.tsx");
        abort_unless(File::exists($sourcePath), 500, "Source file missing: $sourceName.tsx");

        $sourceCode = File::get($sourcePath);
        // Standardize the exported component to `Kit` so App.tsx can import it
        // by a uniform name regardless of which kit was downloaded.
        $kitSrc = preg_replace('/export\s+function\s+'.preg_quote($sourceName, '/').'\s*\(/', 'export function Kit(', $sourceCode);

        // Kits that import the vendored catalog-fms components get those files
        // bundled into src/ plus an `@` -> ./src alias in vite/tsconfig.
        $bundlesComponents = in_array($slug, self::BUNDLES_CATALOG_FMS, true);

        $tmp = tempnam(sys_get_temp_dir(), 'fancy-kit-');
        $zip = new ZipArchive;
        $opened = $zip->open($tmp, ZipArchive::CREATE | ZipArchive::OVERWRITE);
        abort_if($opened !== true, 500, "Could not open zip for writing: $opened");

        $root = "$slug-starter/";
        $zip->addFromString($root.'README.md', $this->readme($kit));
        $zip->addFromString($root.'.gitignore', "node_modules\ndist\n.DS_Store\n*.log\n");
        $zip->addFromString($root.'package.json', $this->packageJson($kit));
        $zip->addFromString($root.'vite.config.ts', $this->viteConfig($bundlesComponents));
        $zip->addFromString($root.'tsconfig.json', $this->tsConfig($bundlesComponents));
        $zip->addFromString($root.'tsconfig.node.json', $this->tsConfigNode());
        $zip->addFromString($root.'index.html', $this->indexHtml($kit));
        $zip->addFromString($root.'src/main.tsx', $this->mainTsx());
        $zip->addFromString($root.'src/App.tsx', $this->appTsx($kit));
        $zip->addFromString($root.'src/index.css', $this->indexCss());
        $zip->addFromString($root.'src/Kit.tsx', $kitSrc);

        if ($bundlesComponents) {
            $this->bundleCatalogFms($zip, $root);
        }

        $zip->close();

        return response()
            ->download($tmp, "$slug-starter.zip", [
                'Content-Type' => 'application/zip',
                'Cache-Control' => 'no-store',
            ])
            ->deleteFileAfterSend();
    }

    /** @param  array<string, string>  $kit */
    private function readme(array $kit): string
    {
        $bundles = in_array($kit['slug'], self::BUNDLES_CATALOG_FMS, true);
        $headline = $bundles
            ? 'This kit vendors the **catalog-fms** UI block — the same components you can drop into any project with `npx fancy-cli@latest add catalog-fms`.'
            : "Headline package: `@particle-academy/{$kit['pkg']}`.";
        $depLine = $bundles
            ? '- The **catalog-fms** components are vendored into `src/components/fancy/catalog-fms/` — edit them freely (they only need `@particle-academy/react-fancy`).'
            : "- `@particle-academy/{$kit['pkg']}` — the headline package this kit is built on";

        return <<<MD
# {$kit['name']} — Fancy UI starter

{$kit['blurb']}

Built from the [Fancy UI](https://ui.particle.academy) component set. {$headline}

## Quick start

```bash
npm install
npm run dev
```

That's it. The starter is a stock Vite + React 19 + Tailwind v4 project.

## What's in this zip

- `index.html`              Entry HTML
- `src/main.tsx`            React root + Toast.Provider
- `src/App.tsx`             Page shell
- `src/Kit.tsx`             The {$kit['name']} surface (this is the file you'll edit)
- `src/index.css`           Tailwind v4 + theme tokens
- `vite.config.ts`          Vite + React + Tailwind plugins
- `tsconfig.json`           TypeScript config

## Dependencies

- `react`, `react-dom` (v19)
- `@particle-academy/react-fancy` — the Tailwind v4 component library
{$depLine}

All versions are pinned to the same releases the live showcase runs, so what you
download matches what you see at ui.particle.academy.

## Going deeper

- Live demo: https://ui.particle.academy/starter-kits/{$kit['slug']}
- Package docs: https://ui.particle.academy/packages/{$kit['pkg']}
- Whitepaper (Human+ UX): https://ui.particle.academy/docs/human-plus-ux

## License

MIT — fork, ship, sell.
MD;
    }

    /** @param  array<string, string>  $kit */
    private function packageJson(array $kit): string
    {
        $pkg = [
            'name' => $kit['slug'].'-starter',
            'private' => true,
            'version' => '0.1.0',
            'type' => 'module',
            'scripts' => [
                'dev' => 'vite',
                'build' => 'vite build',
                'preview' => 'vite preview',
                'typecheck' => 'tsc -b',
            ],
            /*
             * The base three come from THIS APP, like the per-kit extras.
             *
             * They were hardcoded, and `@particle-academy/react-fancy` sat at
             * `^4.11.0` while the kit it shipped inside declared 5.x — so every
             * downloaded starter kit installed a react-fancy a whole MAJOR
             * behind, for every kit, not just the ones with extra dependencies.
             *
             * Missed entirely by the first version of
             * `StarterKitDependenciesAreCurrentTest`, which checked
             * `extraDependencies` through reflection and never read the
             * package.json a consumer receives. A helper can be right while the
             * artifact is wrong.
             */
            'dependencies' => array_merge(
                $this->requiredVersions([
                    '@particle-academy/react-fancy',
                    'react',
                    'react-dom',
                ]),
                $this->extraDependencies($kit['slug']),
            ),
            'devDependencies' => [
                '@tailwindcss/vite' => '^4.0.0',
                '@types/react' => '^19.0.0',
                '@types/react-dom' => '^19.0.0',
                '@vitejs/plugin-react' => '^5.0.0',
                'tailwindcss' => '^4.0.0',
                'typescript' => '^5.4.0',
                'vite' => '^6.0.0',
            ],
        ];

        return json_encode($pkg, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES)."\n";
    }

    /**
     * Extra dependencies a kit needs beyond react-fancy, with the versions THIS
     * APP installs.
     *
     * Read from the showcase's own `package.json` rather than written here, and
     * that is the whole point. The versions used to be hand-maintained, under a
     * comment that correctly predicted the cost: a caret on a `0.x` pins the
     * MINOR, so `^0.5.3` never advances to `0.79.2` and a stale pin ships users
     * an old — or vulnerable — release forever.
     *
     * The warning was right and nothing enforced it. By 2026-10-04 all six had
     * drifted, `fancy-flow` by 74 minor versions, so every downloaded kit was a
     * runnable project built on releases from long before the page offering it.
     *
     * The showcase is dogfooded — a rule requires it to take every first-party
     * release in the same session — so sourcing from it makes a kit current by
     * construction instead of by remembering. `StarterKitDependenciesAreCurrentTest`
     * fails if the two ever disagree.
     *
     * @return array<string, string>
     */
    private function extraDependencies(string $slug): array
    {
        $names = match ($slug) {
            'fancy-query' => ['@particle-academy/fancy-query', '@tanstack/react-query'],
            'react-fancy' => ['@particle-academy/fancy-echarts', 'echarts', 'lucide-react'],
            'fancy-flow' => ['@particle-academy/fancy-flow', '@xyflow/react'],
            'fancy-whiteboard' => ['@particle-academy/fancy-whiteboard'],
            'fancy-code' => ['@particle-academy/fancy-code'],
            'fancy-sheets' => ['@particle-academy/fancy-sheets'],
            'fancy-echarts' => ['@particle-academy/fancy-echarts', 'echarts', 'lucide-react'],
            default => [],
        };

        return $this->requiredVersions($names);
    }

    /**
     * Look each package up in this app's own dependencies.
     *
     * Loud, not lenient. Emitting a dependency without a version would produce a
     * package.json npm cannot resolve, and omitting it silently would ship a kit
     * whose imports have nothing behind them — both discovered by the person who
     * downloaded it rather than by us.
     *
     * @param  list<string>  $names
     * @return array<string, string>
     */
    private function requiredVersions(array $names): array
    {
        $installed = $this->installedVersions();
        $versions = [];

        foreach ($names as $name) {
            if (! isset($installed[$name])) {
                abort(500, "A starter kit needs $name, which this app does not install.");
            }

            $versions[$name] = $installed[$name];
        }

        return $versions;
    }

    /**
     * This app's own dependency versions.
     *
     * @return array<string, string>
     */
    private function installedVersions(): array
    {
        /** @var array{dependencies?: array<string, string>} $manifest */
        $manifest = json_decode((string) File::get(base_path('package.json')), true, 512, JSON_THROW_ON_ERROR);

        return $manifest['dependencies'] ?? [];
    }

    private function viteConfig(bool $withAtAlias = false): string
    {
        if ($withAtAlias) {
            return <<<'TS'
            import { fileURLToPath } from "node:url";
            import { defineConfig } from "vite";
            import react from "@vitejs/plugin-react";
            import tailwindcss from "@tailwindcss/vite";

            export default defineConfig({
              plugins: [react(), tailwindcss()],
              resolve: {
                alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
              },
            });
            TS;
        }

        return <<<'TS'
        import { defineConfig } from "vite";
        import react from "@vitejs/plugin-react";
        import tailwindcss from "@tailwindcss/vite";

        export default defineConfig({
          plugins: [react(), tailwindcss()],
        });
        TS;
    }

    private function tsConfig(bool $withAtAlias = false): string
    {
        $compilerOptions = [
            'target' => 'ES2022',
            'useDefineForClassFields' => true,
            'lib' => ['ES2022', 'DOM', 'DOM.Iterable'],
            'module' => 'ESNext',
            'skipLibCheck' => true,
            'moduleResolution' => 'bundler',
            'allowImportingTsExtensions' => true,
            'resolveJsonModule' => true,
            'isolatedModules' => true,
            'moduleDetection' => 'force',
            'noEmit' => true,
            'jsx' => 'react-jsx',
            'strict' => true,
            'noUnusedLocals' => false,
            'noUnusedParameters' => false,
            'noFallthroughCasesInSwitch' => true,
        ];

        if ($withAtAlias) {
            $compilerOptions = ['baseUrl' => '.', 'paths' => ['@/*' => ['src/*']]] + $compilerOptions;
        }

        return json_encode([
            'compilerOptions' => $compilerOptions,
            'include' => ['src'],
            'references' => [['path' => './tsconfig.node.json']],
        ], JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES)."\n";
    }

    /**
     * Bundle the vendored catalog-fms component source into the kit's zip at
     * src/components/fancy/catalog-fms/ so the kit's `@/components/fancy/
     * catalog-fms` imports resolve (paired with the `@` -> ./src alias).
     */
    private function bundleCatalogFms(ZipArchive $zip, string $root): void
    {
        $dir = base_path('resources/js/components/fancy/catalog-fms');

        foreach (File::files($dir) as $file) {
            $zip->addFromString(
                $root.'src/components/fancy/catalog-fms/'.$file->getFilename(),
                File::get($file->getPathname()),
            );
        }
    }

    private function tsConfigNode(): string
    {
        return <<<'JSON'
        {
          "compilerOptions": {
            "composite": true,
            "skipLibCheck": true,
            "module": "ESNext",
            "moduleResolution": "bundler",
            "allowSyntheticDefaultImports": true,
            "strict": true
          },
          "include": ["vite.config.ts"]
        }
        JSON;
    }

    /** @param  array<string, string>  $kit */
    private function indexHtml(array $kit): string
    {
        $title = htmlspecialchars($kit['name'], ENT_QUOTES);

        return <<<HTML
        <!doctype html>
        <html lang="en" class="dark">
          <head>
            <meta charset="UTF-8" />
            <meta name="viewport" content="width=device-width, initial-scale=1.0" />
            <link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect width='32' height='32' rx='7' fill='%237c3aed'/%3E%3Ctext x='16' y='23' font-family='system-ui,sans-serif' font-size='19' font-weight='700' fill='white' text-anchor='middle'%3EF%3C/text%3E%3C/svg%3E" />
            <title>{$title} · Fancy UI Starter</title>
          </head>
          <body class="bg-zinc-50 text-zinc-900 antialiased dark:bg-zinc-950 dark:text-zinc-100">
            <div id="root"></div>
            <script type="module" src="/src/main.tsx"></script>
          </body>
        </html>
        HTML;
    }

    private function mainTsx(): string
    {
        return <<<'TSX'
        import { StrictMode } from "react";
        import { createRoot } from "react-dom/client";
        import { Toast } from "@particle-academy/react-fancy";
        import "@particle-academy/react-fancy/styles.css";
        import "./index.css";
        import { App } from "./App";

        createRoot(document.getElementById("root")!).render(
          <StrictMode>
            <Toast.Provider position="bottom-right">
              <App />
            </Toast.Provider>
          </StrictMode>,
        );
        TSX;
    }

    /** @param  array<string, string>  $kit */
    private function appTsx(array $kit): string
    {
        $name = addslashes($kit['name']);
        $blurb = addslashes($kit['blurb']);

        return <<<TSX
        import { Kit } from "./Kit";

        export function App() {
          return (
            <div className="mx-auto max-w-7xl px-6 py-10">
              <header className="mb-8">
                <h1 className="text-2xl font-bold tracking-tight">{$name}</h1>
                <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">{$blurb}</p>
              </header>
              <Kit />
            </div>
          );
        }
        TSX;
    }

    private function indexCss(): string
    {
        return <<<'CSS'
        @import "tailwindcss";

        /* Tailwind v4 picks up `dark` from the `class` attribute on <html>. */
        @custom-variant dark (&:where(.dark, .dark *));
        CSS;
    }
}

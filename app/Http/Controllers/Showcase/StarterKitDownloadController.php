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
        'react-fancy' => 'ReactDashboardKit',
        'fancy-flow' => 'WorkflowStudioKit',
        'fancy-whiteboard' => 'CollabBoardKit',
        'fancy-code' => 'EmbeddedIdeKit',
        'fancy-sheets' => 'SpreadsheetStudioKit',
        'fancy-echarts' => 'DiagramStudioKit',
    ];

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

        $tmp = tempnam(sys_get_temp_dir(), 'fancy-kit-');
        $zip = new ZipArchive;
        $opened = $zip->open($tmp, ZipArchive::CREATE | ZipArchive::OVERWRITE);
        abort_if($opened !== true, 500, "Could not open zip for writing: $opened");

        $root = "$slug-starter/";
        $zip->addFromString($root.'README.md', $this->readme($kit));
        $zip->addFromString($root.'.gitignore', "node_modules\ndist\n.DS_Store\n*.log\n");
        $zip->addFromString($root.'package.json', $this->packageJson($kit));
        $zip->addFromString($root.'vite.config.ts', $this->viteConfig());
        $zip->addFromString($root.'tsconfig.json', $this->tsConfig());
        $zip->addFromString($root.'tsconfig.node.json', $this->tsConfigNode());
        $zip->addFromString($root.'index.html', $this->indexHtml($kit));
        $zip->addFromString($root.'src/main.tsx', $this->mainTsx());
        $zip->addFromString($root.'src/App.tsx', $this->appTsx($kit));
        $zip->addFromString($root.'src/index.css', $this->indexCss());
        $zip->addFromString($root.'src/Kit.tsx', $kitSrc);

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
        return <<<MD
# {$kit['name']} — Fancy UI starter

{$kit['blurb']}

Built from the [Fancy UI](https://ui.particle.academy) component set. Headline package: `@particle-academy/{$kit['pkg']}`.

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

- `react`, `react-dom`
- `@particle-academy/react-fancy` — the Tailwind v4 component library Kit.tsx uses

## Going deeper

- Live demo: https://ui.particle.academy/starter-kits/{$kit['slug']}
- All components: https://ui.particle.academy/packages/react-fancy
- Whitepaper (Human+ UX): https://ui.particle.academy/docs/human-plus-ux

## Known: TypeScript strict mode

`npm run dev` and `npm run build` work out of the box. `npm run typecheck` may surface type errors in `@particle-academy/react-fancy@^3` — specifically `Heading` accepts a `level` prop at runtime that isn't in the published `.d.ts` yet, and `Badge` accepts a few colors (`emerald`) the type union doesn't list. This is a known gap in the published types; runtime behavior is correct. Tracking fix in react-fancy 3.1.

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
            'dependencies' => array_merge(
                [
                    '@particle-academy/react-fancy' => '^3.0.0',
                    'react' => '^19.0.0',
                    'react-dom' => '^19.0.0',
                ],
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
     * Some kits import their headline package directly (e.g. the
     * Diagram Studio kit uses `<DataDiagram>` / `<OrgChart>` from
     * fancy-echarts). Those need the package in dependencies on top of
     * the always-on react-fancy. Kits that are visual mocks of their
     * package (and only import react-fancy) get nothing extra.
     *
     * @return array<string, string>
     */
    private function extraDependencies(string $slug): array
    {
        return match ($slug) {
            'fancy-echarts' => ['@particle-academy/fancy-echarts' => '^3.0.0'],
            default => [],
        };
    }

    private function viteConfig(): string
    {
        return <<<'TS'
        import { defineConfig } from "vite";
        import react from "@vitejs/plugin-react";
        import tailwindcss from "@tailwindcss/vite";

        export default defineConfig({
          plugins: [react(), tailwindcss()],
        });
        TS;
    }

    private function tsConfig(): string
    {
        return <<<'JSON'
        {
          "compilerOptions": {
            "target": "ES2022",
            "useDefineForClassFields": true,
            "lib": ["ES2022", "DOM", "DOM.Iterable"],
            "module": "ESNext",
            "skipLibCheck": true,
            "moduleResolution": "bundler",
            "allowImportingTsExtensions": true,
            "resolveJsonModule": true,
            "isolatedModules": true,
            "moduleDetection": "force",
            "noEmit": true,
            "jsx": "react-jsx",
            "strict": true,
            "noUnusedLocals": false,
            "noUnusedParameters": false,
            "noFallthroughCasesInSwitch": true
          },
          "include": ["src"],
          "references": [{ "path": "./tsconfig.node.json" }]
        }
        JSON;
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

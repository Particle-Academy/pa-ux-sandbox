<?php

namespace App\Mcp\Tools;

use Illuminate\Contracts\JsonSchema\JsonSchema;
use Laravel\Mcp\Request;
use Laravel\Mcp\Response;
use Laravel\Mcp\Server\Attributes\Description;
use Laravel\Mcp\Server\Tool;

#[Description('Start a NEW Fancy UI project — call this FIRST, before picking components. The first decision is your BACKEND: PHP (Laravel + Inertia), Node / TypeScript, or another language (Go, Python, Rails, .NET, …). The React UI is identical on every backend; only the server layer differs. Returns the recommended stack, the right server-side packages for your backend (each capability is mirrored per language), scaffold steps, and what to do next. Pass `backend` to focus the guide, or omit it for the full decision tree.')]
class StartProject extends Tool
{
    public function handle(Request $request): Response
    {
        $backend = $this->normalizeBackend((string) $request->get('backend', ''));

        $backends = [
            'php' => $this->php(),
            'node' => $this->node(),
            'other' => $this->other(),
        ];

        return Response::json([
            'title' => 'Start a Fancy UI project',
            'first_decision' => 'Choose your BACKEND first — it decides which server-side packages you install. The React UI (react-fancy + the Human+ surfaces + the agent-integrations bridges) is the SAME on every backend; only the server layer changes.',
            'ui_is_universal' => [
                'core_ui' => '@particle-academy/react-fancy — ~50 React 19 + Tailwind v4 primitives. Plain React; works under any backend.',
                'human_plus_surfaces' => 'whiteboard, flow, sheets, slides, code, term, diff, 3d, echarts, screens, artboard — React packages that render on any backend.',
                'agents' => '@particle-academy/agent-integrations — MCP bridges so an embedded agent co-drives the SAME UI. Backend-agnostic.',
            ],
            'mirror_strategy' => [
                'idea' => 'Every server-side capability is a language-agnostic CONTRACT shipped as per-language "mirror" packages, so you get the same feature behind the same UI no matter your backend. PHP + Node ship today; native mirrors for more modern languages are on the roadmap (same contract → behavior-identical across languages).',
                'pairs' => $this->mirrorPairs(),
            ],
            // When focused, return just that backend; otherwise the full tree.
            'backends' => $backend !== '' ? [$backend => $backends[$backend]] : $backends,
            'recommended_default' => 'php — the most batteries-included path (SSR, server-state hydration, auth, every server package native). Pick node if you want a JS-only stack or a non-Laravel React framework.',
            'next_steps' => [
                '1. (optional) Design direction: `gallery_list_styles` → `gallery_get_blueprint`.',
                '2. Find UI: `list_components` / `search_components`.',
                '3. Install a component: `install_instructions` (npm path + the `npx fancy-ui add` vendor-source path).',
                '4. Full-app templates: the Starter Kits at https://ui.particle.academy/starter-kits (e.g. Shop-n-Sub = catalog + FMS, vendored as `npx fancy-ui add catalog-fms`).',
            ],
            'docs' => 'https://ui.particle.academy/docs/installation',
        ]);
    }

    /** Map a free-text backend to one of php | node | other (or '' for "show all"). */
    private function normalizeBackend(string $raw): string
    {
        return match (strtolower(trim($raw))) {
            'php', 'laravel', 'inertia' => 'php',
            'node', 'nodejs', 'ts', 'typescript', 'js', 'javascript', 'next', 'nextjs', 'remix', 'vite', 'express' => 'node',
            'other', 'go', 'golang', 'python', 'django', 'fastapi', 'ruby', 'rails', 'dotnet', '.net', 'csharp', 'elixir', 'phoenix', 'rust' => 'other',
            default => '',
        };
    }

    /** @return array<string, mixed> */
    private function php(): array
    {
        return [
            'label' => 'PHP — Laravel + Inertia (the turnkey, batteries-included path)',
            'pick_when' => 'You want the richest first-party integration: SSR, server-state hydration, auth, and every server-side capability as a native Composer package.',
            'fancy_core' => [
                '@particle-academy/react-fancy — UI primitives',
                '@particle-academy/fancy-inertia — Inertia bridge (FancyAppRoot, useFancyForm, SSR, schema-driven pages)',
                '@particle-academy/fancy-query — server-state (TanStack Query + Inertia hydration + Echo invalidation)',
            ],
            'server_packages' => [
                'catalog (Stripe products/prices/checkout)' => 'particle-academy/laravel-catalog',
                'feature management (gates / quotas)' => 'particle-academy/laravel-fms',
                'server SEO (meta / OG / JSON-LD / sitemap)' => 'particle-academy/fancy-seo',
                'interaction analytics (EUO)' => 'particle-academy/fancy-heuristics',
                'well-known files (robots / security / llms / AGENTS)' => 'particle-academy/fancy-x-files',
                'xlsx writer/reader' => 'particle-academy/holy-sheet',
                'pptx writer/reader' => 'particle-academy/dark-slide',
            ],
            'scaffold' => [
                'laravel new my-app   # (or composer create-project laravel/laravel my-app)',
                'composer require inertiajs/inertia-laravel',
                'npm install @particle-academy/react-fancy @particle-academy/fancy-inertia @particle-academy/fancy-query',
                'composer require particle-academy/laravel-catalog particle-academy/laravel-fms   # only the server packages you need',
                '# Wire <FancyAppRoot> + setupFancyApp — see /docs/installation',
            ],
            'docs' => 'https://ui.particle.academy/docs/installation',
        ];
    }

    /** @return array<string, mixed> */
    private function node(): array
    {
        return [
            'label' => 'Node / TypeScript — any React framework (Next.js, Remix, Vite, Express, …)',
            'pick_when' => "You're on a JS stack or don't want Laravel. react-fancy is plain React; you bring your own data layer.",
            'fancy_core' => [
                '@particle-academy/react-fancy — UI primitives',
                'your own data layer — fetch / server actions / tRPC / TanStack Query (fancy-inertia + fancy-query are Laravel-Inertia-specific; skip them here)',
            ],
            'server_packages' => [
                'catalog (Stripe products/prices/checkout)' => '@particle-academy/fancy-catalog',
                'feature management (gates / quotas)' => '@particle-academy/fancy-features',
                'interaction analytics (EUO)' => '@particle-academy/fancy-heuristics-js',
                'well-known files (robots / security / llms / AGENTS)' => '@particle-academy/fancy-x-files',
                'xlsx writer/reader' => '@particle-academy/holy-sheet',
                'pptx writer/reader' => '@particle-academy/dark-slide',
                'SEO' => 'use the client `<Seo>` head helper from @particle-academy/fancy-inertia/seo, or your framework\'s head/metadata API — no server package needed',
            ],
            'notes' => [
                'The `-js` server packages are framework-agnostic HEADLESS libraries — instantiate them in your API routes / server actions; they take an injected client (e.g. a Stripe client) rather than owning the framework.',
                'fancy-catalog composes with fancy-features for entitlements via its ./features bridge — the Node mirror of the laravel-catalog ↔ laravel-fms integration.',
            ],
            'scaffold' => [
                'npm create vite@latest my-app -- --template react-ts   # or Next.js / Remix',
                'npm install @particle-academy/react-fancy',
                'npm install @particle-academy/fancy-catalog @particle-academy/fancy-features   # only the server-side mirrors you need',
            ],
            'docs' => 'https://ui.particle.academy/docs/installation',
        ];
    }

    /** @return array<string, mixed> */
    private function other(): array
    {
        return [
            'label' => 'Another backend — Go, Python, Ruby/Rails, .NET, Elixir, Rust, …',
            'pick_when' => 'Your server is in a language other than PHP or Node.',
            'ui' => 'The Fancy UI React kit is framework-agnostic (plain React 19 + Tailwind v4). Serve it from any backend that can host a JS frontend — a Vite SPA, an inertia-style adapter for your framework, or an embedded bundle. The components + agent bridges work unchanged.',
            'server_side_today' => 'Server-side capabilities (catalog, feature gating, xlsx/pptx, analytics, well-known files) ship as PHP + Node mirrors today. Until a native mirror for your language lands, run the Node (`-js`) packages from a small JS sidecar service, or call them over HTTP/RPC from your app — the contracts are stable and JSON-friendly.',
            'roadmap' => 'Native mirrors for more modern languages are on the roadmap. Each capability is defined by a language-agnostic contract, so the per-language packages stay behavior-identical. Want your language prioritized? Open an issue at github.com/Particle-Academy on the relevant package.',
            'docs' => 'https://ui.particle.academy/docs/installation',
        ];
    }

    /**
     * Each server-side capability + its current per-language mirror packages.
     * PHP + Node ship today; null = no native mirror yet for that language.
     *
     * @return array<int, array<string, mixed>>
     */
    private function mirrorPairs(): array
    {
        return [
            ['capability' => 'Stripe catalog (products / prices / plans / checkout)', 'php' => 'particle-academy/laravel-catalog', 'node' => '@particle-academy/fancy-catalog'],
            ['capability' => 'Feature management (gates, quotas, metered features)', 'php' => 'particle-academy/laravel-fms', 'node' => '@particle-academy/fancy-features'],
            ['capability' => 'xlsx writer/reader (+ formula engine)', 'php' => 'particle-academy/holy-sheet', 'node' => '@particle-academy/holy-sheet'],
            ['capability' => 'pptx writer/reader', 'php' => 'particle-academy/dark-slide', 'node' => '@particle-academy/dark-slide'],
            ['capability' => 'Interaction analytics (EUO)', 'php' => 'particle-academy/fancy-heuristics', 'node' => '@particle-academy/fancy-heuristics-js'],
            ['capability' => 'Well-known files (robots / security / llms / sitemap / AGENTS)', 'php' => 'particle-academy/fancy-x-files', 'node' => '@particle-academy/fancy-x-files'],
            ['capability' => 'Server SEO (meta / OG / JSON-LD / sitemap)', 'php' => 'particle-academy/fancy-seo', 'node' => null],
        ];
    }

    /** @return array<string, JsonSchema> */
    public function schema(JsonSchema $schema): array
    {
        return [
            'backend' => $schema->string()
                ->description('Optional. Your backend: "php" (Laravel + Inertia), "node" (any React framework / JS server), or "other" (Go, Python, Rails, .NET, …). Omit to get the full decision guide for all three.'),
        ];
    }
}

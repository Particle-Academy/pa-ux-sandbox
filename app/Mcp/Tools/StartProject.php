<?php

namespace App\Mcp\Tools;

use App\Support\PackageFamily;
use Illuminate\Contracts\JsonSchema\JsonSchema;
use Laravel\Mcp\Request;
use Laravel\Mcp\Response;
use Laravel\Mcp\Server\Attributes\Description;
use Laravel\Mcp\Server\Tool;

#[Description('Start a NEW Fancy UI project — call this FIRST, before picking components. The first decision is your BACKEND: PHP (Laravel + Inertia), Node / TypeScript, Python (FastAPI / Django / Flask), or another language (Go, Rails, .NET, …). The React UI is identical on every backend; only the server layer differs. Returns the recommended stack, the right server-side packages for your backend (each capability is mirrored per language), scaffold steps, and what to do next. Pass `backend` to focus the guide, or omit it for the full decision tree.')]
class StartProject extends Tool
{
    public function handle(Request $request): Response
    {
        $backend = $this->normalizeBackend((string) $request->get('backend', ''));

        $backends = [
            'php' => $this->php(),
            'node' => $this->node(),
            'python' => $this->python(),
            'other' => $this->other(),
        ];

        return Response::json([
            'title' => 'Start a Fancy UI project',
            'first_decision' => 'Choose your BACKEND first — it decides which server-side packages you install. The React UI (react-fancy + the Human+ surfaces + the agent-integrations bridges) is the SAME on every backend; only the server layer changes.',
            'ui_is_universal' => [
                'core_ui' => '@particle-academy/react-fancy — ~70 React 19 + Tailwind v4 primitives. Plain React; works under any backend.',
                'human_plus_surfaces' => 'whiteboard, flow, sheets, slides, code, term, tui, diff, map, 3d, echarts, screens, artboard, git-ui, mlm-ui, cms-ui — React packages that render on any backend.',
                'agents' => '@particle-academy/agent-integrations — MCP bridges so an embedded agent co-drives the SAME UI. Backend-agnostic.',
            ],
            'mirror_strategy' => [
                'idea' => 'Every server-side capability is a language-agnostic CONTRACT shipped as per-language "mirror" packages, so you get the same feature behind the same UI no matter your backend. PHP and Node ship the full set; PYTHON ships the framework-free cores (workflow, catalog, features, xlsx/pptx/docx) and is filling in the rest. Parity is asserted against shared conformance fixtures, not claimed.',
                'pairs' => $this->mirrorPairs(),
            ],
            // When focused, return just that backend; otherwise the full tree.
            'backends' => $backend !== '' ? [$backend => $backends[$backend]] : $backends,
            'recommended_default' => 'php — the most batteries-included path (SSR, server-state hydration, auth, every server package native). Pick node if you want a JS-only stack or a non-Laravel React framework.',
            'next_steps' => [
                '1. (optional) Design direction: `gallery_list_styles` → `gallery_get_blueprint`.',
                '2. Find UI: `list_components` / `search_components`.',
                '3. Install a component: `install_instructions` (npm path + the `npx fancy-cli@latest add` vendor-source path).',
                '4. Full-app templates: the Starter Kits at https://ui.particle.academy/starter-kits (e.g. Shop-n-Sub = catalog + FMS, vendored as `npx fancy-cli@latest add catalog-fms`).',
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
            'python', 'py', 'django', 'fastapi', 'flask', 'starlette', 'litestar' => 'python',
            'other', 'go', 'golang', 'ruby', 'rails', 'dotnet', '.net', 'csharp', 'elixir', 'phoenix', 'rust' => 'other',
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
                'feature + access gating (flags, permissions, metered quotas)' => 'particle-academy/laravel-fms',
                'server SEO (meta / OG / JSON-LD / sitemap)' => 'particle-academy/fancy-seo',
                'interaction analytics (EUO)' => 'particle-academy/fancy-heuristics',
                'well-known files (robots / security / llms / AGENTS)' => 'particle-academy/fancy-x-files',
                'xlsx writer/reader' => 'particle-academy/holy-sheet',
                'pptx writer/reader' => 'particle-academy/dark-slide',
                'docx writer/reader (+ markdown bridges)' => 'particle-academy/last-word',
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
                'your own data layer — fetch / server actions / tRPC / TanStack Query. NOTE: fancy-inertia + fancy-query need INERTIA, not Laravel — they have zero PHP/Laravel runtime deps, so use them with any Inertia server adapter (Adonis, Rails, …); skip them only if you are not using Inertia.',
            ],
            'server_packages' => [
                'catalog (Stripe products/prices/checkout)' => '@particle-academy/fancy-catalog',
                'feature + access gating (flags, permissions, metered quotas)' => '@particle-academy/fancy-features',
                'interaction analytics (EUO)' => '@particle-academy/fancy-heuristics-js',
                'well-known files (robots / security / llms / AGENTS)' => '@particle-academy/fancy-x-files',
                'xlsx writer/reader' => '@particle-academy/holy-sheet',
                'pptx writer/reader' => '@particle-academy/dark-slide',
                'docx writer/reader (+ markdown bridges)' => '@particle-academy/last-word',
                'SEO' => 'use the client `<Seo>` head helper from @particle-academy/fancy-inertia/seo, or your framework\'s head/metadata API — no server package needed',
            ],
            'notes' => [
                'The `-js` server packages are framework-agnostic HEADLESS libraries — instantiate them in your API routes / server actions; they take an injected client (e.g. a Stripe client) rather than owning the framework.',
                'fancy-features gates features, access and metered quotas in ANY app and depends on nothing else of ours — install it on its own. fancy-catalog is one CONSUMER of it: catalog plugs into the FeatureSource contract features owns, via its ./features bridge. The dependency runs catalog -> features, never the reverse.',
            ],
            'scaffold' => [
                'npm create vite@latest my-app -- --template react-ts   # or Next.js / Remix',
                'npm install @particle-academy/react-fancy',
                'npm install @particle-academy/fancy-catalog @particle-academy/fancy-features   # only the server-side mirrors you need',
            ],
            'docs' => 'https://ui.particle.academy/docs/installation',
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function python(): array
    {
        return [
            'label' => 'Python — FastAPI, Django, Flask, or any ASGI/WSGI server',
            'pick_when' => 'Your server is Python. The framework-free cores ship natively on PyPI, so you do not need a JS sidecar for them.',
            'fancy_core' => [
                '@particle-academy/react-fancy — UI primitives. Plain React 19 + Tailwind v4; serve it from a Vite SPA or any bundle your app can host.',
                'your own data layer — fetch / HTMX / an Inertia adapter. fancy-inertia + fancy-query need INERTIA, not Laravel, so they work with a Python Inertia adapter.',
            ],
            'server_packages' => [
                'workflow graphs (engine + durable runs)' => 'fancy-flow',
                'catalog (Stripe products/prices/checkout)' => 'fancy-catalog',
                'feature + access gating (flags, permissions, metered quotas)' => 'fancy-features',
                'xlsx writer/reader' => 'fancy-holy-sheet',
                'pptx writer/reader' => 'fancy-dark-slide',
                'docx writer/reader (+ markdown bridges)' => 'fancy-last-word',
            ],
            'notes' => [
                'These are FRAMEWORK-FREE libraries, not Django/FastAPI plugins — instantiate them in your handlers; they take injected clients (a Stripe client, an LLM client) rather than owning the framework.',
                'Behaviour is asserted against the SAME cross-language fixture tables as the PHP and Node twins (particle-academy/fancy-conformance), so parity is a test result rather than a claim. Money is integer minor units in every runtime.',
                'NOT YET on PyPI: the framework-coupled capabilities — interaction analytics, well-known files, SEO, MLM, passkeys, git, CMS. For those, run the `-js` package from a small sidecar or call it over HTTP, exactly as the "other" path describes.',
            ],
            'scaffold' => [
                'pip install fancy-flow                 # or: uv add fancy-flow',
                'pip install fancy-catalog fancy-features   # only the mirrors you need',
                'npm create vite@latest my-app -- --template react-ts && npm install @particle-academy/react-fancy',
            ],
            'docs' => 'https://ui.particle.academy/docs/installation',
        ];
    }

    /** @return array<string, mixed> */
    private function other(): array
    {
        return [
            'label' => 'Another backend — Go, Ruby/Rails, .NET, Elixir, Rust, … (Python has its OWN path: pass backend="python")',
            'pick_when' => 'Your server is in a language other than PHP, Node or Python.',
            'ui' => 'The Fancy UI React kit is framework-agnostic (plain React 19 + Tailwind v4). Serve it from any backend that can host a JS frontend — a Vite SPA, an inertia-style adapter for your framework, or an embedded bundle. The components + agent bridges work unchanged.',
            'server_side_today' => 'Server-side capabilities (catalog, feature gating, xlsx/pptx, analytics, well-known files) ship as PHP + Node mirrors today, with the framework-free cores also on PyPI for Python. Until a native mirror for your language lands, run the Node (`-js`) packages from a small JS sidecar service, or call them over HTTP/RPC from your app — the contracts are stable and JSON-friendly.',
            'roadmap' => 'Native mirrors for more modern languages are on the roadmap. Each capability is defined by a language-agnostic contract, so the per-language packages stay behavior-identical. Want your language prioritized? Open an issue at github.com/Particle-Academy on the relevant package.',
            'docs' => 'https://ui.particle.academy/docs/installation',
        ];
    }

    /**
     * Each server-side capability + its current per-language mirror packages.
     * PHP + Node ship today; null = no native mirror yet for that language.
     *
     * The real parity groups come from {@see PackageFamily} — the single source
     * of truth shared with the /packages listing — so the two never drift. The
     * php-only baselines below (Node mirror still on the roadmap) are appended
     * here because the listing does not treat a single-language package as a
     * parity group.
     *
     * @return array<int, array<string, mixed>>
     */
    private function mirrorPairs(): array
    {
        return [
            ...PackageFamily::mcpPairs(),
            ['capability' => 'Server SEO (meta / OG / JSON-LD / sitemap)', 'php' => 'particle-academy/fancy-seo', 'node' => null],
        ];
    }

    /** @return array<string, JsonSchema> */
    public function schema(JsonSchema $schema): array
    {
        return [
            'backend' => $schema->string()
                ->description('Optional. Your backend: "php" (Laravel + Inertia), "node" (any React framework / JS server), "python" (FastAPI / Django / Flask), or "other" (Go, Rails, .NET, …). Omit to get the full decision guide.'),
        ];
    }
}

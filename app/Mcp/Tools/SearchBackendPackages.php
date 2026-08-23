<?php

declare(strict_types=1);

namespace App\Mcp\Tools;

use App\Support\PackageFamily;
use App\Support\PackageRegistry;
use Illuminate\Contracts\JsonSchema\JsonSchema;
use Laravel\Mcp\Request;
use Laravel\Mcp\Response;
use Laravel\Mcp\Server\Attributes\Description;
use Laravel\Mcp\Server\Tool;

/**
 * Find a SERVER-SIDE package for a capability, in the stack you are already on.
 *
 * ## Why this exists
 *
 * Components had `list` / `search` / `get` / `install_instructions`. Nodes had
 * the same four. Server-side packages had **none** — the only way to discover
 * one was `start_project`, which assumes a greenfield project and leads with
 * "choose your backend".
 *
 * That is the wrong shape for the commonest case. Someone with a running
 * FastAPI app who needs feature gating has already chosen their backend; they
 * do not want a decision tree, they want the package name and the install line.
 *
 * ## The rule this tool follows
 *
 * **An empty result must never be mistaken for "we do not offer that."**
 *
 * If a capability exists in some stack but not yours, saying nothing implies we
 * do not have it. So a miss returns the capability, the stacks that DO have it,
 * and the sidecar option — the same distinction the rest of this codebase draws
 * between "there is none" and "nobody has built it for you yet".
 */
#[Description('Find a Fancy SERVER-SIDE package by capability, filtered to YOUR stack (php | node | python). Use this when a project already exists and you need a backend package for something — feature gating, a Stripe catalog, xlsx/pptx/docx, workflow graphs, analytics. Returns the package name for your stack plus the exact install command. When a capability exists only in OTHER stacks, it says so rather than returning nothing. For a NEW project, call `start_project` instead.')]
class SearchBackendPackages extends Tool
{
    /** ecosystem value in PackageRegistry => the stack name a caller passes. */
    private const STACKS = ['php' => 'php', 'ts' => 'node', 'py' => 'python'];

    public function handle(Request $request): Response
    {
        $query = trim((string) $request->get('query', ''));
        $stack = $this->normalizeStack((string) $request->get('stack', ''));

        $packages = $this->headless();
        $matches = $query === '' ? $packages : $this->matching($packages, $query);

        $inStack = $stack === ''
            ? $matches
            : array_values(array_filter($matches, fn (array $p) => ($p['stack'] ?? null) === $stack));

        $payload = [
            'stack' => $stack === '' ? 'any' : $stack,
            'query' => $query === '' ? null : $query,
            'packages' => array_map($this->present(...), $inStack),
        ];

        // The important half: a capability we HAVE, just not here. Returning an
        // empty list would read as "Fancy does not do feature gating", which is
        // false and unrecoverable for the caller.
        if ($stack !== '') {
            // Exclude anything already delivered above. A sibling mirror matches
            // the same query, so without this a Python search for "feature"
            // returned fancy-features AND announced "Feature management" as
            // missing — telling someone a capability is unavailable in the same
            // breath as handing them the package, which invites them to build a
            // sidecar they do not need.
            $delivered = array_filter(array_column($payload['packages'], 'capability'));
            $elsewhere = array_values(array_filter(
                $this->availableElsewhere($matches, $stack),
                fn (array $row) => ! in_array($row['capability'], $delivered, true),
            ));
            if ($elsewhere !== []) {
                $payload['not_in_your_stack'] = $elsewhere;
                $payload['note'] = 'These capabilities exist, but not yet as a native '.$stack.' package. Run the Node (`-js`) mirror from a small sidecar service, or call it over HTTP — the contracts are JSON-friendly and stable. Ask for the capability to be prioritised at github.com/Particle-Academy.';
            }
        }

        if ($payload['packages'] === [] && ! isset($payload['not_in_your_stack'])) {
            $payload['note'] = $query === ''
                ? 'No server-side packages matched.'
                : "Nothing matched \"{$query}\". Try a capability word — catalog, features, workflow, xlsx, pptx, docx, analytics, seo, git, passkeys, referral, courses.";
        }

        return Response::json($payload);
    }

    /**
     * Every headless package, tagged with the stack a caller would name.
     *
     * `kind === 'headless'` is the definition of a server-side package here —
     * the React surfaces are identical on every backend and are not a stack
     * decision, which is why they are not in this tool.
     *
     * @return list<array<string, mixed>>
     */
    private function headless(): array
    {
        $capabilities = $this->capabilityByPackage();

        return collect([...PackageRegistry::all(), ...PackageRegistry::companions()])
            ->filter(fn (array $p) => ($p['kind'] ?? '') === 'headless')
            ->map(function (array $p) use ($capabilities): array {
                $name = $p['composer'] ?? $p['npm'] ?? $p['pypi'] ?? null;
                $p['stack'] = self::STACKS[$p['ecosystem'] ?? ''] ?? null;
                $p['install_name'] = $name;
                $p['capability'] = $name !== null ? ($capabilities[$name] ?? null) : null;

                return $p;
            })
            ->values()
            ->all();
    }

    /**
     * Package name => the capability it implements, from the SHARED mirror
     * table. Same source as `/packages` and `start_project`, so a capability
     * cannot describe itself differently in two places.
     *
     * @return array<string, string>
     */
    private function capabilityByPackage(): array
    {
        $map = [];
        foreach (PackageFamily::mcpPairs() as $pair) {
            foreach (['php', 'node', 'python'] as $column) {
                if (($pair[$column] ?? null) !== null) {
                    $map[$pair[$column]] = $pair['capability'];
                }
            }
        }

        return $map;
    }

    /**
     * @param  list<array<string, mixed>>  $packages
     * @return list<array<string, mixed>>
     */
    private function matching(array $packages, string $query): array
    {
        $needles = array_values(array_filter(preg_split('/\s+/', mb_strtolower($query)) ?: []));

        return array_values(array_filter($packages, function (array $p) use ($needles): bool {
            $haystack = mb_strtolower(implode(' ', array_filter([
                $p['slug'] ?? '', $p['name'] ?? '', $p['tagline'] ?? '', $p['capability'] ?? '',
            ])));

            // Every word must appear — an OR match on a two-word query returns
            // most of the catalogue and is indistinguishable from no filter.
            foreach ($needles as $needle) {
                if (! str_contains($haystack, $needle)) {
                    return false;
                }
            }

            return true;
        }));
    }

    /**
     * Capabilities among the matches that exist in some stack but not this one.
     *
     * @param  list<array<string, mixed>>  $matches
     * @return list<array<string, mixed>>
     */
    private function availableElsewhere(array $matches, string $stack): array
    {
        $out = [];

        foreach ($matches as $p) {
            if (($p['stack'] ?? null) === $stack || ($p['capability'] ?? null) === null) {
                continue;
            }

            $capability = $p['capability'];
            $out[$capability] ??= ['capability' => $capability, 'available_in' => []];
            if ($p['stack'] !== null && $p['install_name'] !== null) {
                $out[$capability]['available_in'][$p['stack']] = $p['install_name'];
            }
        }

        return array_values(array_filter($out, fn (array $row) => $row['available_in'] !== []));
    }

    /** @return array<string, mixed> */
    private function present(array $p): array
    {
        return array_filter([
            'name' => $p['install_name'],
            'stack' => $p['stack'],
            'capability' => $p['capability'],
            'what_it_does' => $p['tagline'] ?? null,
            'install' => $this->installCommand($p),
            'docs' => 'https://ui.particle.academy/packages/'.($p['slug'] ?? ''),
        ], fn ($v) => $v !== null);
    }

    private function installCommand(array $p): ?string
    {
        return match ($p['stack'] ?? null) {
            'php' => 'composer require '.$p['install_name'],
            'node' => 'npm install '.$p['install_name'],
            'python' => 'pip install '.$p['install_name'].'   # or: uv add '.$p['install_name'],
            default => null,
        };
    }

    /** Map free text to php | node | python, or '' for "every stack". */
    private function normalizeStack(string $raw): string
    {
        return match (mb_strtolower(trim($raw))) {
            'php', 'laravel', 'composer' => 'php',
            'node', 'nodejs', 'js', 'javascript', 'ts', 'typescript', 'npm', 'next', 'nextjs', 'remix', 'express' => 'node',
            'python', 'py', 'django', 'fastapi', 'flask', 'pip', 'uv' => 'python',
            default => '',
        };
    }

    /** @return array<string, JsonSchema> */
    public function schema(JsonSchema $schema): array
    {
        return [
            'query' => $schema->string()
                ->description('What you need, in plain words — "feature gating", "stripe catalog", "xlsx", "workflow", "analytics". Omit to list everything available in your stack.'),
            'stack' => $schema->string()
                ->description('The backend you are ALREADY on: "php" (Laravel), "node" (any JS server), or "python" (FastAPI / Django / Flask). Omit to see every stack. Aliases accepted — "laravel", "fastapi", "nextjs", etc.'),
        ];
    }
}

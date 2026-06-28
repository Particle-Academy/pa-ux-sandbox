<?php

namespace App\Support\Registry;

use App\Support\PackageRegistry;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Str;
use RuntimeException;

/**
 * Reads component source from the monorepo on disk and returns
 * shadcn-compatible {@see RegistryItem} records. Cached for 15 min in
 * production; bypassed in local/testing so authoring iterates fast.
 */
class RegistrySource
{
    private const CACHE_TTL_SECONDS = 900;

    private const PEER_DEPENDENCIES = ['react', 'react-dom', 'tailwindcss'];

    /** @return list<RegistryItem> */
    public function all(): array
    {
        // Key the cache on the artifact fingerprint so deploying a new
        // registry.json (or this fix itself) busts the cache automatically — the
        // pre-fix empty result won't linger for the 15-min TTL.
        return $this->cached('registry.all.'.$this->cacheFingerprint(), function (): array {
            // Dev / CI: the sibling package source is on disk → scan it live.
            // Production (Forge deploys only px-ui-sandbox, no siblings) → load
            // the precompiled artifact committed via `php artisan registry:build`.
            $items = $this->liveSourceAvailable() ? $this->scanLive() : $this->loadCompiled();
            usort($items, fn (RegistryItem $a, RegistryItem $b) => $a->name <=> $b->name);

            return $items;
        });
    }

    /** A cache-busting fingerprint: 'live' in dev, else the artifact's mtime. */
    private function cacheFingerprint(): string
    {
        if ($this->liveSourceAvailable()) {
            return 'live';
        }
        $path = self::compiledPath();

        return is_file($path) ? (string) filemtime($path) : 'missing';
    }

    /**
     * Scan the sibling package source trees on disk. Only usable where the
     * fancy-ui workspace siblings exist (local dev, CI). @return list<RegistryItem>
     */
    public function scanLive(): array
    {
        $items = [];
        foreach (PackageRegistry::all() as $pkg) {
            foreach ($this->itemsForPackage($pkg) as $item) {
                $items[] = $item;
            }
        }

        // Companion (headless / no-UI) packages — holy-sheet, dark-slide, the
        // Laravel infra packages, fancy-query, the JS ports. They expose no
        // per-component UI, so each contributes a single discoverable
        // package-level item agents can find + install via the MCP tools.
        foreach (PackageRegistry::companions() as $pkg) {
            if ($item = $this->companionItem($pkg)) {
                $items[] = $item;
            }
        }

        // Hand-authored block — the catalog-fms storefront/admin components are
        // authored in THIS app (resources/js/components/fancy/catalog-fms/), not
        // a sibling package, so source them directly. `npx fancy-ui add
        // catalog-fms` vendors the whole set; pairs with the Shop-n-Sub kit.
        if ($block = $this->catalogFmsBlock()) {
            $items[] = $block;
        }

        return $this->ensureUniqueNames($items);
    }

    /**
     * Guarantee every item name is globally unique (it is the `/r/{name}.json`
     * slug + the `find()` key). Later collisions are disambiguated with the
     * package slug, so mirrored adapters (fancy-3d-babylon vs fancy-3d-three
     * both export `stage`/`monitor`/`engine`) and cross-package dupes
     * (react-fancy vs fancy-whiteboard `sticky-note`) stay individually
     * addressable instead of shadowing each other.
     *
     * @param  list<RegistryItem>  $items
     * @return list<RegistryItem>
     */
    private function ensureUniqueNames(array $items): array
    {
        $seen = [];
        foreach ($items as $i => $item) {
            if (! isset($seen[$item->name])) {
                $seen[$item->name] = true;

                continue;
            }
            $alt = $item->package.'-'.$item->name;
            $candidate = $alt;
            $n = 2;
            while (isset($seen[$candidate])) {
                $candidate = $alt.'-'.$n;
                $n++;
            }
            $seen[$candidate] = true;
            $items[$i] = $item->withName($candidate);
        }

        return $items;
    }

    /** Whether any package's source tree is readable on disk (i.e. we can scan live). */
    public function liveSourceAvailable(): bool
    {
        foreach (PackageRegistry::all() as $pkg) {
            $slug = $pkg['slug'] ?? null;
            if (! is_string($slug)) {
                continue;
            }
            if (is_dir(dirname(base_path()).'/'.$slug) || is_dir(base_path('packages/'.$slug))) {
                return true;
            }
        }

        return false;
    }

    /** Path to the compiled registry artifact, committed + deployed with the app. */
    public static function compiledPath(): string
    {
        return resource_path('registry/registry.json');
    }

    /**
     * Load the precompiled registry artifact (production, where the sibling
     * source isn't deployed). Degrades to an empty registry — and reports it —
     * rather than crashing the MCP / endpoints if the artifact is missing.
     *
     * @return list<RegistryItem>
     */
    private function loadCompiled(): array
    {
        $path = self::compiledPath();
        if (! is_file($path)) {
            report(new RuntimeException(
                "Compiled registry artifact missing at {$path}. Run `php artisan registry:build` and commit it."
            ));

            return [];
        }

        $data = json_decode((string) file_get_contents($path), true);
        $rows = is_array($data) ? ($data['items'] ?? []) : [];

        return array_values(array_map(
            fn (array $row): RegistryItem => RegistryItem::fromArray($row),
            $rows,
        ));
    }

    public function find(string $slug): ?RegistryItem
    {
        foreach ($this->all() as $item) {
            if ($item->name === $slug) {
                return $item;
            }
        }

        return null;
    }

    /**
     * @param  array<string, mixed>  $pkg
     * @return list<RegistryItem>
     */
    private function itemsForPackage(array $pkg): array
    {
        $pkgDir = $this->packageDir((string) $pkg['slug']);

        // We can only build registry items for packages we can read on disk.
        // Skip cleanly otherwise — the package still appears in /packages.
        if ($pkgDir === null) {
            return [];
        }

        $items = [];
        $hasNpmPointer = false;
        foreach ($pkg['components'] ?? [] as $component) {
            $item = $this->buildItem($pkg, $component, $pkgDir);
            if ($item) {
                $items[] = $item;

                continue;
            }
            // No vendorable copy-source layout (engine adapters that need the
            // WebGL engine, hooks, factories, renamed sub-elements). Still emit
            // an npm-install POINTER item so the component is discoverable +
            // installable via the MCP tools — it just ships in the package
            // bundle rather than as copy-source files.
            if ($pointer = $this->npmPointerItem($pkg, $component)) {
                $items[] = $pointer;
                $hasNpmPointer = true;
            }
        }

        // Packages that ship at least one npm-only component (flat src layouts)
        // also get ONE package-level item keyed by the globally unique slug, so
        // agents can install the whole package in one step.
        if ($hasNpmPointer && ! empty($pkg['npm'])) {
            $items[] = $this->packageLevelItem($pkg);
        }

        return $items;
    }

    /**
     * Resolve a package's source directory on disk. In the flat fancy-ui
     * workspace each package is a sibling of px-ui-sandbox/ — base_path('../X');
     * falls back to the legacy nested layout (base_path('packages/X')).
     */
    private function packageDir(string $slug): ?string
    {
        foreach ([dirname(base_path()).'/'.$slug, base_path('packages/'.$slug)] as $candidate) {
            if (is_dir($candidate)) {
                return $candidate;
            }
        }

        return null;
    }

    /**
     * An npm-install pointer item for a component with no vendorable source.
     *
     * @param  array<string, mixed>  $pkg
     * @param  array<string, mixed>  $component
     */
    private function npmPointerItem(array $pkg, array $component): ?RegistryItem
    {
        $install = $pkg['npm'] ?? $pkg['composer'] ?? null;
        if ($install === null) {
            return null;
        }
        $blurb = (string) ($component['blurb'] ?? '');
        $description = $blurb !== ''
            ? $blurb
            : "{$component['name']} — ships in {$install} (install the package; no copy-source).";

        return new RegistryItem(
            name: (string) $component['slug'],
            title: (string) $component['name'],
            description: $description,
            package: (string) $pkg['slug'],
            files: [],
        );
    }

    /**
     * The package-level "install the whole package" item.
     *
     * @param  array<string, mixed>  $pkg
     */
    private function packageLevelItem(array $pkg): RegistryItem
    {
        $provides = array_map(
            fn (array $c): string => $c['name'],
            array_values($pkg['components'] ?? []),
        );
        $tagline = (string) ($pkg['tagline'] ?? '');

        return new RegistryItem(
            name: (string) $pkg['slug'],
            title: (string) $pkg['name'],
            description: $tagline !== '' ? $tagline : 'npm package — provides '.implode(', ', $provides),
            package: (string) $pkg['slug'],
            files: [],
        );
    }

    /**
     * A single discoverable item for a companion (headless / no-UI) package.
     *
     * @param  array<string, mixed>  $pkg
     */
    private function companionItem(array $pkg): ?RegistryItem
    {
        if (empty($pkg['npm']) && empty($pkg['composer'])) {
            return null;
        }
        $tagline = (string) ($pkg['tagline'] ?? '');

        return new RegistryItem(
            name: (string) $pkg['slug'],
            title: (string) $pkg['name'],
            description: $tagline !== '' ? $tagline : 'Companion package',
            package: (string) $pkg['slug'],
            files: [],
        );
    }

    /**
     * @param  array<string, mixed>  $pkg
     * @param  array<string, mixed>  $component
     */
    private function buildItem(array $pkg, array $component, string $pkgDir): ?RegistryItem
    {
        $source = $this->locateComponentSource($pkgDir, (string) $component['name'], (string) $component['slug']);
        if ($source === null) {
            return null;
        }

        $files = $source['kind'] === 'dir'
            ? $this->readSourceFiles($source['path'], $component['slug'])
            : $this->readSingleFile($source['path'], $component['slug']);
        if ($files === []) {
            return null;
        }

        $imports = $this->parseImports($files);
        $description = $component['blurb'] ?: $this->fallbackDescription($pkg, $component);

        return new RegistryItem(
            name: $component['slug'],
            title: $component['name'],
            description: $description,
            package: $pkg['slug'],
            files: $files,
            dependencies: $imports['npm'],
            registryDependencies: $imports['registry'],
        );
    }

    /**
     * Locate a component's source on disk. Returns the matched path plus its
     * `kind` — `dir` (read the whole folder as a bundle, the react-fancy case)
     * or `file` (a single-file component: ECharts wrappers, `scene.ts`, engine
     * adapters, hooks, app roots). Prefers folders, then exact files, then a
     * one-level-deep scan for nested folders / files. Returns null when nothing
     * matches — the caller then emits an npm-install pointer item.
     *
     * @return array{kind: 'dir'|'file', path: string}|null
     */
    private function locateComponentSource(string $pkgDir, string $componentName, string $slug): ?array
    {
        $kebab = Str::kebab($componentName);
        $camel = Str::camel($componentName);

        // 1) Component folder (TitleCase / kebab / camel) directly under src.
        foreach ([
            "$pkgDir/src/components/$componentName",
            "$pkgDir/src/$componentName",
            "$pkgDir/src/components/$kebab",
            "$pkgDir/src/components/$camel",
        ] as $dir) {
            if (is_dir($dir)) {
                return ['kind' => 'dir', 'path' => $dir];
            }
        }

        $componentsDir = "$pkgDir/src/components";
        if (is_dir($componentsDir)) {
            foreach (scandir($componentsDir) as $sub) {
                if ($sub === '.' || $sub === '..') {
                    continue;
                }
                // 2) Nested component folder (e.g. components/elements/TextElement).
                if (is_dir("$componentsDir/$sub/$componentName")) {
                    return ['kind' => 'dir', 'path' => "$componentsDir/$sub/$componentName"];
                }
                // 3) Case-insensitive direct folder match.
                if (strcasecmp($sub, $componentName) === 0 && is_dir("$componentsDir/$sub")) {
                    return ['kind' => 'dir', 'path' => "$componentsDir/$sub"];
                }
            }
        }

        // 4) Single-file component, by component name or by slug.
        foreach ([
            "$pkgDir/src/components/$componentName.tsx", "$pkgDir/src/components/$componentName.ts",
            "$pkgDir/src/$componentName.tsx", "$pkgDir/src/$componentName.ts",
            "$pkgDir/src/$slug.ts", "$pkgDir/src/$slug.tsx",
            "$pkgDir/src/components/$slug.tsx", "$pkgDir/src/components/$slug.ts",
        ] as $file) {
            if (is_file($file)) {
                return ['kind' => 'file', 'path' => $file];
            }
        }

        // 5) One-level-deep single file by slug or name (e.g. runtime/use-flow-run.ts).
        $srcDir = "$pkgDir/src";
        if (is_dir($srcDir)) {
            foreach (scandir($srcDir) as $sub) {
                if ($sub === '.' || $sub === '..' || ! is_dir("$srcDir/$sub")) {
                    continue;
                }
                foreach ([
                    "$srcDir/$sub/$slug.ts", "$srcDir/$sub/$slug.tsx",
                    "$srcDir/$sub/$componentName.tsx", "$srcDir/$sub/$componentName.ts",
                ] as $file) {
                    if (is_file($file)) {
                        return ['kind' => 'file', 'path' => $file];
                    }
                }
            }
        }

        return null;
    }

    /**
     * Read a single-file component into the registry-item file shape.
     *
     * @return list<array{path: string, content: string, type: string, target: string}>
     */
    private function readSingleFile(string $file, string $slug): array
    {
        if (! is_file($file)) {
            return [];
        }
        $name = basename($file);

        return [[
            'path' => "components/fancy/$slug/$name",
            'content' => (string) file_get_contents($file),
            'type' => 'registry:ui',
            'target' => "components/fancy/$slug/$name",
        ]];
    }

    /**
     * Read every .tsx / .ts file in the component folder (skip tests,
     * stories, snapshots). Returns the file array expected by the
     * registry-item schema.
     *
     * @return list<array{path: string, content: string, type: string, target: string}>
     */
    private function readSourceFiles(string $dir, string $slug): array
    {
        $files = [];
        foreach (scandir($dir) as $entry) {
            if (str_starts_with($entry, '.')) {
                continue;
            }
            $abs = "$dir/$entry";
            if (! is_file($abs)) {
                continue;
            }
            if (! preg_match('/\.(tsx|ts)$/', $entry)) {
                continue;
            }
            if (preg_match('/\.(test|spec|stories)\.(tsx|ts)$/', $entry)) {
                continue;
            }

            $content = (string) file_get_contents($abs);
            $files[] = [
                'path' => "components/fancy/$slug/$entry",
                'content' => $content,
                'type' => 'registry:ui',
                'target' => "components/fancy/$slug/$entry",
            ];
        }

        return $files;
    }

    /**
     * The `catalog-fms` block: storefront + admin UI components (PricingTable,
     * FeatureMatrix, FeatureGate, PlanFeaturesEditor) authored in this app
     * rather than a sibling package. One vendorable bundle — the files target
     * `components/fancy/catalog-fms/`, which the fancy-ui CLI maps to the
     * consumer's components dir, so no CLI change is needed.
     */
    private function catalogFmsBlock(): ?RegistryItem
    {
        $dir = base_path('resources/js/components/fancy/catalog-fms');
        if (! is_dir($dir)) {
            return null;
        }

        $files = $this->readSourceFiles($dir, 'catalog-fms');
        if ($files === []) {
            return null;
        }

        $imports = $this->parseImports($files);

        return new RegistryItem(
            name: 'catalog-fms',
            title: 'Catalog + FMS',
            description: 'Storefront + admin UI for a Stripe catalog (laravel-catalog) with feature gating (laravel-fms): PricingTable, FeatureMatrix, FeatureGate, PlanFeaturesEditor. Framework-agnostic, controlled, JSON-driven — see the Shop-n-Sub starter kit.',
            package: 'react-fancy',
            files: $files,
            dependencies: $imports['npm'],
            registryDependencies: $imports['registry'],
            type: 'registry:block',
        );
    }

    /**
     * Remove block + line comments before import parsing so example imports in
     * JSDoc don't register as real dependencies. URL-safe (won't eat `://`).
     */
    private function stripComments(string $code): string
    {
        $code = preg_replace('#/\*[\s\S]*?\*/#', '', $code) ?? $code;
        $code = preg_replace('#(?<!:)//[^\n]*#', '', $code) ?? $code;

        return $code;
    }

    /**
     * Parse `import ... from "x"` and `import("x")` across all files.
     * Bucket into npm deps (anything not starting with . / @/ / ~) and
     * registry deps (sibling `../OtherComponent` references).
     *
     * @param  list<array<string, string>>  $files
     * @return array{npm: list<string>, registry: list<string>}
     */
    private function parseImports(array $files): array
    {
        $npm = [];
        $registry = [];

        foreach ($files as $file) {
            // Strip comments first — JSDoc `@example` blocks routinely contain
            // `import … from "other-package"` lines that are NOT real deps.
            // (e.g. fancy-3d/canvas docs an `import … from "fancy-3d-babylon"`
            // example, which must not make canvas depend on Babylon.)
            preg_match_all(
                '/(?:from|import\s*\()\s*["\']([^"\']+)["\']/m',
                $this->stripComments($file['content']),
                $matches,
            );
            foreach ($matches[1] as $spec) {
                if (str_starts_with($spec, './') || str_starts_with($spec, '@/') || str_starts_with($spec, '~')) {
                    continue;
                }
                if (str_starts_with($spec, '../')) {
                    // Sibling component or shared util — extract the top
                    // segment of the parent folder name.
                    $parts = explode('/', trim($spec, './'));
                    if (count($parts) >= 1) {
                        $sibling = $parts[0];
                        // Skip generic folders ("utils", "hooks", "data") —
                        // those need a future "registry:lib" entry, not
                        // a component dep.
                        if (! in_array($sibling, ['utils', 'hooks', 'data', 'styles', 'icons.ts'], true)) {
                            $registry[] = Str::kebab($sibling);
                        }
                    }

                    continue;
                }
                // Bare specifier. Strip subpath: `lucide-react/icons/x` → `lucide-react`,
                // `@scope/pkg/sub` → `@scope/pkg`.
                if (str_starts_with($spec, '@')) {
                    $parts = explode('/', $spec);
                    $name = isset($parts[1]) ? "{$parts[0]}/{$parts[1]}" : $parts[0];
                } else {
                    $name = explode('/', $spec)[0];
                }

                if (in_array($name, self::PEER_DEPENDENCIES, true)) {
                    continue;
                }
                $npm[] = $name;
            }
        }

        return [
            'npm' => array_values(array_unique($npm)),
            'registry' => array_values(array_unique($registry)),
        ];
    }

    /**
     * @param  array<string, mixed>  $pkg
     * @param  array<string, mixed>  $component
     */
    private function fallbackDescription(array $pkg, array $component): string
    {
        return "{$component['name']} from {$pkg['name']}";
    }

    /** @template T @param callable():T $fn @return T */
    private function cached(string $key, callable $fn): mixed
    {
        if (app()->environment(['local', 'testing'])) {
            return $fn();
        }

        $result = Cache::remember($key, self::CACHE_TTL_SECONDS, $fn);
        if ($result === null) {
            throw new RuntimeException("registry cache miss for $key");
        }

        return $result;
    }
}

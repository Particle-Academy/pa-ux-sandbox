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
        return $this->cached('registry.all.' . $this->cacheFingerprint(), function (): array {
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
            if (is_dir(dirname(base_path()) . '/' . $slug) || is_dir(base_path('packages/' . $slug))) {
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
        // In the flat fancy-ui workspace, each package lives as a sibling of
        // px-ui-sandbox/ — base_path('../X'). Falls back to the legacy nested
        // layout (base_path('packages/X')) so this code keeps working if
        // someone runs the sandbox from inside the old laravel-catalog tree.
        $candidates = [
            dirname(base_path()) . '/' . $pkg['slug'],
            base_path('packages/' . $pkg['slug']),
        ];
        $pkgDir = null;
        foreach ($candidates as $candidate) {
            if (is_dir($candidate)) {
                $pkgDir = $candidate;
                break;
            }
        }

        // We can only build registry items for packages we can read on disk.
        // Skip cleanly otherwise — the package still appears in /packages.
        if ($pkgDir === null) {
            return [];
        }

        $items = [];
        foreach ($pkg['components'] ?? [] as $component) {
            $item = $this->buildItem($pkg, $component, $pkgDir);
            if ($item) {
                $items[] = $item;
            }
        }

        return $items;
    }

    /**
     * @param  array<string, mixed>  $pkg
     * @param  array<string, mixed>  $component
     */
    private function buildItem(array $pkg, array $component, string $pkgDir): ?RegistryItem
    {
        $sourceDir = $this->locateComponentDirectory($pkgDir, $component['name']);
        if ($sourceDir === null) {
            return null;
        }

        $files = $this->readSourceFiles($sourceDir, $component['slug']);
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
     * react-fancy uses TitleCase folders. The PackageRegistry name is
     * already TitleCase, so locating is trivial — but we fall back to a
     * case-insensitive scan in case a folder drifts.
     */
    private function locateComponentDirectory(string $pkgDir, string $componentName): ?string
    {
        $candidates = [
            "$pkgDir/src/components/$componentName",
            "$pkgDir/src/$componentName",
            "$pkgDir/src/components/".Str::kebab($componentName),
            "$pkgDir/src/components/".Str::camel($componentName),
        ];
        foreach ($candidates as $candidate) {
            if (is_dir($candidate)) {
                return $candidate;
            }
        }

        // Case-insensitive fallback over src/components.
        $componentsDir = "$pkgDir/src/components";
        if (is_dir($componentsDir)) {
            foreach (scandir($componentsDir) as $entry) {
                if ($entry === '.' || $entry === '..') {
                    continue;
                }
                if (strcasecmp($entry, $componentName) === 0) {
                    return "$componentsDir/$entry";
                }
            }
        }

        return null;
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
            preg_match_all(
                '/(?:from|import\s*\()\s*["\']([^"\']+)["\']/m',
                $file['content'],
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

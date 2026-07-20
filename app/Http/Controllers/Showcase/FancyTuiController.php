<?php

namespace App\Http\Controllers\Showcase;

use App\Http\Controllers\Controller;
use App\Support\PackageRegistry;
use App\Support\Registry\RegistrySource;
use Illuminate\Http\JsonResponse;
use Inertia\Inertia;
use Inertia\Response;

/**
 * The /fancy-tui showcase page plus the catalogue feed its "Fancy Docs TUI"
 * browses.
 *
 * The TUI is a human-browseable version of the registry MCP: the same
 * catalogue agents get from `list_components` / `get_component`, driven by a
 * keyboard. The full registry artifact is ~1.4 MB (it carries every file's
 * source), so this endpoint strips it to what the terminal actually draws and
 * the page fetches it lazily — only when the visitor switches to the console.
 */
class FancyTuiController extends Controller
{
    public function __construct(private readonly RegistrySource $source) {}

    public function index(): Response
    {
        return Inertia::render('FancyTui/Index');
    }

    /**
     * GET /fancy-tui/catalogue.json — the stripped registry the docs TUI browses.
     */
    public function catalogue(): JsonResponse
    {
        $pages = $this->componentPages();

        $items = array_map(function ($item) use ($pages): array {
            return [
                'name' => $item->name,
                'title' => $item->title,
                'description' => $item->description,
                'package' => $item->package,
                'type' => $item->type,
                'dependencies' => array_values($item->dependencies),
                'registryDependencies' => array_values($item->registryDependencies),
                // Paths only — the TUI lists files, it never shows their source.
                'files' => array_values(array_map(
                    fn (array $file): array => ['path' => (string) ($file['path'] ?? '')],
                    $item->files,
                )),
                // Resolved server-side so the terminal never offers a dead link:
                // the component's own page when one exists, else the package
                // page, else null (no web docs at all).
                'href' => $this->hrefFor($item->package, $item->name, $pages),
            ];
        }, $this->source->all());

        return response()->json([
            'count' => count($items),
            'items' => array_values($items),
        ], 200, [
            'Cache-Control' => 'public, max-age=300, s-maxage=900',
        ]);
    }

    /**
     * Every component slug that actually has a /packages/{pkg}/{slug} page,
     * keyed "package/slug". The route 404s on anything else, so the TUI's
     * "open the web docs" affordance is resolved against this, not guessed.
     *
     * @return array<string, true>
     */
    private function componentPages(): array
    {
        $pages = [];
        foreach (PackageRegistry::all() as $pkg) {
            $slug = (string) ($pkg['slug'] ?? '');
            if ($slug === '') {
                continue;
            }
            $pages[$slug.'/'] = true;
            foreach ($pkg['components'] ?? [] as $component) {
                if ($componentSlug = (string) ($component['slug'] ?? '')) {
                    $pages[$slug.'/'.$componentSlug] = true;
                }
            }
        }

        return $pages;
    }

    /** @param  array<string, true>  $pages */
    private function hrefFor(string $package, string $name, array $pages): ?string
    {
        if (isset($pages[$package.'/'.$name])) {
            return "/packages/{$package}/{$name}";
        }

        return isset($pages[$package.'/']) ? "/packages/{$package}" : null;
    }
}

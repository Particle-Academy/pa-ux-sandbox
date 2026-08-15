<?php

namespace App\Http\Controllers;

use App\Support\PackageRegistry;
use App\Support\UseCases\UseCaseContent;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

/**
 * /use-cases — the "I have this problem" entry point.
 *
 * The package list answers "what is this?", which only helps a reader who
 * already knows the vocabulary. This answers "why would I reach for it?".
 *
 * Package references are resolved to titles + hrefs HERE rather than typed into
 * the content, so a renamed package cannot leave a use case pointing at a page
 * that no longer exists.
 */
class UseCaseController extends Controller
{
    public function index(Request $request): Response
    {
        $useCases = array_map(
            fn (array $useCase) => [
                'slug' => $useCase['slug'],
                'title' => $useCase['title'],
                'category' => $useCase['category'],
                'summary' => $useCase['summary'],
                'packages' => $this->resolvePackages($useCase['packages']),
            ],
            UseCaseContent::all(),
        );

        return Inertia::render('UseCases/Index', [
            'categories' => UseCaseContent::categories(),
            'useCases' => $useCases,
        ]);
    }

    public function show(string $slug): Response
    {
        $useCase = UseCaseContent::find($slug);

        if (! $useCase) {
            throw new NotFoundHttpException("No use case [{$slug}].");
        }

        $all = UseCaseContent::all();
        $slugs = array_column($all, 'slug');
        $position = (int) array_search($slug, $slugs, true);

        return Inertia::render('UseCases/Show', [
            'useCase' => [
                'slug' => $useCase['slug'],
                'title' => $useCase['title'],
                'category' => $useCase['category'],
                'summary' => $useCase['summary'],
                'problem' => $useCase['problem'],
                'steps' => $useCase['steps'],
                // Composed previews + code samples. Both default to empty so a
                // use case written before the richer template still renders.
                'screens' => $useCase['screens'] ?? [],
                'code' => $useCase['code'] ?? [],
                'stack' => $useCase['stack'] ?? null,
                'packages' => $this->resolvePackages($useCase['packages']),
                'link' => $useCase['link'] ?? null,
                'link_label' => $useCase['link_label'] ?? null,
            ],
            // Next/previous keeps the set browsable. Someone who read one use
            // case is usually shopping, not looking something up.
            'next' => $this->neighbour($all, $position + 1),
            'previous' => $this->neighbour($all, $position - 1),
        ]);
    }

    /**
     * Package slugs -> {slug, name, href}.
     *
     * A slug missing from the registry is a defect, not something to render
     * around: it means the use case advertises a package the site cannot show.
     * Tests assert every slug resolves, so this returning a usable name is a
     * guarantee rather than a hope.
     *
     * `findAny()` rather than `find()` on purpose. 27 of the 48 packages these
     * use cases reference are COMPANIONS — the headless halves and the language
     * ports: holy-sheet, laravel-catalog, fancy-flow-php, every `-js` twin.
     * `find()` misses all of them, which would have silently dropped more than
     * half the package links on this page while rendering perfectly.
     *
     * @param  array<int,string>  $slugs
     * @return array<int,array<string,string>>
     */
    private function resolvePackages(array $slugs): array
    {
        $packages = [];

        foreach ($slugs as $slug) {
            $meta = PackageRegistry::findAny($slug);

            if (! $meta) {
                continue;
            }

            $packages[] = [
                'slug' => $slug,
                'name' => $meta['name'] ?? $slug,
                'href' => "/packages/{$slug}",
            ];
        }

        return $packages;
    }

    /**
     * @param  array<int,array<string,mixed>>  $all
     * @return array<string,string>|null
     */
    private function neighbour(array $all, int $index): ?array
    {
        if (! isset($all[$index])) {
            return null;
        }

        return [
            'slug' => $all[$index]['slug'],
            'title' => $all[$index]['title'],
        ];
    }
}

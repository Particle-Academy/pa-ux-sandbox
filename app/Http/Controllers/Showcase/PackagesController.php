<?php

namespace App\Http\Controllers\Showcase;

use App\Http\Controllers\Controller;
use App\Support\PackageRegistry;
use Inertia\Inertia;
use Inertia\Response;

class PackagesController extends Controller
{
    public function index(): Response
    {
        $packages = collect(PackageRegistry::all())->map(fn (array $p) => [
            'slug' => $p['slug'],
            'name' => $p['name'],
            'tagline' => $p['tagline'],
            'language' => $p['language'],
            'components_count' => count($p['components'] ?? []),
        ])->all();

        return Inertia::render('Packages/Index', ['packages' => $packages]);
    }

    public function show(string $package): Response
    {
        $pkg = PackageRegistry::find($package);
        abort_if($pkg === null, 404);

        return Inertia::render('Packages/Show', ['package' => $pkg]);
    }

    public function component(string $package, string $component): Response
    {
        $pkg = PackageRegistry::find($package);
        abort_if($pkg === null, 404);

        $comp = collect($pkg['components'] ?? [])->firstWhere('slug', $component);
        abort_if($comp === null, 404);

        return Inertia::render('Packages/Component', [
            'package' => [
                'slug' => $pkg['slug'],
                'name' => $pkg['name'],
                'npm' => $pkg['npm'] ?? null,
                'composer' => $pkg['composer'] ?? null,
            ],
            'component' => $comp,
            'usage' => null,
        ]);
    }
}

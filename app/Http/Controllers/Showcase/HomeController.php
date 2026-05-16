<?php

namespace App\Http\Controllers\Showcase;

use App\Http\Controllers\Controller;
use App\Support\PackageRegistry;
use Inertia\Inertia;
use Inertia\Response;

class HomeController extends Controller
{
    public function __invoke(): Response
    {
        $packages = collect(PackageRegistry::all())->map(fn (array $p) => [
            'slug' => $p['slug'],
            'name' => $p['name'],
            'tagline' => $p['tagline'],
            'language' => $p['language'],
            'components_count' => count($p['components'] ?? []),
        ])->all();

        return Inertia::render('Home', [
            'packages' => $packages,
            'total_components' => collect(PackageRegistry::all())
                ->sum(fn (array $p) => count($p['components'] ?? [])),
        ]);
    }
}

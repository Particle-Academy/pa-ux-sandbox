<?php

namespace App\Http\Controllers\Showcase;

use App\Http\Controllers\Controller;
use App\Support\PackageRegistry;
use Illuminate\Contracts\View\View;

class PackagesController extends Controller
{
    public function index(): View
    {
        return view('showcase.packages.index', [
            'packages' => PackageRegistry::all(),
        ]);
    }

    public function show(string $package): View
    {
        $pkg = PackageRegistry::find($package);
        abort_if($pkg === null, 404);

        return view('showcase.packages.show', ['package' => $pkg]);
    }

    public function component(string $package, string $component): View
    {
        $pkg = PackageRegistry::find($package);
        abort_if($pkg === null, 404);

        $comp = collect($pkg['components'] ?? [])->firstWhere('slug', $component);
        abort_if($comp === null, 404);

        return view('showcase.packages.component', [
            'package' => $pkg,
            'component' => $comp,
        ]);
    }
}

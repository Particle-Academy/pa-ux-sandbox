<?php

namespace App\Http\Controllers\Showcase;

use App\Http\Controllers\Controller;
use App\Models\DreamArchive;
use Illuminate\Contracts\View\View;

class DreamingController extends Controller
{
    public function index(): View
    {
        return view('showcase.dreaming.index');
    }

    public function archived(): View
    {
        return view('showcase.dreaming.archived', [
            'archives' => DreamArchive::query()->orderByDesc('archived_at')->get(),
        ]);
    }
}

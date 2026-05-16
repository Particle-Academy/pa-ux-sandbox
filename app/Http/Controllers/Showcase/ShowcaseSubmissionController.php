<?php

namespace App\Http\Controllers\Showcase;

use App\Http\Controllers\Controller;
use App\Jobs\ScanShowcaseSubmission;
use App\Models\ShowcaseSubmission;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ShowcaseSubmissionController extends Controller
{
    public function index(): Response
    {
        $submissions = ShowcaseSubmission::query()
            ->where('status', 'verified')
            ->orderByDesc('id')
            ->get()
            ->map(fn ($s) => [
                'id' => $s->id,
                'kind' => $s->kind,
                'url' => $s->url,
                'title' => $s->title,
                'description' => $s->description,
                'thumbnail_url' => $s->thumbnail_url,
            ])
            ->all();

        return Inertia::render('Showcase/Index', ['submissions' => $submissions]);
    }

    public function create(): Response
    {
        return Inertia::render('Showcase/Create');
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'kind' => 'required|in:website,repo',
            'url' => 'required|url|max:255',
            'title' => 'nullable|string|max:120',
            'description' => 'nullable|string|max:600',
        ]);

        $submission = ShowcaseSubmission::create([
            'user_id' => $request->user()->id,
            'kind' => $data['kind'],
            'url' => $data['url'],
            'title' => $data['title'] ?? null,
            'description' => $data['description'] ?? null,
            'status' => 'pending',
        ]);

        ScanShowcaseSubmission::dispatch($submission);

        return redirect()
            ->route('showcase.showcase.index')
            ->with('submitted', "Submission #{$submission->id} queued for verification.");
    }
}

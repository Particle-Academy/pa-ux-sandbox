<?php

namespace App\Http\Controllers\Showcase;

use App\Http\Controllers\Controller;
use App\Models\ShowcaseSubmission;
use Illuminate\Contracts\View\View;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class ShowcaseSubmissionController extends Controller
{
    public function index(): View
    {
        return view('showcase.showcase.index', [
            'submissions' => ShowcaseSubmission::query()
                ->where('status', 'verified')
                ->orderByDesc('id')
                ->get(),
        ]);
    }

    public function create(): View
    {
        return view('showcase.showcase.create');
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

        // Phase 5 will dispatch a scan job here; for now mark pending.
        return redirect()
            ->route('showcase.showcase.index')
            ->with('submitted', "Submission #{$submission->id} queued for verification.");
    }
}

<?php

namespace App\Http\Controllers\Showcase;

use App\Http\Controllers\Controller;
use App\Http\Requests\Showcase\StoreShowcaseSubmissionRequest;
use App\Jobs\ScanShowcaseSubmission;
use App\Models\ShowcaseSubmission;
use Illuminate\Http\RedirectResponse;
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

    public function store(StoreShowcaseSubmissionRequest $request): RedirectResponse
    {
        $data = $request->validated();

        // For website submissions the request gate already fetched the URL
        // and confirmed the Fancy Pixel is present — pre-seed scan_result so
        // the background scanner has the gate's finding on record.
        $scanResult = null;
        if ($data['kind'] === 'website' && $request->pixelFound) {
            $scanResult = [
                'gate' => 'pixel detected at submission',
                'badge' => true,
            ];
        }

        $submission = ShowcaseSubmission::create([
            'user_id' => $request->user()->id,
            'kind' => $data['kind'],
            'url' => $data['url'],
            'title' => $data['title'] ?? null,
            'description' => $data['description'] ?? null,
            'status' => 'pending',
            'scan_result' => $scanResult,
        ]);

        ScanShowcaseSubmission::dispatch($submission);

        return redirect()
            ->route('showcase.showcase.index')
            ->with('submitted', "Submission #{$submission->id} queued for verification.");
    }
}

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

    /**
     * Register a site. GA-style: this NEVER blocks. We create a PENDING
     * submission (with a generated site_key + chosen style/mode), kick off the
     * async pixel verification, and send the owner to their install page.
     */
    public function store(StoreShowcaseSubmissionRequest $request): RedirectResponse
    {
        $data = $request->validated();

        $submission = ShowcaseSubmission::create([
            'user_id' => $request->user()->id,
            'kind' => $data['kind'],
            'url' => $data['url'],
            'title' => $data['title'] ?? null,
            'description' => $data['description'] ?? null,
            'style' => $data['style'] ?? 'badge',
            'mode' => $data['mode'] ?? 'floating',
            'status' => 'pending',
        ]);

        ScanShowcaseSubmission::dispatch($submission);

        return redirect()->route('showcase.showcase.installed', $submission);
    }

    /**
     * The GA-style install page: a generated pixel snippet + a visual install
     * guide + the live verification status. Owner-only.
     */
    public function installed(ShowcaseSubmission $submission): Response
    {
        $this->authorizeOwner($submission);

        return Inertia::render('Showcase/Installed', [
            'submission' => $this->present($submission),
            'snippet' => $this->snippetFor($submission),
        ]);
    }

    /**
     * "Check now": re-dispatch the async verifier and bounce back to the
     * install page so the status badge refreshes.
     */
    public function rescan(ShowcaseSubmission $submission): RedirectResponse
    {
        $this->authorizeOwner($submission);

        ScanShowcaseSubmission::dispatch($submission);

        return redirect()
            ->route('showcase.showcase.installed', $submission)
            ->with('rescanned', 'Re-checking your site for the Fancy Pixel…');
    }

    /**
     * Build the copy-paste pixel snippet from the submission's real site_key,
     * chosen style/mode, and this app's host (for the heuristics endpoint).
     */
    private function snippetFor(ShowcaseSubmission $submission): string
    {
        $endpoint = rtrim((string) config('app.url'), '/').'/heuristics';

        return sprintf(
            '<script src="https://unpkg.com/@particle-academy/fancy-pixel/dist/fancy-pixel.global.min.js" data-site="%s" data-style="%s" data-mode="%s" data-endpoint="%s"></script>',
            $submission->site_key,
            $submission->style,
            $submission->mode,
            $endpoint,
        );
    }

    /**
     * @return array<string, mixed>
     */
    private function present(ShowcaseSubmission $submission): array
    {
        return [
            'id' => $submission->id,
            'site_key' => $submission->site_key,
            'kind' => $submission->kind,
            'url' => $submission->url,
            'title' => $submission->title,
            'description' => $submission->description,
            'style' => $submission->style,
            'mode' => $submission->mode,
            'status' => $submission->status,
            'scanned_at' => $submission->scanned_at?->toIso8601String(),
        ];
    }

    private function authorizeOwner(ShowcaseSubmission $submission): void
    {
        abort_unless(
            request()->user() !== null && $submission->user_id === request()->user()->id,
            403,
        );
    }
}

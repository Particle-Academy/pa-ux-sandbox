<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Jobs\ScanShowcaseSubmission;
use App\Models\ShowcaseSubmission;
use App\Services\ShowcaseRewards;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class AdminShowcaseSubmissionsController extends Controller
{
    public function index(Request $request): Response
    {
        $status = $request->query('status', 'pending');
        if (! in_array($status, ['pending', 'verified', 'rejected', 'all'], true)) {
            $status = 'pending';
        }

        $query = ShowcaseSubmission::query()->with('user')->latest('id');
        if ($status !== 'all') {
            $query->where('status', $status);
        }

        $submissions = $query->paginate(25)->withQueryString();

        $counts = [
            'pending' => ShowcaseSubmission::where('status', 'pending')->count(),
            'verified' => ShowcaseSubmission::where('status', 'verified')->count(),
            'rejected' => ShowcaseSubmission::where('status', 'rejected')->count(),
        ];

        return Inertia::render('Admin/Submissions', [
            'submissions' => collect($submissions->items())->map(fn (ShowcaseSubmission $submission) => [
                'id' => $submission->id,
                'title' => $submission->title,
                'url' => $submission->url,
                'kind' => $submission->kind,
                'status' => $submission->status,
                'thumbnail_url' => $submission->thumbnail_url,
                'featured' => $submission->isFeatured(),
                'created' => $submission->created_at?->format('M j, Y'),
                'user' => [
                    'name' => $submission->user?->name,
                    'github_username' => $submission->user?->github_username,
                ],
            ])->all(),
            'status' => $status,
            'counts' => $counts,
            'pending' => $counts['pending'],
        ]);
    }

    public function show(ShowcaseSubmission $submission): Response
    {
        $submission->load('user');

        return Inertia::render('Admin/SubmissionShow', [
            'submission' => [
                'id' => $submission->id,
                'title' => $submission->title,
                'description' => $submission->description,
                'url' => $submission->url,
                'kind' => $submission->kind,
                'status' => $submission->status,
                'scan_result' => $submission->scan_result,
                'thumbnail_url' => $submission->thumbnail_url,
                'featured' => $submission->isFeatured(),
                'featured_until' => $submission->featured_until?->format('M j, Y'),
                'created' => $submission->created_at?->format('M j, Y'),
                'scanned_at' => $submission->scanned_at?->diffForHumans(),
                'rewarded_at' => $submission->rewarded_at?->format('M j, Y'),
                'user' => [
                    'name' => $submission->user?->name,
                    'github_username' => $submission->user?->github_username,
                ],
            ],
            'pending' => ShowcaseSubmission::where('status', 'pending')->count(),
        ]);
    }

    public function verify(ShowcaseSubmission $submission, ShowcaseRewards $rewards): RedirectResponse
    {
        $submission->update(['status' => 'verified']);
        // Pays projects-xp + first-project once (idempotent).
        $rewards->onVerified($submission);

        return back()->with('success', "Submission #{$submission->id} verified.");
    }

    public function reject(ShowcaseSubmission $submission): RedirectResponse
    {
        $submission->update(['status' => 'rejected']);

        return back()->with('success', "Submission #{$submission->id} rejected.");
    }

    public function feature(Request $request, ShowcaseSubmission $submission): RedirectResponse
    {
        $data = $request->validate([
            'days' => 'required|integer|min:1|max:365',
        ]);

        // Admin comp — extends an active window rather than replacing it,
        // matching the paid Shop service behavior.
        $base = $submission->featured_until && $submission->featured_until->isFuture()
            ? $submission->featured_until
            : now();
        $submission->update(['featured_until' => $base->copy()->addDays($data['days'])]);

        return back()->with('success', "Featured #{$submission->id} for {$data['days']} more days.");
    }

    public function unfeature(ShowcaseSubmission $submission): RedirectResponse
    {
        $submission->update(['featured_until' => null]);

        return back()->with('success', "Removed feature window from #{$submission->id}.");
    }

    public function rescan(ShowcaseSubmission $submission): RedirectResponse
    {
        $submission->update(['status' => 'pending']);
        ScanShowcaseSubmission::dispatch($submission);

        return back()->with('success', "Re-queued #{$submission->id} for scanning.");
    }
}

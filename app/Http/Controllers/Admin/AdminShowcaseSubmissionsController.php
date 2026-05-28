<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Jobs\ScanShowcaseSubmission;
use App\Models\ShowcaseSubmission;
use App\Services\ShowcaseRewards;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class AdminShowcaseSubmissionsController extends Controller
{
    public function index(Request $request): \Illuminate\Contracts\View\View
    {
        $status = $request->query('status', 'pending');
        if (! in_array($status, ['pending', 'verified', 'rejected', 'all'], true)) {
            $status = 'pending';
        }

        $query = ShowcaseSubmission::query()->with('user')->latest('id');
        if ($status !== 'all') {
            $query->where('status', $status);
        }

        return view('admin.submissions.index', [
            'submissions' => $query->paginate(25)->withQueryString(),
            'status' => $status,
            'counts' => [
                'pending' => ShowcaseSubmission::where('status', 'pending')->count(),
                'verified' => ShowcaseSubmission::where('status', 'verified')->count(),
                'rejected' => ShowcaseSubmission::where('status', 'rejected')->count(),
            ],
        ]);
    }

    public function show(ShowcaseSubmission $submission): \Illuminate\Contracts\View\View
    {
        return view('admin.submissions.show', [
            'submission' => $submission->load('user'),
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

<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Jobs\CaptureSiteScreenshot;
use App\Jobs\ScanShowcaseSubmission;
use App\Models\ShowcaseSubmission;
use App\Models\User;
use App\Services\Entitlements;
use App\Services\Heuristics\HeuristicsReport;
use App\Services\ShowcaseRewards;
use FancyHeuristics\Models\HeuristicsEvent;
use FancyHeuristics\Models\HeuristicsSite;
use FancyHeuristics\Services\PixelVerifier;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

/**
 * The unified "Sites" admin — one surface for what used to be split across
 * /admin/submissions (moderation) and /admin/heuristics (analytics). A showcase
 * submission IS an analytics site, so they live together: every row carries the
 * owner, status, moderation state, basic stats, and the owner's Pro tier; the
 * detail page adds the full per-site analytics + every moderation action.
 *
 * Labels are always human-readable (site title/URL, owner name/github) — never
 * a raw id or random site_key.
 */
class AdminSitesController extends Controller
{
    public function __construct(private readonly Entitlements $entitlements) {}

    public function index(Request $request): Response
    {
        $search = trim((string) $request->query('q', ''));
        $filter = (string) $request->query('filter', 'all');

        $query = ShowcaseSubmission::query()->with('user')->latest('id');

        match ($filter) {
            'pending' => $query->where('status', 'pending'),
            'verified' => $query->publiclyListable(),
            'rejected' => $query->where('status', 'rejected'),
            'suspended' => $query->whereNotNull('suspended_at'),
            'flagged' => $query->where('nsfw_status', 'flagged'),
            'kids' => $query->where('made_for_children', true),
            default => null,
        };

        if ($search !== '') {
            $query->where(function ($q) use ($search): void {
                $q->where('url', 'like', "%{$search}%")
                    ->orWhere('title', 'like', "%{$search}%")
                    ->orWhereHas('user', fn ($u) => $u
                        ->where('name', 'like', "%{$search}%")
                        ->orWhere('github_username', 'like', "%{$search}%"));
            });
        }

        $page = $query->paginate(25)->withQueryString();

        $stats = $this->perSiteStats();
        $proByUser = $this->proSourcesFor(collect($page->items())->pluck('user')->filter());

        return Inertia::render('Admin/Sites', [
            'sites' => collect($page->items())->map(fn (ShowcaseSubmission $s) => $this->rowFor($s, $stats, $proByUser))->all(),
            'pagination' => [
                'current' => $page->currentPage(),
                'last' => $page->lastPage(),
                'total' => $page->total(),
                'prevUrl' => $page->previousPageUrl(),
                'nextUrl' => $page->nextPageUrl(),
            ],
            'filter' => $filter,
            'q' => $search,
            'global' => $this->globalStats(),
            'pending' => (int) ShowcaseSubmission::where('status', 'pending')->count(),
        ]);
    }

    public function show(ShowcaseSubmission $submission, HeuristicsReport $report): Response
    {
        $submission->load('user');
        $key = (string) $submission->site_key;
        $heatmap = $report->heatmapForBusiestPath($key);
        $site = HeuristicsSite::query()->where('site_key', $key)->first();

        return Inertia::render('Admin/SiteShow', [
            'site' => [
                'id' => $submission->id,
                'title' => $this->label($submission),
                'url' => $submission->url,
                'site_key' => $key,
                'kind' => $submission->kind,
                'description' => $submission->description,
                'status' => $submission->status,
                'category' => $submission->category,
                'category_label' => $submission->category ? (ShowcaseSubmission::CATEGORIES[$submission->category] ?? null) : null,
                'nsfw_declared' => $submission->nsfw_declared,
                'nsfw_status' => $submission->nsfw_status,
                'nsfw_flag_reason' => $submission->nsfw_flag_reason,
                'made_for_children' => $submission->made_for_children,
                'suspended_at' => $submission->suspended_at?->diffForHumans(),
                'suspension_reason' => $submission->suspension_reason,
                'listable' => $submission->isPubliclyListable(),
                'featured' => $submission->isFeatured(),
                'featured_until' => $submission->featured_until?->format('M j, Y'),
                'thumbnail_url' => $submission->thumbnail_url,
                'scan_result' => $submission->scan_result,
                'scanned_at' => $submission->scanned_at?->diffForHumans(),
                'created' => $submission->created_at?->format('M j, Y'),
                'pixel_status' => $site?->pixel_status,
                'last_verified' => $site?->last_verified_at?->diffForHumans(),
            ],
            'owner' => $this->ownerPayload($submission->user),
            'categories' => collect(ShowcaseSubmission::CATEGORIES)->map(fn ($label, $slug) => ['slug' => $slug, 'label' => $label])->values()->all(),
            'kpis' => $report->kpis($key),
            'topPaths' => $report->topPaths($key),
            'heatmap' => $heatmap,
            'heatmapShot' => $heatmap ? $report->screenshotForPath($key, $heatmap['path']) : null,
            'recentSessions' => $report->recentSessions($key),
            'eventsOverTime' => $report->eventsOverTime($key),
            'pending' => (int) ShowcaseSubmission::where('status', 'pending')->count(),
        ]);
    }

    // ── Moderation + lifecycle actions ──────────────────────────────────────

    public function verify(ShowcaseSubmission $submission, ShowcaseRewards $rewards): RedirectResponse
    {
        $submission->update(['status' => 'verified']);
        $rewards->onVerified($submission);
        $submission->refresh()->syncHeuristicsVisibility();

        return back()->with('success', "Verified {$this->label($submission)}.");
    }

    public function reject(ShowcaseSubmission $submission): RedirectResponse
    {
        $submission->update(['status' => 'rejected']);
        $submission->refresh()->syncHeuristicsVisibility();

        return back()->with('success', "Rejected {$this->label($submission)}.");
    }

    public function rescan(ShowcaseSubmission $submission): RedirectResponse
    {
        $submission->update(['status' => 'pending']);
        ScanShowcaseSubmission::dispatch($submission);

        return back()->with('success', "Re-queued {$this->label($submission)} for scanning.");
    }

    public function recapture(ShowcaseSubmission $submission): RedirectResponse
    {
        if (! $submission->shouldCaptureScreenshot()) {
            return back()->with('error', 'NSFW / children\'s sites do not get screenshots.');
        }
        CaptureSiteScreenshot::dispatch(
            $submission->url,
            (string) $submission->site_key,
            parse_url($submission->url, PHP_URL_PATH) ?: '/',
        );

        return back()->with('success', "Queued a fresh screenshot for {$this->label($submission)}.");
    }

    public function feature(Request $request, ShowcaseSubmission $submission): RedirectResponse
    {
        $days = (int) $request->validate(['days' => 'required|integer|min:1|max:365'])['days'];
        $base = $submission->featured_until?->isFuture() ? $submission->featured_until : now();
        $submission->update(['featured_until' => $base->copy()->addDays($days)]);

        return back()->with('success', "Featured {$this->label($submission)} for {$days} more days.");
    }

    public function unfeature(ShowcaseSubmission $submission): RedirectResponse
    {
        $submission->update(['featured_until' => null]);

        return back()->with('success', "Unfeatured {$this->label($submission)}.");
    }

    public function suspend(Request $request, ShowcaseSubmission $submission): RedirectResponse
    {
        $reason = (string) $request->validate(['reason' => 'required|string|max:255'])['reason'];
        $submission->update(['suspended_at' => now(), 'suspension_reason' => $reason]);
        $submission->refresh()->syncHeuristicsVisibility();

        return back()->with('success', "Suspended {$this->label($submission)} from the showcase. Analytics is unaffected for a Pro owner.");
    }

    public function unsuspend(ShowcaseSubmission $submission): RedirectResponse
    {
        $submission->update(['suspended_at' => null, 'suspension_reason' => null]);
        $submission->refresh()->syncHeuristicsVisibility();

        return back()->with('success', "Lifted suspension on {$this->label($submission)}.");
    }

    /** Confirm an NSFW flag on an undeclared site → suspend it (Pro keeps analytics). */
    public function confirmNsfw(ShowcaseSubmission $submission): RedirectResponse
    {
        $submission->update([
            'nsfw_status' => 'confirmed',
            'suspended_at' => now(),
            'suspension_reason' => 'NSFW (undeclared)',
        ]);
        $submission->refresh()->syncHeuristicsVisibility();

        return back()->with('success', "Confirmed NSFW + suspended {$this->label($submission)}.");
    }

    /** Clear a false-positive NSFW flag → site returns to the listing. */
    public function clearNsfw(ShowcaseSubmission $submission): RedirectResponse
    {
        $submission->update(['nsfw_status' => 'cleared', 'nsfw_flag_reason' => null]);
        $submission->refresh()->syncHeuristicsVisibility();

        return back()->with('success', "Cleared the NSFW flag on {$this->label($submission)}.");
    }

    public function setCategory(Request $request, ShowcaseSubmission $submission): RedirectResponse
    {
        $data = $request->validate([
            'category' => 'nullable|in:'.implode(',', array_keys(ShowcaseSubmission::CATEGORIES)),
            'made_for_children' => 'boolean',
        ]);
        $submission->update([
            'category' => $data['category'] ?? null,
            'made_for_children' => $data['made_for_children'] ?? $submission->made_for_children,
        ]);
        $submission->refresh()->syncHeuristicsVisibility();

        return back()->with('success', "Updated classification for {$this->label($submission)}.");
    }

    /** Grant/revoke the owner's manual Pro straight from the site page. */
    public function toggleOwnerPro(ShowcaseSubmission $submission): RedirectResponse
    {
        $owner = $submission->user;
        if ($owner === null) {
            return back()->with('error', 'This site has no owner.');
        }
        $owner->update(['pro_override' => ! $owner->pro_override]);

        return back()->with('success', "{$owner->name} ".($owner->pro_override ? 'granted Pro.' : 'Pro revoked.'));
    }

    public function verifyPixel(ShowcaseSubmission $submission, PixelVerifier $verifier): RedirectResponse
    {
        $site = HeuristicsSite::query()->where('site_key', $submission->site_key)->first();
        if ($site === null) {
            return back()->with('error', 'No heuristics site registered for this submission yet.');
        }
        $passed = $verifier->verify($site);

        return back()->with('success', $passed
            ? "Pixel verified for {$this->label($submission)}."
            : "Pixel verification failed: {$site->fresh()?->pixel_status}.");
    }

    /** Bulk verify / suspend / unsuspend / feature / unfeature across a selection. */
    public function bulk(Request $request, ShowcaseRewards $rewards): RedirectResponse
    {
        $data = $request->validate([
            'action' => 'required|in:verify,reject,suspend,unsuspend,feature,unfeature',
            'ids' => 'required|array|min:1',
            'ids.*' => 'integer',
        ]);

        $subs = ShowcaseSubmission::query()->whereIn('id', $data['ids'])->get();
        foreach ($subs as $sub) {
            match ($data['action']) {
                'verify' => tap($sub, fn ($s) => $s->update(['status' => 'verified']))->refresh()->syncHeuristicsVisibility(),
                'reject' => tap($sub, fn ($s) => $s->update(['status' => 'rejected']))->refresh()->syncHeuristicsVisibility(),
                'suspend' => tap($sub, fn ($s) => $s->update(['suspended_at' => now(), 'suspension_reason' => 'bulk admin action']))->refresh()->syncHeuristicsVisibility(),
                'unsuspend' => tap($sub, fn ($s) => $s->update(['suspended_at' => null, 'suspension_reason' => null]))->refresh()->syncHeuristicsVisibility(),
                'feature' => $sub->update(['featured_until' => now()->addDays(7)]),
                'unfeature' => $sub->update(['featured_until' => null]),
            };
            if ($data['action'] === 'verify') {
                $rewards->onVerified($sub);
            }
        }

        return back()->with('success', ucfirst($data['action'])." applied to {$subs->count()} site(s).");
    }

    // ── Helpers ─────────────────────────────────────────────────────────────

    /** A human label for a site — title, else the URL host. Never a site_key. */
    private function label(ShowcaseSubmission $s): string
    {
        return $s->title ?: (parse_url($s->url, PHP_URL_HOST) ?: $s->url);
    }

    /** @return array<string, mixed> */
    private function rowFor(ShowcaseSubmission $s, $stats, $proByUser): array
    {
        $stat = $stats->get($s->site_key);

        return [
            'id' => $s->id,
            'label' => $this->label($s),
            'url' => $s->url,
            'host' => parse_url($s->url, PHP_URL_HOST) ?: $s->url,
            'kind' => $s->kind,
            'status' => $s->status,
            'listable' => $s->isPubliclyListable(),
            'suspended' => $s->isSuspended(),
            'nsfw_status' => $s->nsfw_status,
            'nsfw_declared' => $s->nsfw_declared,
            'made_for_children' => $s->made_for_children,
            'category_label' => $s->category ? (ShowcaseSubmission::CATEGORIES[$s->category] ?? null) : null,
            'featured' => $s->isFeatured(),
            'thumbnail_url' => $s->thumbnail_url,
            'pageviews' => (int) ($stat->pageviews ?? 0),
            'sessions' => (int) ($stat->sessions ?? 0),
            'events' => (int) ($stat->events ?? 0),
            'created' => $s->created_at?->format('M j, Y'),
            'owner' => [
                'name' => $s->user?->name ?? '—',
                'github' => $s->user?->github_username,
                'proSource' => $s->user ? ($proByUser[$s->user->id] ?? null) : null,
            ],
        ];
    }

    /** @return array<string, mixed> */
    private function ownerPayload(?User $owner): array
    {
        return [
            'id' => $owner?->id,
            'name' => $owner?->name ?? '—',
            'github' => $owner?->github_username,
            'avatar_url' => $owner?->avatar_url,
            'proSource' => $owner ? $this->entitlements->proSource($owner) : null,
            'pro_override' => (bool) $owner?->pro_override,
        ];
    }

    /** Pre-aggregate per-site event/pageview/session counts (avoids N+1). */
    private function perSiteStats()
    {
        return HeuristicsEvent::query()
            ->selectRaw('site_key')
            ->selectRaw('COUNT(*) as events')
            ->selectRaw("SUM(CASE WHEN kind = 'pageview' THEN 1 ELSE 0 END) as pageviews")
            ->selectRaw('COUNT(DISTINCT session_id) as sessions')
            ->groupBy('site_key')
            ->get()
            ->keyBy('site_key');
    }

    /**
     * Resolve proSource once per distinct owner (dedup so a user with many sites
     * isn't checked repeatedly).
     *
     * @return array<int, ?string>
     */
    private function proSourcesFor($users): array
    {
        return $users->unique('id')->mapWithKeys(
            fn (User $u): array => [$u->id => $this->entitlements->proSource($u)],
        )->all();
    }

    /** @return array<string, int> */
    private function globalStats(): array
    {
        return [
            'sites' => (int) ShowcaseSubmission::count(),
            'listed' => (int) ShowcaseSubmission::query()->publiclyListable()->count(),
            'pending' => (int) ShowcaseSubmission::where('status', 'pending')->count(),
            'flagged' => (int) ShowcaseSubmission::where('nsfw_status', 'flagged')->count(),
            'suspended' => (int) ShowcaseSubmission::whereNotNull('suspended_at')->count(),
            'kids' => (int) ShowcaseSubmission::where('made_for_children', true)->count(),
            'events' => (int) HeuristicsEvent::count(),
            'sessions' => (int) HeuristicsEvent::whereNotNull('session_id')->distinct()->count('session_id'),
            'users' => (int) User::count(),
            'proManual' => (int) User::where('pro_override', true)->count(),
        ];
    }
}

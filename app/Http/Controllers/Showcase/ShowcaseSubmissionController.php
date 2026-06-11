<?php

namespace App\Http\Controllers\Showcase;

use App\Http\Controllers\Controller;
use App\Http\Requests\Showcase\StoreShowcaseSubmissionRequest;
use App\Jobs\ScanShowcaseSubmission;
use App\Models\ShowcaseSubmission;
use App\Models\SitePageShot;
use App\Services\Heuristics\HeuristicsReport;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ShowcaseSubmissionController extends Controller
{
    public function index(): Response
    {
        // Public listing excludes anything not publicly listable — not verified,
        // suspended, self-declared NSFW, or flagged/confirmed NSFW. Children's
        // sites ARE listed (badged).
        $submissions = ShowcaseSubmission::query()
            ->publiclyListable()
            ->orderByDesc('id')
            ->get();

        // The captured homepage screenshot (site_page_shots — same source the
        // analytics heatmap draws on) IS the thumbnail; the legacy thumbnail_url
        // column was never populated. Batch the latest shot per site_key (we only
        // ever capture the homepage now) to avoid an N+1.
        $shots = SitePageShot::query()
            ->whereIn('site_key', $submissions->pluck('site_key'))
            ->orderByDesc('captured_at')
            ->get()
            ->groupBy('site_key')
            ->map(fn ($group) => $group->first()->url());

        $list = $submissions->map(fn (ShowcaseSubmission $s) => [
            'id' => $s->id,
            'kind' => $s->kind,
            'url' => $s->url,
            'title' => $s->title,
            'description' => $s->description,
            'category' => $s->category,
            'category_label' => $s->category ? (ShowcaseSubmission::CATEGORIES[$s->category] ?? null) : null,
            'made_for_children' => $s->made_for_children,
            'thumbnail_url' => $shots->get($s->site_key) ?? $s->thumbnail_url,
        ])->all();

        return Inertia::render('Showcase/Index', ['submissions' => $list]);
    }

    /**
     * The signed-in user's own submissions — every status — each with a free
     * basic stat strip (pageviews / sessions / clicks / human vs agent) read
     * from the live heuristics feed. It's the owner's own data, so it's not
     * Pro-gated; the rich suite (heatmaps, sessions, trends, multi-site) stays
     * behind /analytics for Pro.
     */
    public function mine(Request $request, HeuristicsReport $report): Response
    {
        $submissions = ShowcaseSubmission::query()
            ->where('user_id', $request->user()->id)
            ->orderByDesc('id')
            ->get()
            ->map(function (ShowcaseSubmission $submission) use ($report): array {
                $data = $this->present($submission);
                $data['stats'] = $submission->site_key
                    ? $this->basicStats($report, (string) $submission->site_key)
                    : null;

                return $data;
            })
            ->all();

        return Inertia::render('Showcase/Mine', ['submissions' => $submissions]);
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
            'category' => $data['category'] ?? null,
            'nsfw_declared' => $data['nsfw_declared'] ?? false,
            'made_for_children' => $data['made_for_children'] ?? false,
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
            'snippet' => $submission->kind === 'website' ? $this->snippetFor($submission) : null,
            'badgeMarkdown' => $submission->kind === 'repo' ? $this->badgeMarkdownFor($submission) : null,
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

        $message = $submission->kind === 'repo'
            ? 'Re-checking your repo for the Fancified badge + Fancy usage…'
            : 'Re-checking your site for the Fancy Pixel…';

        return redirect()
            ->route('showcase.showcase.installed', $submission)
            ->with('rescanned', $message);
    }

    /**
     * Build the copy-paste pixel snippet from the submission's real site_key,
     * chosen style/mode, and this app's host (for the heuristics endpoint).
     */
    private function snippetFor(ShowcaseSubmission $submission): string
    {
        // Always https: the embed lands on submitters' (usually https) sites, so
        // an http endpoint would have their pixel beacons blocked as mixed content.
        $endpoint = secure_url('/heuristics');

        return sprintf(
            '<script src="https://unpkg.com/@particle-academy/fancy-pixel/dist/fancy-pixel.global.min.js" data-site="%s" data-style="%s" data-mode="%s" data-endpoint="%s"></script>',
            $submission->site_key,
            $submission->style,
            $submission->mode,
            $endpoint,
        );
    }

    /**
     * Build the copy-paste README markdown for the public Fancified badge,
     * keyed to this submission's site_key. This is the repo equivalent of the
     * pixel snippet — pasting it (and using Fancy in >=30% of view/component
     * files) is what flips a pending repo to verified.
     */
    private function badgeMarkdownFor(ShowcaseSubmission $submission): string
    {
        $host = rtrim((string) config('app.url'), '/');
        $badgeUrl = $host.'/badge/fancified.svg?site='.$submission->site_key;

        return sprintf('[![Fancified](%s)](https://particle.academy)', $badgeUrl);
    }

    /**
     * Owner-visible basic KPIs for one site — a free subset of the Pro suite's
     * rollups, computed by the same shared HeuristicsReport so the numbers
     * match /analytics exactly.
     *
     * @return array{pageviews: int, sessions: int, clicks: int, human: int, agent: int, totalEvents: int}
     */
    private function basicStats(HeuristicsReport $report, string $siteKey): array
    {
        $kpis = $report->kpis($siteKey);

        return [
            'pageviews' => $kpis['pageviews'],
            'sessions' => $kpis['sessions'],
            'clicks' => $kpis['clicks'],
            'human' => $kpis['human'],
            'agent' => $kpis['agent'],
            'totalEvents' => $kpis['totalEvents'],
        ];
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
            'scan_result' => $submission->scan_result,
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

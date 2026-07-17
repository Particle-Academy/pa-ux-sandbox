<?php

namespace App\Http\Controllers\Showcase;

use App\Http\Controllers\Controller;
use App\Http\Requests\Showcase\StoreShowcaseSubmissionRequest;
use App\Jobs\ScanShowcaseSubmission;
use App\Models\ShowcaseSubmission;
use App\Models\SitePageShot;
use App\Services\Heuristics\HeuristicsReport;
use App\Services\Showcase\SubmissionSnippets;
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
            // The verified "built with" record — Fancy packages the scan
            // detected, linked to their registry pages when known.
            'packages' => $s->packages ?? [],
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

        // The user's agent access keys — the credential an AI agent presents to
        // register/verify projects on their behalf via the showcase MCP tools.
        $agentKeys = $request->user()->agentKeys()
            ->orderByDesc('id')
            ->get()
            ->map(fn ($key) => [
                'id' => $key->id,
                'name' => $key->name,
                'created_at' => $key->created_at?->toIso8601String(),
                'last_used_at' => $key->last_used_at?->toIso8601String(),
                'revoked' => $key->isRevoked(),
            ])
            ->all();

        return Inertia::render('Showcase/Mine', [
            'submissions' => $submissions,
            'agentKeys' => $agentKeys,
        ]);
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
     * Owner-initiated delete: remove the submission from the Showcase + the
     * owner's list. Owner-only.
     */
    public function destroy(ShowcaseSubmission $submission): RedirectResponse
    {
        $this->authorizeOwner($submission);

        $label = $submission->title ?: $submission->url;
        $submission->delete();

        return redirect()
            ->route('showcase.showcase.mine')
            ->with('submitted', "Removed “{$label}” from your submissions.");
    }

    /**
     * The copy-paste pixel snippet — shared with the showcase MCP tools via
     * SubmissionSnippets so both surfaces hand out byte-identical embeds.
     */
    private function snippetFor(ShowcaseSubmission $submission): string
    {
        return app(SubmissionSnippets::class)->pixelSnippet($submission);
    }

    /**
     * The copy-paste Fancified badge markdown — the repo equivalent of the
     * pixel snippet. Shared with the showcase MCP tools via SubmissionSnippets.
     */
    private function badgeMarkdownFor(ShowcaseSubmission $submission): string
    {
        return app(SubmissionSnippets::class)->badgeMarkdown($submission);
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
            'packages' => $submission->packages ?? [],
            'registered_via' => $submission->registered_via,
            'agent_name' => $submission->agent_name,
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

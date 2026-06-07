<?php

namespace App\Jobs;

use App\Models\ShowcaseSubmission;
use App\Services\Showcase\FancyPixelDetector;
use App\Services\Showcase\RepoVerifier;
use App\Services\Showcase\SafeUrlFetcher;
use App\Services\Showcase\UnsafeUrlException;
use App\Services\ShowcaseRewards;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

class ScanShowcaseSubmission implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function __construct(public ShowcaseSubmission $submission) {}

    public function handle(): void
    {
        $result = match ($this->submission->kind) {
            'repo' => app(RepoVerifier::class)->verify($this->submission),
            'website' => $this->scanWebsite($this->submission->url),
            default => ['verified' => false, 'reason' => 'unknown kind'],
        };

        $this->submission->update([
            'status' => $result['verified'] ? 'verified' : 'rejected',
            'scan_result' => $result,
            'scanned_at' => now(),
        ]);

        $rewards = app(ShowcaseRewards::class);

        // Auto-verified submissions earn projects-xp for the submitter
        // (idempotent — see ShowcaseRewards).
        if ($result['verified']) {
            $rewards->onVerified($this->submission);
        }

        // A detected "Powered by Fancy" badge earns promotion-xp,
        // independent of verification status.
        if (! empty($result['badge'])) {
            $rewards->onBadgeDetected($this->submission);
        }

        // Capture a screenshot of verified websites for the focus-heatmap
        // background (queued, best-effort). Repos have no page to shoot.
        if (! empty($result['verified']) && $this->submission->kind === 'website') {
            CaptureSiteScreenshot::dispatch(
                $this->submission->url,
                (string) $this->submission->site_key,
                parse_url($this->submission->url, PHP_URL_PATH) ?: '/',
            );
        }
    }

    /** @return array<string, mixed> */
    private function scanWebsite(string $url): array
    {
        try {
            $resp = app(SafeUrlFetcher::class)->fetch($url);
        } catch (UnsafeUrlException $e) {
            return ['verified' => false, 'reason' => 'unsafe URL: '.$e->getMessage()];
        } catch (\Throwable $e) {
            return ['verified' => false, 'reason' => 'fetch failed: '.$e->getMessage()];
        }

        if (! $resp->successful()) {
            return ['verified' => false, 'reason' => 'HTTP '.$resp->status()];
        }

        $html = (string) $resp->body();
        $hits = [];

        // Look for `@particle-academy/<pkg>` strings (in script tags, bundled chunks, source maps, JSON-LD).
        if (preg_match_all('/@particle-academy\/([a-z0-9-]+)/i', $html, $m)) {
            foreach (array_unique($m[1]) as $pkg) {
                $hits['@particle-academy/'.$pkg] = 'inline reference';
            }
        }
        if (preg_match_all('/particle-academy\/([a-z0-9-]+)/i', $html, $m)) {
            foreach (array_unique($m[1]) as $pkg) {
                $hits['particle-academy/'.$pkg] = $hits['particle-academy/'.$pkg] ?? 'inline reference';
            }
        }
        // Crude check for compiled react-fancy data-attributes.
        if (str_contains($html, 'data-react-fancy-')) {
            $hits['react-fancy data-attributes'] = 'rendered DOM';
        }

        // "Powered by Fancy" badge — the promotion signal. Detected
        // independently of package usage so it can earn promotion-xp even
        // on an SSR'd site whose HTML doesn't expose our package strings.
        $badge = $this->detectBadge($html);

        if (empty($hits)) {
            return ['verified' => false, 'reason' => 'no Fancy UI references in homepage HTML', 'badge' => $badge];
        }

        return [
            'verified' => true,
            'kind' => 'website',
            'matches' => $hits,
            'badge' => $badge,
        ];
    }

    /**
     * Detect a Fancy UI pixel in the page HTML. Delegates to the shared
     * FancyPixelDetector so this stays byte-identical to fancy-heuristics
     * HeuristicsPixelDetector::detect() and to the submission gate.
     *
     * The badge marker is JS-injected at runtime by the `fancy-pixel`
     * loader, so a server-side fetch sees the loader <script> tag — not the
     * rendered `data-fancy-badge` marker. The detector therefore also
     * matches the loader script signature. See FancyPixelDetector.
     */
    private function detectBadge(string $html): bool
    {
        return app(FancyPixelDetector::class)->detect($html);
    }
}

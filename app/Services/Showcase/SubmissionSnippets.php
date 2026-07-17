<?php

namespace App\Services\Showcase;

use App\Models\ShowcaseSubmission;

/**
 * The copy-paste install artifacts a submission needs to pass verification —
 * the pixel <script> for websites, the Fancified badge markdown for repos.
 * Shared by the web install page and the showcase MCP tools so both surfaces
 * hand out byte-identical snippets.
 */
class SubmissionSnippets
{
    /** The pixel embed for a website submission (its real site_key + style/mode). */
    public function pixelSnippet(ShowcaseSubmission $submission): string
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

    /** The README markdown for the Fancified badge, keyed to this submission. */
    public function badgeMarkdown(ShowcaseSubmission $submission): string
    {
        $host = rtrim((string) config('app.url'), '/');
        $badgeUrl = $host.'/badge/fancified.svg?site='.$submission->site_key;

        return sprintf('[![Fancified](%s)](https://particle.academy)', $badgeUrl);
    }
}

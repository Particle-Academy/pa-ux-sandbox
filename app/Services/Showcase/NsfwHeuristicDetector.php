<?php

namespace App\Services\Showcase;

/**
 * Zero-dependency NSFW pre-screen for the hybrid moderation flow. It does NOT
 * decide — it FLAGS an *undeclared* submission for an admin to confirm or clear,
 * so false positives are cheap (a review) rather than a wrongful suspension.
 *
 * Pluggable by design: an image-based classifier (e.g. over the captured
 * screenshot) can augment or replace this later without touching the scan job
 * or the admin review flow — they only consume `inspect()`'s verdict.
 */
class NsfwHeuristicDetector
{
    /** High-signal explicit terms; we require ≥2 co-occurring to flag on keywords alone. */
    private const TERMS = [
        'porn', 'xxx', 'hardcore', 'camgirl', 'escort', 'onlyfans',
        'nudes', 'sex cam', 'adult video', 'live sex', 'fetish',
    ];

    /**
     * Inspect page HTML for adult-content signals.
     *
     * @return array{flagged: bool, reason: ?string}
     */
    public function inspect(string $html): array
    {
        $lower = strtolower($html);

        // 1. RTA / content-rating self-labels — very low false positive; adult
        //    sites voluntarily self-tag these.
        if (str_contains($lower, 'rta-5042-1996-1400-1577-rta')) {
            return ['flagged' => true, 'reason' => 'RTA adult-content meta label present'];
        }
        if (preg_match('/<meta[^>]+name=["\']?rating["\']?[^>]+content=["\']?\s*(adult|mature|rta)/i', $html)) {
            return ['flagged' => true, 'reason' => 'meta rating = adult/mature'];
        }

        // 2. Explicit-keyword density — a single stray word in a blog post
        //    shouldn't trip it, so require ≥2 distinct strong terms.
        $hits = array_values(array_filter(self::TERMS, static fn (string $t): bool => str_contains($lower, $t)));
        if (count($hits) >= 2) {
            return ['flagged' => true, 'reason' => 'explicit terms: '.implode(', ', array_slice($hits, 0, 4))];
        }

        // 3. Age-gate phrasing paired with at least one explicit term.
        if ($hits !== [] && preg_match('/\b(18\+|are you (over )?18|enter only if you are 18|adults? only)\b/i', $html)) {
            return ['flagged' => true, 'reason' => 'age-gate + explicit term ('.$hits[0].')'];
        }

        return ['flagged' => false, 'reason' => null];
    }
}

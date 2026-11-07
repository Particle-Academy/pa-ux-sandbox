<?php

namespace App\Services\Showcase;

use App\Models\ShowcaseSubmission;
use App\Models\User;

/**
 * Ownership proof for a showcase submission: has the SUBMITTER shown they
 * control this project?
 *
 * Deliberately separate from verification. Verification (FancyPixelDetector,
 * the website package-string scan, RepoVerifier::detectBadge) is loose on
 * purpose: it decides the public listing, and any Fancy string on a homepage
 * or a keyless badge in a README is enough to list a project. None of that is
 * bound to the person who submitted it, so anybody can be "verified" for a
 * public Fancy site they do not own. Ownership binds to this submission:
 *
 *  - `pixel_key`    the homepage carries a `<script>` tag with
 *                   `data-site="<this submission's site_key>"`, the attribute
 *                   SubmissionSnippets::pixelSnippet() emits;
 *  - `badge_key`    the README carries `/badge/fancified.svg?site=<this
 *                   submission's site_key>`, the URL
 *                   SubmissionSnippets::badgeMarkdown() emits;
 *  - `github_owner` the submitter signed in with GitHub (github_id set) and
 *                   their login owns the repo URL's namespace.
 *
 * The key need not be secret for this to hold. A claimant who submits someone
 * else's URL is issued a NEW key, and cannot place it on a page they do not
 * control; the real owner's key on that page belongs to the real owner's row.
 */
class ShowcaseOwnership
{
    public const PIXEL_KEY = 'pixel_key';

    public const BADGE_KEY = 'badge_key';

    public const GITHUB_OWNER = 'github_owner';

    public const METHODS = [self::PIXEL_KEY, self::BADGE_KEY, self::GITHUB_OWNER];

    /**
     * Websites prove ownership with the pixel only. The badge image is not
     * accepted on a homepage: an `<img>` is something a site's own users can
     * often place (comments, profiles, markdown), and a `<script>` is not.
     */
    public function forWebsite(ShowcaseSubmission $submission, string $html): ?string
    {
        return $this->pixelKeyPresent($html, (string) $submission->site_key) ? self::PIXEL_KEY : null;
    }

    /**
     * Repos prove ownership with the keyed badge, else the GitHub namespace.
     * The README may be null (unfetchable); the namespace check needs no fetch.
     */
    public function forRepo(ShowcaseSubmission $submission, ?string $readme): ?string
    {
        if ($readme !== null && $this->badgeKeyPresent($readme, (string) $submission->site_key)) {
            return self::BADGE_KEY;
        }

        return $this->githubOwnerMatches($submission) ? self::GITHUB_OWNER : null;
    }

    /** A `<script ...>` opening tag whose `data-site` is exactly this key. */
    public function pixelKeyPresent(string $html, string $siteKey): bool
    {
        if ($siteKey === '') {
            return false;
        }

        $key = preg_quote($siteKey, '/');

        return preg_match('/<script\b[^>]*\sdata-site\s*=\s*(["\'])'.$key.'\1[^>]*>/i', $html) === 1;
    }

    /** The Fancified badge URL carrying exactly this key (not a prefix of a longer one). */
    public function badgeKeyPresent(string $readme, string $siteKey): bool
    {
        if ($siteKey === '') {
            return false;
        }

        $key = preg_quote($siteKey, '/');

        return preg_match('/\/badge\/fancified\.svg\?(?:[^\s)"\'#]*&)?site='.$key.'(?![A-Za-z0-9])/', $readme) === 1;
    }

    /**
     * The submitter's GitHub login owns the repo namespace. `github_id` must be
     * set: it proves the username came from GitHub sign-in (GitHubLoginController),
     * the only writer of both columns.
     */
    public function githubOwnerMatches(ShowcaseSubmission $submission): bool
    {
        $user = $submission->user;
        if (! $user instanceof User || blank($user->github_id) || blank($user->github_username)) {
            return false;
        }

        if (! preg_match('!^https?://(?:www\.)?github\.com/([\w.-]+)/[\w.-]+?(?:\.git)?/?$!i', (string) $submission->url, $m)) {
            return false;
        }

        return strcasecmp($m[1], (string) $user->github_username) === 0;
    }

    /**
     * Write the latest scan's verdict. A proof that keeps holding keeps its
     * first-seen time; a changed method restarts it; no proof clears both.
     */
    public function record(ShowcaseSubmission $submission, ?string $method): void
    {
        if ($method !== null && ! in_array($method, self::METHODS, true)) {
            throw new \InvalidArgumentException("Unknown ownership method [{$method}].");
        }

        if ($method === null) {
            $attributes = ['ownership_verified_at' => null, 'ownership_method' => null];
        } elseif ($submission->ownership_method === $method && $submission->ownership_verified_at !== null) {
            return;
        } else {
            $attributes = ['ownership_verified_at' => now(), 'ownership_method' => $method];
        }

        $submission->forceFill($attributes)->save();
    }
}

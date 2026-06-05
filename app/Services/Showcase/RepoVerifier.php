<?php

namespace App\Services\Showcase;

use App\Models\ShowcaseSubmission;
use App\Models\User;
use Illuminate\Http\Client\PendingRequest;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/**
 * The repo equivalent of FancyPixelDetector. A repo is verified only when BOTH:
 *
 *   1. its README carries the generated Fancified badge (the app's
 *      `/badge/fancified.svg` URL — and, when present, the submission's
 *      site_key), AND
 *   2. a codebase scan shows >= 30% of its view/component source files
 *      reference a Fancy package (`@particle-academy/` or `particle-academy/`).
 *
 * Like the website flow, this NEVER blocks registration — it only gates the
 * public LISTING. A repo that misses either bar stays pending with a reason
 * recorded in scan_result.
 *
 * GitHub access: uses the user's stored token when available, else the app's
 * configured token, else unauthenticated public API (rate-limited). 404 /
 * rate-limit / network errors degrade to "not verified, with a reason".
 */
class RepoVerifier
{
    /** Pass when >= this fraction of component files reference Fancy. */
    public const USAGE_THRESHOLD = 0.30;

    /** Hard cap on component-file content fetches per scan (logged if truncated). */
    public const MAX_COMPONENT_FILES = 200;

    /** Extensions that count as "view/component" source. */
    private const COMPONENT_EXTENSIONS = ['tsx', 'jsx', 'vue', 'svelte', 'blade.php'];

    /**
     * Verify a repo submission. Returns the scan_result payload shape:
     *   ['verified' => bool, 'badge' => bool, 'usage_ratio' => float,
     *    'files_scanned' => int, 'fancy_files' => int, 'passed' => bool,
     *    'reason' => ?string, ...]
     *
     * @return array<string, mixed>
     */
    public function verify(ShowcaseSubmission $submission): array
    {
        $parsed = $this->parseOwnerRepo($submission->url);
        if ($parsed === null) {
            return $this->fail('unrecognized GitHub URL', ['badge' => false]);
        }
        [$owner, $repo] = $parsed;

        $token = $this->tokenFor($submission);

        // ── 1. README → badge detection ──────────────────────────────────
        $readme = $this->fetchReadme($owner, $repo, $token);
        if ($readme === null) {
            return $this->fail('could not fetch README (private, missing, or rate-limited)', [
                'badge' => false,
                'owner' => $owner,
                'repo' => $repo,
            ]);
        }
        $badge = $this->detectBadge($readme, $submission->site_key);

        // ── 2. Codebase scan → Fancy usage ratio ─────────────────────────
        $tree = $this->fetchTree($owner, $repo, $token);
        if ($tree === null) {
            return $this->fail('could not fetch repository tree (private, missing, or rate-limited)', [
                'badge' => $badge,
                'owner' => $owner,
                'repo' => $repo,
            ]);
        }

        $componentPaths = $this->selectComponentFiles($tree);
        $componentCount = count($componentPaths);

        if ($componentCount === 0) {
            return $this->fail('no view/component source files found', [
                'badge' => $badge,
                'usage_ratio' => 0.0,
                'files_scanned' => 0,
                'fancy_files' => 0,
                'passed' => false,
                'owner' => $owner,
                'repo' => $repo,
            ]);
        }

        $truncated = false;
        if ($componentCount > self::MAX_COMPONENT_FILES) {
            $truncated = true;
            Log::info('RepoVerifier truncated component scan', [
                'owner' => $owner,
                'repo' => $repo,
                'component_files' => $componentCount,
                'cap' => self::MAX_COMPONENT_FILES,
            ]);
            $componentPaths = array_slice($componentPaths, 0, self::MAX_COMPONENT_FILES);
        }

        $scanned = count($componentPaths);
        $fancyFiles = 0;
        foreach ($componentPaths as $path) {
            $contents = $this->fetchRawFile($owner, $repo, $tree['branch'], $path, $token);
            if ($contents !== null && $this->usesFancy($contents)) {
                $fancyFiles++;
            }
        }

        $ratio = $scanned > 0 ? $fancyFiles / $scanned : 0.0;
        $passed = $badge && $ratio >= self::USAGE_THRESHOLD;

        $result = [
            'kind' => 'repo',
            'owner' => $owner,
            'repo' => $repo,
            'badge' => $badge,
            'usage_ratio' => round($ratio, 4),
            'files_scanned' => $scanned,
            'fancy_files' => $fancyFiles,
            'component_files_total' => $componentCount,
            'truncated' => $truncated,
            'passed' => $passed,
            'verified' => $passed,
        ];

        if (! $passed) {
            $result['reason'] = ! $badge
                ? 'Fancified badge not found in README'
                : sprintf('Fancy usage %.0f%% is below the %.0f%% threshold', $ratio * 100, self::USAGE_THRESHOLD * 100);
        }

        return $result;
    }

    /**
     * @return array{0: string, 1: string}|null
     */
    public function parseOwnerRepo(string $url): ?array
    {
        if (preg_match('!github\.com[/:]([\w.-]+)/([\w.-]+?)(?:\.git)?/?$!i', $url, $m)) {
            return [$m[1], $m[2]];
        }

        return null;
    }

    /**
     * The README contains the badge when it references the app's
     * `/badge/fancified.svg` URL. When the submission has a site_key, we also
     * accept a badge that carries that exact key (so we can attribute it to
     * THIS submission). A keyless badge URL still counts as the Fancified mark.
     */
    public function detectBadge(string $readme, ?string $siteKey): bool
    {
        if (! str_contains($readme, '/badge/fancified.svg')) {
            return false;
        }

        // If this badge carries a site key, it must match ours. A badge with
        // no `?site=` is a generic Fancified mark and still counts.
        if (preg_match('!/badge/fancified\.svg\?site=([a-z0-9]+)!i', $readme, $m)) {
            if ($siteKey && strcasecmp($m[1], $siteKey) !== 0) {
                // The README references a Fancified badge for a DIFFERENT site;
                // still accept the bare-mark presence only if a keyless badge
                // URL also appears.
                return (bool) preg_match('!/badge/fancified\.svg(?![?\w])!i', $readme);
            }
        }

        return true;
    }

    private function usesFancy(string $contents): bool
    {
        return str_contains($contents, '@particle-academy/')
            || str_contains($contents, 'particle-academy/');
    }

    /**
     * @param  array{branch: string, paths: list<string>}  $tree
     * @return list<string>
     */
    private function selectComponentFiles(array $tree): array
    {
        $selected = [];
        foreach ($tree['paths'] as $path) {
            $lower = strtolower($path);
            foreach (self::COMPONENT_EXTENSIONS as $ext) {
                if (str_ends_with($lower, '.'.$ext)) {
                    $selected[] = $path;
                    break;
                }
            }
        }

        return $selected;
    }

    // ── GitHub fetch helpers ─────────────────────────────────────────────

    private function fetchReadme(string $owner, string $repo, ?string $token): ?string
    {
        $resp = $this->github($token)
            ->withHeaders(['Accept' => 'application/vnd.github+json'])
            ->get("https://api.github.com/repos/{$owner}/{$repo}/readme");

        if ($resp->successful()) {
            $content = $resp->json('content');
            if (is_string($content) && $content !== '') {
                $decoded = base64_decode(str_replace("\n", '', $content), true);
                if ($decoded !== false) {
                    return $decoded;
                }
            }
        }

        // Fallback: raw.githubusercontent for common README casings/branches.
        foreach (['main', 'master'] as $branch) {
            foreach (['README.md', 'readme.md', 'README.markdown'] as $name) {
                $raw = $this->github($token)
                    ->get("https://raw.githubusercontent.com/{$owner}/{$repo}/{$branch}/{$name}");
                if ($raw->successful() && trim((string) $raw->body()) !== '') {
                    return (string) $raw->body();
                }
            }
        }

        return null;
    }

    /**
     * Fetch the recursive git tree on the default branch.
     *
     * @return array{branch: string, paths: list<string>}|null
     */
    private function fetchTree(string $owner, string $repo, ?string $token): ?array
    {
        $branch = $this->defaultBranch($owner, $repo, $token);
        if ($branch === null) {
            return null;
        }

        $resp = $this->github($token)
            ->withHeaders(['Accept' => 'application/vnd.github+json'])
            ->get("https://api.github.com/repos/{$owner}/{$repo}/git/trees/{$branch}", [
                'recursive' => '1',
            ]);

        if (! $resp->successful()) {
            return null;
        }

        $paths = [];
        foreach ((array) $resp->json('tree', []) as $node) {
            if (($node['type'] ?? null) === 'blob' && ! empty($node['path'])) {
                $paths[] = (string) $node['path'];
            }
        }

        return ['branch' => $branch, 'paths' => $paths];
    }

    private function defaultBranch(string $owner, string $repo, ?string $token): ?string
    {
        $resp = $this->github($token)
            ->withHeaders(['Accept' => 'application/vnd.github+json'])
            ->get("https://api.github.com/repos/{$owner}/{$repo}");

        if ($resp->successful()) {
            $branch = $resp->json('default_branch');
            if (is_string($branch) && $branch !== '') {
                return $branch;
            }
        }

        return null;
    }

    private function fetchRawFile(string $owner, string $repo, string $branch, string $path, ?string $token): ?string
    {
        $encodedPath = implode('/', array_map('rawurlencode', explode('/', $path)));
        $resp = $this->github($token)
            ->get("https://raw.githubusercontent.com/{$owner}/{$repo}/{$branch}/{$encodedPath}");

        if ($resp->successful()) {
            return (string) $resp->body();
        }

        return null;
    }

    private function github(?string $token): PendingRequest
    {
        $req = Http::withHeaders([
            'User-Agent' => 'FancyUI-ShowcaseVerifier/1.0',
            'X-GitHub-Api-Version' => '2022-11-28',
        ])->timeout(15);

        return $token ? $req->withToken($token) : $req;
    }

    /**
     * Prefer the submitter's stored GitHub token (if the app stores one on the
     * User), then the app-wide configured token, then unauthenticated.
     */
    private function tokenFor(ShowcaseSubmission $submission): ?string
    {
        $user = $submission->user;
        if ($user instanceof User) {
            $userToken = $user->getAttribute('github_token');
            if (is_string($userToken) && $userToken !== '') {
                return $userToken;
            }
        }

        $configToken = config('services.github.api_token');

        return is_string($configToken) && $configToken !== '' ? $configToken : null;
    }

    /**
     * @param  array<string, mixed>  $extra
     * @return array<string, mixed>
     */
    private function fail(string $reason, array $extra = []): array
    {
        return array_merge([
            'kind' => 'repo',
            'verified' => false,
            'passed' => false,
            'reason' => $reason,
        ], $extra);
    }
}

<?php

namespace App\Http\Controllers\Webhooks;

use App\Http\Controllers\Controller;
use App\Models\GithubRepoStat;
use App\Models\User;
use App\Support\XpAwarder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use LaravelFunLab\Facades\LFL;

/**
 * Receives GitHub webhook events for the whole package ecosystem and turns
 * real engagement into XP for the linked contributor (matched by
 * github_username). Handles:
 *
 *   - `star`         → promotion-xp (created) + a live nudge to the repo's
 *                      cached star count shown on /packages.
 *   - `pull_request` → contributor-xp when a PR is merged (credited to author).
 *   - `issues`       → contributor-xp (opened) + bug-hunter-xp (confirmed bug).
 *
 * XP only lands for contributors who've linked GitHub; everyone else's stars /
 * PRs / issues are still counted for the ecosystem leaderboard by the periodic
 * `showcase:refresh-leaderboard` sweep (no account required there).
 *
 * Setup (GitHub-side): add an org webhook → payload URL `/webhooks/github`,
 * content-type application/json, secret = GITHUB_WEBHOOK_SECRET, events =
 * Stars, Pull requests, Issues. Without the secret the endpoint rejects
 * everything (can't verify authenticity).
 */
class GitHubWebhookController extends Controller
{
    private const PR_XP = 50;

    private const ISSUE_XP = 10;

    private const STAR_XP = 5;

    private const BUG_XP = 50;

    /** ~1 year → effectively "once per {star,pr,issue}". */
    private const ONCE = 31_536_000;

    public function __invoke(Request $request): JsonResponse
    {
        $secret = (string) config('services.github.webhook_secret', '');
        if ($secret === '') {
            return response()->json(['error' => 'webhook not configured'], 503);
        }

        // Verify HMAC-SHA256 over the raw body (X-Hub-Signature-256).
        $signature = (string) $request->header('X-Hub-Signature-256', '');
        $expected = 'sha256='.hash_hmac('sha256', $request->getContent(), $secret);
        if (! hash_equals($expected, $signature)) {
            return response()->json(['error' => 'invalid signature'], 403);
        }

        $payload = $request->json()->all();

        // Scope to the configured org for every event.
        $org = strtolower((string) config('services.github.org', ''));
        $repo = strtolower((string) ($payload['repository']['full_name'] ?? ''));
        if ($org === '' || ! str_starts_with($repo, $org.'/')) {
            return response()->json(['ignored' => 'org'], 200);
        }

        return match ($request->header('X-GitHub-Event')) {
            'star' => $this->handleStar($payload, $repo),
            'pull_request' => $this->handlePullRequest($payload, $repo),
            'issues' => $this->handleIssue($payload, $repo),
            default => response()->json(['ignored' => 'event'], 200),
        };
    }

    /**
     * A star (un)cast — award promotion-xp to a linked user on `created`, and
     * nudge the repo's cached star count either way so /packages tracks live.
     *
     * @param  array<string, mixed>  $payload
     */
    private function handleStar(array $payload, string $repo): JsonResponse
    {
        $action = $payload['action'] ?? null; // created | deleted
        $login = $payload['sender']['login'] ?? null;

        if ($action === 'created') {
            $this->nudgeStars($repo, +1);
            $awarded = $this->awardTo($login, 'promotion-xp', self::STAR_XP, "starred {$repo}", "gh-star:{$login}:{$repo}");

            return response()->json(['awarded' => $awarded], 200);
        }

        if ($action === 'deleted') {
            $this->nudgeStars($repo, -1);
        }

        return response()->json(['ok' => true], 200);
    }

    /**
     * A merged pull request — contributor-xp to the PR author.
     *
     * @param  array<string, mixed>  $payload
     */
    private function handlePullRequest(array $payload, string $repo): JsonResponse
    {
        $pr = $payload['pull_request'] ?? [];
        if (($payload['action'] ?? null) !== 'closed' || empty($pr['merged'])) {
            return response()->json(['ignored' => 'not merged'], 200);
        }

        $login = $pr['user']['login'] ?? null;
        $ref = $repo.'#'.($pr['number'] ?? '0');
        $awarded = $this->awardTo($login, 'contributor-xp', self::PR_XP, "merged PR {$ref}", "gh-pr:{$ref}");

        return response()->json(['awarded' => $awarded], 200);
    }

    /**
     * An issue — contributor-xp on open, plus bug-hunter-xp when it carries a
     * confirming bug label.
     *
     * @param  array<string, mixed>  $payload
     */
    private function handleIssue(array $payload, string $repo): JsonResponse
    {
        $action = $payload['action'] ?? null;
        if (! in_array($action, ['opened', 'labeled'], true)) {
            return response()->json(['ignored' => 'action'], 200);
        }

        $issue = $payload['issue'] ?? [];
        $login = $issue['user']['login'] ?? null;
        $ref = $repo.'#'.($issue['number'] ?? '0');
        $out = [];

        // Any opened issue is a contribution.
        if ($action === 'opened') {
            $out['contributor'] = $this->awardTo($login, 'contributor-xp', self::ISSUE_XP, "opened issue {$ref}", "gh-issue-open:{$ref}");
        }

        // A confirming bug label unlocks bug-hunter-xp + the first-bug achievement.
        $bugLabels = array_map('strtolower', (array) config('services.github.bug_labels', []));
        $issueLabels = array_map(
            fn ($l) => strtolower((string) ($l['name'] ?? '')),
            (array) ($issue['labels'] ?? []),
        );
        if (! empty(array_intersect($bugLabels, $issueLabels))) {
            $user = $login ? User::where('github_username', $login)->first() : null;
            $out['bug'] = XpAwarder::award(
                user: $user,
                metric: 'bug-hunter-xp',
                amount: self::BUG_XP,
                reason: "confirmed bug {$ref}",
                throttleKey: "gh-issue:{$ref}",
                throttleSeconds: self::ONCE,
            );
            if ($out['bug'] && $user && ! $user->hasAchievement('first-bug')) {
                LFL::grant('first-bug')->to($user)->because('first confirmed bug')->save();
            }
        }

        return response()->json($out ?: ['ok' => true], 200);
    }

    /**
     * Award XP to the linked user for a GitHub login, once per throttle key.
     * No-op (returns false) when the login isn't linked to an account — the
     * periodic ecosystem sweep still credits them on the leaderboard.
     */
    private function awardTo(?string $login, string $metric, int $amount, string $reason, string $throttleKey): bool
    {
        $user = $login ? User::where('github_username', $login)->first() : null;
        if ($user === null) {
            return false;
        }

        return XpAwarder::award(
            user: $user,
            metric: $metric,
            amount: $amount,
            reason: $reason,
            throttleKey: $throttleKey,
            throttleSeconds: self::ONCE,
        );
    }

    /** Nudge a repo's cached star count (only if a synced baseline exists). */
    private function nudgeStars(string $repo, int $delta): void
    {
        $stat = GithubRepoStat::query()->whereRaw('LOWER(repo) = ?', [$repo])->first();
        if ($stat !== null) {
            $stat->stars = max(0, $stat->stars + $delta);
            $stat->save();
        }
    }
}

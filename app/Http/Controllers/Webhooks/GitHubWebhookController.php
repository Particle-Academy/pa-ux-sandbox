<?php

namespace App\Http\Controllers\Webhooks;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Support\XpAwarder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use LaravelFunLab\Facades\LFL;

/**
 * Receives GitHub `issues` webhook events and awards bug-hunter-xp to the
 * issue author (matched by linked github_username) when a bug is confirmed
 * on a particle-academy repo.
 *
 * Setup (GitHub-side, required for this to fire): add an org/repo webhook
 * → payload URL `/webhooks/github`, content-type application/json, secret =
 * GITHUB_WEBHOOK_SECRET, events = Issues. Without the secret configured the
 * endpoint rejects everything (can't verify authenticity).
 *
 * "Confirmed" = an `issues` event whose action is `labeled` (or `opened`)
 * and whose labels include one of services.github.bug_labels. Idempotent
 * per issue via XpAwarder's throttle (one award per issue, ~1y window).
 */
class GitHubWebhookController extends Controller
{
    private const BUG_XP = 50;

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

        if ($request->header('X-GitHub-Event') !== 'issues') {
            return response()->json(['ignored' => 'event'], 200);
        }

        $payload = $request->json()->all();
        $action = $payload['action'] ?? null;
        if (! in_array($action, ['opened', 'labeled'], true)) {
            return response()->json(['ignored' => 'action'], 200);
        }

        // Scope to the configured org.
        $org = strtolower((string) config('services.github.org', ''));
        $repoFullName = strtolower((string) ($payload['repository']['full_name'] ?? ''));
        if ($org === '' || ! str_starts_with($repoFullName, $org.'/')) {
            return response()->json(['ignored' => 'org'], 200);
        }

        // Require a confirming label.
        $bugLabels = array_map('strtolower', (array) config('services.github.bug_labels', []));
        $issueLabels = array_map(
            fn ($l) => strtolower((string) ($l['name'] ?? '')),
            (array) ($payload['issue']['labels'] ?? []),
        );
        if (empty(array_intersect($bugLabels, $issueLabels))) {
            return response()->json(['ignored' => 'no bug label'], 200);
        }

        // Map the issue author to a linked user.
        $login = $payload['issue']['user']['login'] ?? null;
        $user = $login ? User::where('github_username', $login)->first() : null;
        if ($user === null) {
            return response()->json(['ignored' => 'no linked user'], 200);
        }

        $issueRef = $repoFullName.'#'.($payload['issue']['number'] ?? '0');
        $awarded = XpAwarder::award(
            user: $user,
            metric: 'bug-hunter-xp',
            amount: self::BUG_XP,
            reason: "confirmed bug {$issueRef}",
            throttleKey: "gh-issue:{$issueRef}",
            throttleSeconds: 31_536_000, // ~1 year → effectively once per issue
        );

        if ($awarded && ! $user->hasAchievement('first-bug')) {
            LFL::grant('first-bug')->to($user)->because('first confirmed bug')->save();
        }

        return response()->json(['awarded' => $awarded], 200);
    }
}

<?php

namespace App\Console\Commands;

use App\Models\GithubRepoStat;
use App\Models\LeaderboardSnapshot;
use App\Models\Vote;
use App\Support\PackageRegistry;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Http;

/**
 * Aggregate ecosystem engagement — merged PRs, stars, and opened issues across
 * EVERY package repo, plus on-site votes — into a leaderboard snapshot. Keyed by
 * GitHub username, so contributors are credited whether or not they have a site
 * account (they claim their score by logging in with GitHub). Also persists each
 * repo's absolute star count for the /packages tiles.
 */
class RefreshLeaderboard extends Command
{
    protected $signature = 'showcase:refresh-leaderboard
                            {--scope=all_time : all_time or last_30_days}
                            {--force : write the snapshot even if a whole section collected nothing}';

    protected $description = 'Aggregate merged PRs + stars + issues across all package repos (+ votes) into a leaderboard snapshot.';

    // Score weights: a merged PR outweighs an issue outweighs a star; on-site
    // votes stay a light signal. Tune here.
    private const W_PR = 5;

    private const W_ISSUE = 2;

    private const W_STAR = 1;

    private const W_VOTE = 1;

    /** Hard page cap per repo per endpoint — bounds API cost on large repos. */
    private const MAX_PAGES = 10;

    public function handle(): int
    {
        $scope = $this->option('scope');
        if (! in_array($scope, ['all_time', 'last_30_days'], true)) {
            $this->error('--scope must be all_time or last_30_days');

            return self::INVALID;
        }

        $token = config('services.github.api_token');
        if (! $token) {
            $this->warn('GITHUB_API_TOKEN is not set — falling back to votes-only snapshot.');
        }

        $repos = $this->repos();
        $cutoff = $scope === 'last_30_days' ? now()->subDays(30)->toIso8601String() : null;

        $prs = $token ? $this->collectPrCounts($token, $repos, $cutoff) : [];
        [$repoStars, $stars] = $token ? $this->collectStars($token, $repos, $cutoff) : [[], []];
        $issues = $token ? $this->collectIssueCounts($token, $repos, $cutoff) : [];
        $votes = $this->collectVoteCounts();

        // Persist absolute per-repo star counts for the packages page (all_time
        // only — the count is a live total, not a windowed figure).
        if ($token && $scope === 'all_time') {
            $this->persistRepoStars($repoStars);
        }

        $usernames = array_unique(array_merge(
            array_keys($prs), array_keys($stars), array_keys($issues), array_keys($votes),
        ));

        $rows = [];
        foreach ($usernames as $name) {
            $p = $prs[$name] ?? 0;
            $s = $stars[$name] ?? 0;
            $i = $issues[$name] ?? 0;
            $v = $votes[$name] ?? 0;
            $rows[] = [
                'github_username' => $name,
                'merged_prs' => $p,
                'stars' => $s,
                'issues_opened' => $i,
                'votes_cast' => $v,
                'score' => $p * self::W_PR + $i * self::W_ISSUE + $s * self::W_STAR + $v * self::W_VOTE,
            ];
        }
        usort($rows, fn ($a, $b) => $b['score'] <=> $a['score']);
        $rows = array_slice($rows, 0, 50);

        $this->info(sprintf(
            'Collected across %d repos — PRs: %d, stars: %d, issues: %d, votes: %d.',
            count($repos), array_sum($prs), array_sum($stars), array_sum($issues), array_sum($votes),
        ));

        /**
         * Refuse to replace a good snapshot with a degraded one.
         *
         * Every GitHub section fails SOFTLY — `paginate()` warns and returns, so
         * an expired token, a missing scope, or a rate-limit answers with an
         * empty array that looks exactly like "nobody did that". The command
         * then wrote the thinner snapshot over the good one and exited 0, so a
         * scheduled run reported success while quietly deleting contributors.
         * That is how the board silently fell from 15 rows to 3, with every
         * star-only contributor disappearing.
         *
         * A section that legitimately has no data stays empty run after run, so
         * comparing against the PREVIOUS snapshot distinguishes "genuinely zero"
         * from "collection broke": only a drop from non-zero to zero is an
         * error. `--force` is the escape hatch for a real drop to zero.
         */
        if ($token && ! $this->option('force')) {
            $previous = LeaderboardSnapshot::query()
                ->where('scope', $scope)
                ->latest('generated_at')
                ->value('rows');
            $previous = is_array($previous) ? $previous : [];

            $sections = [
                ['stars', 'stars', array_sum($stars)],
                ['merged PRs', 'merged_prs', array_sum($prs)],
                ['issues', 'issues_opened', array_sum($issues)],
            ];

            foreach ($sections as [$label, $column, $collected]) {
                $before = array_sum(array_column($previous, $column));
                if ($collected === 0 && $before > 0) {
                    $this->error(
                        "Collected 0 {$label} but the previous snapshot had {$before} — refusing to overwrite it. ".
                        'Check GITHUB_API_TOKEN (expiry + scopes) and the GitHub API rate limit, then re-run. '.
                        'Pass --force if the drop to zero is real.'
                    );

                    return self::FAILURE;
                }
            }
        }

        LeaderboardSnapshot::create([
            'scope' => $scope,
            'rows' => $rows,
            'generated_at' => now(),
        ]);

        $this->info('Wrote leaderboard snapshot with '.count($rows).' rows across '.count($repos).' repos.');

        return self::SUCCESS;
    }

    /**
     * Every package repo in the ecosystem (owner/name), from the registry.
     *
     * @return array<int, string>
     */
    private function repos(): array
    {
        $repos = collect(PackageRegistry::all())
            ->merge(PackageRegistry::companions())
            ->pluck('repo')
            ->filter(fn ($r) => is_string($r) && $r !== '')
            ->unique()
            ->values()
            ->all();

        return $repos;
    }

    /**
     * Merged PRs per author across the given repos.
     *
     * @param  array<int, string>  $repos
     * @return array<string, int>
     */
    private function collectPrCounts(string $token, array $repos, ?string $cutoff): array
    {
        $counts = [];
        foreach ($repos as $repo) {
            $this->paginate($token, "https://api.github.com/repos/{$repo}/pulls", [
                'state' => 'closed', 'sort' => 'updated', 'direction' => 'desc',
            ], function (array $items) use (&$counts, $cutoff): bool {
                foreach ($items as $pr) {
                    if (empty($pr['merged_at'])) {
                        continue;
                    }
                    if ($cutoff && $pr['merged_at'] < $cutoff) {
                        return false; // sorted desc → older ones follow; stop this repo
                    }
                    $login = $pr['user']['login'] ?? null;
                    if ($login) {
                        $counts[$login] = ($counts[$login] ?? 0) + 1;
                    }
                }

                return true;
            });
        }

        return $counts;
    }

    /**
     * Per-repo absolute star count + per-user star counts (who starred how many
     * ecosystem repos). Stargazer timestamps come from the star+json media type.
     *
     * @param  array<int, string>  $repos
     * @return array{0: array<string, int>, 1: array<string, int>}
     */
    private function collectStars(string $token, array $repos, ?string $cutoff): array
    {
        $repoStars = [];
        $userStars = [];

        foreach ($repos as $repo) {
            // Absolute count (cheap, one call).
            $meta = Http::withToken($token)->acceptJson()->get("https://api.github.com/repos/{$repo}");
            if ($meta->successful()) {
                $repoStars[$repo] = (int) ($meta->json('stargazers_count') ?? 0);
            } else {
                $this->warn("Skipping {$repo} stars (HTTP {$meta->status()}).");

                continue;
            }

            // Who starred (for the leaderboard) — needs the star+json media type
            // to expose `starred_at` for the time window.
            $this->paginate($token, "https://api.github.com/repos/{$repo}/stargazers", [], function (array $items) use (&$userStars, $cutoff): bool {
                foreach ($items as $entry) {
                    // With star+json each entry is { starred_at, user: {...} }.
                    $starredAt = $entry['starred_at'] ?? null;
                    if ($cutoff && $starredAt && $starredAt < $cutoff) {
                        continue;
                    }
                    $login = $entry['user']['login'] ?? ($entry['login'] ?? null);
                    if ($login) {
                        $userStars[$login] = ($userStars[$login] ?? 0) + 1;
                    }
                }

                return true;
            }, accept: 'application/vnd.github.star+json');
        }

        return [$repoStars, $userStars];
    }

    /**
     * Opened issues per author across the given repos (pull requests excluded —
     * the issues endpoint returns both).
     *
     * @param  array<int, string>  $repos
     * @return array<string, int>
     */
    private function collectIssueCounts(string $token, array $repos, ?string $cutoff): array
    {
        $counts = [];
        foreach ($repos as $repo) {
            $this->paginate($token, "https://api.github.com/repos/{$repo}/issues", [
                'state' => 'all', 'sort' => 'created', 'direction' => 'desc',
            ], function (array $items) use (&$counts, $cutoff): bool {
                foreach ($items as $issue) {
                    if (isset($issue['pull_request'])) {
                        continue; // it's a PR, not an issue
                    }
                    if ($cutoff && ($issue['created_at'] ?? '') < $cutoff) {
                        return false; // sorted desc → stop this repo
                    }
                    $login = $issue['user']['login'] ?? null;
                    if ($login) {
                        $counts[$login] = ($counts[$login] ?? 0) + 1;
                    }
                }

                return true;
            });
        }

        return $counts;
    }

    /**
     * Paginate a GitHub list endpoint, feeding each page to $onPage. $onPage
     * returns false to stop early (e.g. past the time window).
     *
     * @param  array<string, mixed>  $query
     * @param  callable(array<int, mixed>): bool  $onPage
     */
    private function paginate(string $token, string $url, array $query, callable $onPage, ?string $accept = null): void
    {
        $page = 1;
        do {
            $request = Http::withToken($token);
            $request = $accept ? $request->withHeaders(['Accept' => $accept]) : $request->acceptJson();
            $response = $request->get($url, $query + ['per_page' => 100, 'page' => $page]);

            if (! $response->successful()) {
                $this->warn("Skipping {$url} p{$page} (HTTP {$response->status()}).");

                return;
            }
            $items = $response->json();
            if (! is_array($items) || $items === []) {
                return;
            }
            if ($onPage($items) === false) {
                return;
            }
            $page++;
        } while ($page <= self::MAX_PAGES);
    }

    /** Upsert absolute per-repo star counts for the /packages tiles. */
    private function persistRepoStars(array $repoStars): void
    {
        foreach ($repoStars as $repo => $stars) {
            GithubRepoStat::query()->updateOrCreate(
                ['repo' => $repo],
                ['stars' => (int) $stars, 'synced_at' => now()],
            );
        }
    }

    /** @return array<string, int> */
    private function collectVoteCounts(): array
    {
        return Vote::query()
            ->join('users', 'users.id', '=', 'showcase_votes.user_id')
            ->whereNotNull('users.github_username')
            ->selectRaw('users.github_username as gh, COUNT(*) as c')
            ->groupBy('users.github_username')
            ->pluck('c', 'gh')
            ->map(fn ($c) => (int) $c)
            ->all();
    }
}

<?php

namespace App\Console\Commands;

use App\Models\LeaderboardSnapshot;
use App\Models\Vote;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Http;

class RefreshLeaderboard extends Command
{
    protected $signature = 'showcase:refresh-leaderboard
                            {--scope=all_time : all_time or last_30_days}';

    protected $description = 'Aggregate merged-PR counts across Particle-Academy repos + vote counts into a leaderboard snapshot.';

    /** @var array<int, string> */
    private const REPOS = [
        'Particle-Academy/react-fancy',
        'Particle-Academy/fancy-whiteboard',
        'Particle-Academy/fancy-flow',
        'Particle-Academy/fancy-sheets',
        'Particle-Academy/fancy-code',
        'Particle-Academy/react-echarts',
        'Particle-Academy/fancy-screens',
        'Particle-Academy/fancy-3d',
        'Particle-Academy/agent-integrations',
        'Particle-Academy/holy-sheet',
        'Particle-Academy/fancy-inertia',
        'Particle-Academy/pa-ux-sandbox',
    ];

    public function handle(): int
    {
        $scope = $this->option('scope');
        if (!in_array($scope, ['all_time', 'last_30_days'], true)) {
            $this->error('--scope must be all_time or last_30_days');
            return self::INVALID;
        }

        $token = config('services.github.api_token');
        if (!$token) {
            $this->warn('GITHUB_API_TOKEN is not set — falling back to votes-only snapshot.');
        }

        $prsByAuthor = $token ? $this->collectPrCounts($token, $scope) : [];
        $votesByUser = $this->collectVoteCounts();

        $usernames = array_unique(array_merge(array_keys($prsByAuthor), array_keys($votesByUser)));
        $rows = [];
        foreach ($usernames as $name) {
            $prs = $prsByAuthor[$name] ?? 0;
            $votes = $votesByUser[$name] ?? 0;
            $rows[] = [
                'github_username' => $name,
                'merged_prs' => $prs,
                'votes_cast' => $votes,
                'score' => $prs * 3 + $votes,
            ];
        }
        usort($rows, fn ($a, $b) => $b['score'] <=> $a['score']);
        $rows = array_slice($rows, 0, 50);

        LeaderboardSnapshot::create([
            'scope' => $scope,
            'rows' => $rows,
            'generated_at' => now(),
        ]);

        $this->info('Wrote leaderboard snapshot with '.count($rows).' rows.');
        return self::SUCCESS;
    }

    /** @return array<string, int> */
    private function collectPrCounts(string $token, string $scope): array
    {
        $cutoff = $scope === 'last_30_days' ? now()->subDays(30)->toIso8601String() : null;
        $counts = [];

        foreach (self::REPOS as $repo) {
            $page = 1;
            do {
                $response = Http::withToken($token)
                    ->acceptJson()
                    ->get("https://api.github.com/repos/{$repo}/pulls", [
                        'state' => 'closed',
                        'per_page' => 100,
                        'page' => $page,
                        'sort' => 'updated',
                        'direction' => 'desc',
                    ]);
                if (!$response->successful()) {
                    $this->warn("Skipping {$repo} (HTTP {$response->status()}).");
                    break;
                }
                $items = $response->json();
                if (empty($items)) {
                    break;
                }
                $hitCutoff = false;
                foreach ($items as $pr) {
                    if (empty($pr['merged_at'])) {
                        continue;
                    }
                    if ($cutoff && $pr['merged_at'] < $cutoff) {
                        $hitCutoff = true;
                        break;
                    }
                    $login = $pr['user']['login'] ?? null;
                    if ($login) {
                        $counts[$login] = ($counts[$login] ?? 0) + 1;
                    }
                }
                if ($hitCutoff) break;
                $page++;
                if ($page > 5) break;
            } while (true);
        }
        return $counts;
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

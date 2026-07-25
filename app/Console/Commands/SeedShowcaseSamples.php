<?php

namespace App\Console\Commands;

use App\Models\LeaderboardSnapshot;
use App\Models\ShowcaseSubmission;
use App\Models\User;
use Illuminate\Console\Command;

class SeedShowcaseSamples extends Command
{
    protected $signature = 'showcase:seed-samples
                            {--fresh : Delete existing samples first}';

    protected $description = 'Seed sample showcase submissions + a leaderboard snapshot so first-time visitors see real content.';

    public function handle(): int
    {
        if ($this->option('fresh')) {
            ShowcaseSubmission::query()->whereJsonContains('scan_result->seeded', true)->delete();
            LeaderboardSnapshot::query()->whereJsonContains('rows->0->seeded', true)->delete();
        }

        $this->seedSubmissions();
        $this->seedLeaderboard();

        return self::SUCCESS;
    }

    private function seedSubmissions(): void
    {
        // Land a placeholder user to own the sample submissions.
        $user = User::query()->firstOrCreate(
            ['email' => 'samples@particle.academy'],
            [
                'name' => 'Particle Academy',
                'github_username' => 'particle-academy',
                'avatar_url' => 'https://github.com/Particle-Academy.png',
                'password' => bcrypt(str()->random(40)),
            ],
        );

        $samples = [
            [
                'kind' => 'repo',
                'url' => 'https://github.com/Particle-Academy/pa-ux-sandbox',
                'title' => 'Fancy UI Showcase',
                'description' => 'The sandbox you are looking at — Inertia + react-fancy + every Fancy UI surface, end to end.',
            ],
            [
                'kind' => 'repo',
                'url' => 'https://github.com/Particle-Academy/react-fancy',
                'title' => 'react-fancy',
                'description' => 'The flagship React component library — ~70 Tailwind v4 primitives, the foundation of every other Fancy UI surface.',
            ],
            [
                'kind' => 'repo',
                'url' => 'https://github.com/Particle-Academy/agent-integrations',
                'title' => 'agent-integrations',
                'description' => 'The Human+ UX runtime — micro-MCP server, per-package bridges, presence layer, share relay.',
            ],
            [
                'kind' => 'repo',
                'url' => 'https://github.com/Particle-Academy/fancy-whiteboard',
                'title' => 'fancy-whiteboard',
                'description' => 'Transport-agnostic collaborative board with agent-cursor support out of the box.',
            ],
            [
                'kind' => 'repo',
                'url' => 'https://github.com/Particle-Academy/holy-sheet',
                'title' => 'holy-sheet',
                'description' => 'PHP xlsx writer for agentic document creation — round-trip safe, zero third-party deps.',
            ],
        ];

        foreach ($samples as $s) {
            ShowcaseSubmission::query()->updateOrCreate(
                ['url' => $s['url']],
                [
                    'user_id' => $user->id,
                    'kind' => $s['kind'],
                    'title' => $s['title'],
                    'description' => $s['description'],
                    'status' => 'verified',
                    'scan_result' => [
                        'seeded' => true,
                        'verified' => true,
                        'matches' => ['@particle-academy/*' => 'inline reference'],
                    ],
                    'scanned_at' => now(),
                ],
            );
        }

        $this->info('Seeded '.count($samples).' showcase submissions.');
    }

    private function seedLeaderboard(): void
    {
        $rows = [
            ['github_username' => 'glenn-wagner',     'merged_prs' => 87, 'votes_cast' => 142, 'score' => 87 * 3 + 142, 'seeded' => true],
            ['github_username' => 'claude',           'merged_prs' => 64, 'votes_cast' => 96,  'score' => 64 * 3 + 96,  'seeded' => true],
            ['github_username' => 'rita-kumar',       'merged_prs' => 41, 'votes_cast' => 73,  'score' => 41 * 3 + 73,  'seeded' => true],
            ['github_username' => 'sam-lin',          'merged_prs' => 33, 'votes_cast' => 58,  'score' => 33 * 3 + 58,  'seeded' => true],
            ['github_username' => 'ayodeji-adekola',  'merged_prs' => 24, 'votes_cast' => 81,  'score' => 24 * 3 + 81,  'seeded' => true],
            ['github_username' => 'priya-patel',      'merged_prs' => 19, 'votes_cast' => 47,  'score' => 19 * 3 + 47,  'seeded' => true],
            ['github_username' => 'leo-martinez',     'merged_prs' => 12, 'votes_cast' => 39,  'score' => 12 * 3 + 39,  'seeded' => true],
            ['github_username' => 'maya-chen',        'merged_prs' => 8,  'votes_cast' => 42,  'score' => 8 * 3 + 42,   'seeded' => true],
        ];

        usort($rows, fn ($a, $b) => $b['score'] <=> $a['score']);

        foreach (['all_time', 'last_30_days'] as $scope) {
            $scopedRows = $scope === 'last_30_days'
                ? array_map(fn ($r) => [...$r, 'merged_prs' => (int) round($r['merged_prs'] * 0.18), 'votes_cast' => (int) round($r['votes_cast'] * 0.22), 'score' => 0], $rows)
                : $rows;

            if ($scope === 'last_30_days') {
                $scopedRows = array_map(fn ($r) => [...$r, 'score' => $r['merged_prs'] * 3 + $r['votes_cast']], $scopedRows);
                usort($scopedRows, fn ($a, $b) => $b['score'] <=> $a['score']);
            }

            LeaderboardSnapshot::create([
                'scope' => $scope,
                'rows' => $scopedRows,
                'generated_at' => now(),
            ]);
        }

        $this->info('Seeded leaderboard snapshots (all_time + last_30_days).');
    }
}

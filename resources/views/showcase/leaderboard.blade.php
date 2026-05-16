@extends('layouts.showcase', ['title' => 'Leaderboard'])

@section('content')
    <div class="flex flex-wrap items-end justify-between gap-3">
        <div>
            <flux:heading size="xl" level="1">Leaderboard</flux:heading>
            <flux:text class="mt-2 max-w-3xl">
                Top contributors by merged PRs across every <code class="font-mono">Particle-Academy/*</code>
                repo and votes cast on dreams. Score = merged PRs × 3 + votes cast.
            </flux:text>
        </div>
        <div class="inline-flex overflow-hidden rounded-md border border-zinc-300 text-xs dark:border-zinc-700">
            <a href="?scope=all_time"
               class="px-3 py-1.5 {{ $scope === 'all_time' ? 'bg-violet-600 text-white' : 'text-zinc-600 dark:text-zinc-300' }}">
                All time
            </a>
            <a href="?scope=last_30_days"
               class="border-l border-zinc-300 px-3 py-1.5 dark:border-zinc-700 {{ $scope === 'last_30_days' ? 'bg-violet-600 text-white' : 'text-zinc-600 dark:text-zinc-300' }}">
                Last 30 days
            </a>
        </div>
    </div>

    @if(empty($rows))
        <flux:card class="mt-6">
            <div class="p-10 text-center text-sm text-zinc-500">
                No leaderboard snapshot yet. Run <code class="font-mono">php artisan showcase:refresh-leaderboard</code>
                or wait for the scheduled job (03:00 daily). Requires <code class="font-mono">GITHUB_API_TOKEN</code> in .env.
            </div>
        </flux:card>
    @else
        <flux:card class="mt-6 overflow-hidden">
            <flux:table>
                <flux:table.columns>
                    <flux:table.column>#</flux:table.column>
                    <flux:table.column>Contributor</flux:table.column>
                    <flux:table.column align="right">Merged PRs</flux:table.column>
                    <flux:table.column align="right">Votes cast</flux:table.column>
                    <flux:table.column align="right">Score</flux:table.column>
                </flux:table.columns>
                <flux:table.rows>
                    @foreach ($rows as $i => $row)
                        <flux:table.row>
                            <flux:table.cell class="font-mono">{{ $i + 1 }}</flux:table.cell>
                            <flux:table.cell>
                                <a href="https://github.com/{{ $row['github_username'] }}" target="_blank" class="font-medium hover:underline">
                                    {{ $row['github_username'] }}
                                </a>
                            </flux:table.cell>
                            <flux:table.cell align="right" class="font-mono">{{ $row['merged_prs'] }}</flux:table.cell>
                            <flux:table.cell align="right" class="font-mono">{{ $row['votes_cast'] }}</flux:table.cell>
                            <flux:table.cell align="right" class="font-mono font-semibold">{{ $row['score'] }}</flux:table.cell>
                        </flux:table.row>
                    @endforeach
                </flux:table.rows>
            </flux:table>
        </flux:card>
        @if($snapshot)
            <flux:text size="xs" class="mt-3 text-zinc-500">
                Generated {{ $snapshot->generated_at->diffForHumans() }}.
            </flux:text>
        @endif
    @endif
@endsection

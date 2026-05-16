@extends('layouts.showcase', ['title' => 'Leaderboard'])

@section('content')
    <flux:heading size="xl" level="1">Leaderboard</flux:heading>
    <flux:text class="mt-2 max-w-3xl">
        Top contributors to Fancy UI by merged PRs across every <code class="font-mono">Particle-Academy/*</code>
        submodule repo and votes cast on dreams.
    </flux:text>

    <flux:card class="mt-6">
        <div class="grid place-items-center p-10 text-center text-sm text-zinc-500">
            Phase 4 — a nightly cron job aggregates the GitHub API + the local <code class="font-mono">showcase_votes</code> table into a cached snapshot rendered here.
        </div>
    </flux:card>
@endsection

@extends('layouts.showcase', ['title' => 'Leaderboard'])

@section('content')
    <h1 class="text-3xl font-semibold tracking-tight">Leaderboard</h1>
    <p class="mt-2 max-w-3xl text-base" style="color: var(--fg-2);">
        Top contributors to Fancy UI by merged PRs across every <code class="fancy-mono">Particle-Academy/*</code>
        submodule repo and votes cast on dreams.
    </p>

    <div class="mt-6 fancy-card p-10 text-center" style="color: var(--fg-3);">
        Phase 4 — a nightly cron job aggregates the GitHub API + the local <code class="fancy-mono">showcase_votes</code> table into a cached snapshot rendered here.
    </div>
@endsection

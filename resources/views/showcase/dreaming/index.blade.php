@extends('layouts.showcase', ['title' => 'Dreaming · Fancy UI'])

@section('content')
    <h1 class="text-3xl font-semibold tracking-tight">Dreaming</h1>
    <p class="mt-2 max-w-3xl text-base" style="color: var(--fg-2);">
        Speculative components proposed for inclusion in the Fancy UI kit.
        Browse anonymously; vote when you sign in with GitHub. Components
        that net negative votes auto-archive — we keep them so we know what
        not to build again. See the <a href="{{ route('dreaming.archived') }}" class="underline-offset-2 hover:underline">archived list</a>.
    </p>

    <div class="mt-6 fancy-card p-10 text-center" style="color: var(--fg-3);">
        Phase 3 — the public Dreaming gallery mounts here.<br>
        Source of truth: <code class="fancy-mono">resources/js/dreaming/manifest.ts</code> on the <code class="fancy-mono">dreaming</code> branch,
        merged into <code class="fancy-mono">main</code> on each ship.
    </div>
@endsection

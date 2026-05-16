@extends('layouts.showcase', ['title' => 'Dreaming · Fancy UI'])

@section('content')
    <flux:heading size="xl" level="1">Dreaming</flux:heading>
    <flux:text class="mt-2 max-w-3xl">
        Speculative components proposed for inclusion in the Fancy UI kit.
        Browse anonymously; vote when you sign in with GitHub. Components
        that net negative votes auto-archive — we keep them so we know what
        not to build again.
    </flux:text>
    <div class="mt-3">
        <flux:link href="{{ route('dreaming.archived') }}">See archived dreams →</flux:link>
    </div>

    <flux:card class="mt-6">
        <div class="grid place-items-center p-10 text-center text-sm text-zinc-500">
            Phase 3 — the public Dreaming gallery mounts here.<br>
            Source of truth: <code class="font-mono">resources/js/dreaming/manifest.ts</code> on the <code class="font-mono">dreaming</code> branch,
            merged into <code class="font-mono">main</code> on each ship.
        </div>
    </flux:card>
@endsection

@extends('layouts.showcase', ['title' => $kit['name'].' · Starter Kit'])

@section('content')
    <div class="flex items-center gap-2 text-sm">
        <a href="{{ route('starter-kits.index') }}" style="color: var(--fg-3);">Starter Kits</a>
        <span style="color: var(--fg-4);">/</span>
        <span style="color: var(--fg-1);">{{ $kit['name'] }}</span>
    </div>
    <h1 class="mt-3 text-3xl font-semibold tracking-tight">{{ $kit['name'] }}</h1>
    <p class="mt-2 max-w-3xl text-base" style="color: var(--fg-2);">{{ $kit['blurb'] }}</p>

    <div class="mt-6 fancy-card p-2">
        <div class="grid place-items-center rounded-md p-16 text-sm" style="background: var(--bg-1); border: 1px dashed var(--border-2); color: var(--fg-3);">
            Phase 2 — the running starter kit embeds here (iframe or React mount).<br>
            Built from <code class="fancy-mono">{{ $kit['pkg'] }}</code> + the rest of the Fancy UI kit.
        </div>
    </div>
@endsection

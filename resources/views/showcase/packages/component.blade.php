@extends('layouts.showcase', ['title' => $package['name'].' · '.$component['name']])

@section('content')
    <div class="flex items-center gap-2 text-sm">
        <a href="{{ route('packages.index') }}" style="color: var(--fg-3);">Packages</a>
        <span style="color: var(--fg-4);">/</span>
        <a href="{{ route('packages.show', $package['slug']) }}" style="color: var(--fg-3);">{{ $package['name'] }}</a>
        <span style="color: var(--fg-4);">/</span>
        <span style="color: var(--fg-1);">{{ $component['name'] }}</span>
    </div>
    <h1 class="mt-3 text-3xl font-semibold tracking-tight">{{ $component['name'] }}</h1>
    @if(!empty($component['blurb']))
        <p class="mt-2 max-w-3xl text-base" style="color: var(--fg-2);">{{ $component['blurb'] }}</p>
    @endif

    <div class="mt-6 fancy-card p-6">
        <span class="fancy-eyebrow">Live demo</span>
        <div class="mt-4 grid place-items-center rounded-md p-10" style="background: var(--bg-1); border: 1px dashed var(--border-2); color: var(--fg-3);">
            Phase 2 — per-component live demo mounts here.
        </div>
    </div>

    <div class="mt-6 fancy-card p-6">
        <span class="fancy-eyebrow">Usage in your project</span>
        <pre class="mt-3 overflow-x-auto rounded-md p-3 text-[12px]" style="background: var(--zinc-950); color: var(--zinc-100);">{{-- Phase 2 substitutes the real USAGE snippet here. --}}{{ "import { {$component['name']} } from \"{$package['npm']}\";" }}</pre>
    </div>
@endsection

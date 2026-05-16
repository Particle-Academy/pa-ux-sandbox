@extends('layouts.showcase', ['title' => $package['name']])

@section('content')
    <div class="flex items-center gap-2 text-sm">
        <a href="{{ route('packages.index') }}" style="color: var(--fg-3);">Packages</a>
        <span style="color: var(--fg-4);">/</span>
        <span style="color: var(--fg-1);">{{ $package['name'] }}</span>
    </div>
    <h1 class="mt-3 text-3xl font-semibold tracking-tight">{{ $package['name'] }}</h1>
    <p class="mt-2 max-w-3xl text-base" style="color: var(--fg-2);">{{ $package['tagline'] }}</p>

    <div class="mt-2 flex flex-wrap gap-3 text-[11px]" style="color: var(--fg-3);">
        @if(!empty($package['npm']))
            <span class="fancy-mono">npm: {{ $package['npm'] }}</span>
        @endif
        @if(!empty($package['composer']))
            <span class="fancy-mono">composer: {{ $package['composer'] }}</span>
        @endif
        <a href="https://github.com/{{ $package['repo'] }}" target="_blank" rel="noopener" class="underline-offset-2 hover:underline">github.com/{{ $package['repo'] }}</a>
    </div>

    <h2 class="mt-10 text-xl font-semibold tracking-tight">Components</h2>
    <div class="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        @foreach ($package['components'] ?? [] as $c)
            <a href="{{ route('packages.component', [$package['slug'], $c['slug']]) }}" class="fancy-card p-3 transition hover:bg-[color:var(--bg-2)]">
                <div class="font-mono text-sm">{{ $c['name'] }}</div>
                @if(!empty($c['blurb']))
                    <div class="mt-0.5 text-[11px]" style="color: var(--fg-3);">{{ $c['blurb'] }}</div>
                @endif
            </a>
        @endforeach
    </div>
@endsection

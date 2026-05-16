@extends('layouts.showcase', ['title' => 'Packages'])

@section('content')
    <h1 class="text-3xl font-semibold tracking-tight">Packages</h1>
    <p class="mt-2 text-sm" style="color: var(--fg-3);">Every Fancy UI package, with a per-component live demo behind each tile.</p>

    <div class="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        @foreach ($packages as $pkg)
            <a href="{{ route('packages.show', $pkg['slug']) }}" class="fancy-card p-5 transition hover:translate-y-[-1px] hover:shadow-lg">
                <div class="flex items-center justify-between">
                    <div class="text-base font-semibold">{{ $pkg['name'] }}</div>
                    <span class="rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider" style="background: var(--bg-2); color: var(--fg-2);">{{ $pkg['language'] }}</span>
                </div>
                <p class="mt-1 text-sm" style="color: var(--fg-2);">{{ $pkg['tagline'] }}</p>
                <div class="mt-3 text-[11px]" style="color: var(--fg-3);">
                    {{ count($pkg['components'] ?? []) }} components
                </div>
            </a>
        @endforeach
    </div>
@endsection

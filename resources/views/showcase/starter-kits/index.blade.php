@extends('layouts.showcase', ['title' => 'Starter Kits'])

@section('content')
    <h1 class="text-3xl font-semibold tracking-tight">Starter Kits</h1>
    <p class="mt-2 max-w-2xl text-sm" style="color: var(--fg-3);">Full-app demos built from Fancy UI pieces. Each is a vertical example you can clone, study, and adapt.</p>

    <div class="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        @foreach ($kits as $k)
            <a href="{{ route('starter-kits.show', $k['slug']) }}" class="fancy-card p-5 transition hover:translate-y-[-1px] hover:shadow-lg">
                <div class="text-base font-semibold">{{ $k['name'] }}</div>
                <p class="mt-1 text-sm" style="color: var(--fg-2);">{{ $k['blurb'] }}</p>
                <div class="mt-3 text-[11px]" style="color: var(--fg-3);">Built with {{ $k['pkg'] }}</div>
            </a>
        @endforeach
    </div>
@endsection

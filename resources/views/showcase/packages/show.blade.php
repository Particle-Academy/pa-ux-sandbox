@extends('layouts.showcase', ['title' => $package['name']])

@section('content')
    <flux:breadcrumbs>
        <flux:breadcrumbs.item href="{{ route('packages.index') }}">Packages</flux:breadcrumbs.item>
        <flux:breadcrumbs.item>{{ $package['name'] }}</flux:breadcrumbs.item>
    </flux:breadcrumbs>

    <flux:heading size="xl" level="1" class="mt-3">{{ $package['name'] }}</flux:heading>
    <flux:text class="mt-2 max-w-3xl">{{ $package['tagline'] }}</flux:text>

    <div class="mt-3 flex flex-wrap items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
        @if(!empty($package['npm']))
            <flux:badge color="indigo" size="sm" class="font-mono">npm: {{ $package['npm'] }}</flux:badge>
        @endif
        @if(!empty($package['composer']))
            <flux:badge color="violet" size="sm" class="font-mono">composer: {{ $package['composer'] }}</flux:badge>
        @endif
        <flux:link href="https://github.com/{{ $package['repo'] }}" target="_blank">
            github.com/{{ $package['repo'] }}
        </flux:link>
    </div>

    <flux:heading size="lg" level="2" class="mt-10">Components</flux:heading>
    <div class="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        @foreach ($package['components'] ?? [] as $c)
            <a href="{{ route('packages.component', [$package['slug'], $c['slug']]) }}">
                <flux:card class="transition hover:bg-zinc-50 dark:hover:bg-zinc-900">
                    <flux:card.body>
                        <flux:text class="font-mono font-medium">{{ $c['name'] }}</flux:text>
                        @if(!empty($c['blurb']))
                            <flux:text size="xs" class="mt-0.5">{{ $c['blurb'] }}</flux:text>
                        @endif
                    </flux:card.body>
                </flux:card>
            </a>
        @endforeach
    </div>
@endsection

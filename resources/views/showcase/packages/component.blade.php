@extends('layouts.showcase', ['title' => $package['name'].' · '.$component['name']])

@section('content')
    <flux:breadcrumbs>
        <flux:breadcrumbs.item href="{{ route('packages.index') }}">Packages</flux:breadcrumbs.item>
        <flux:breadcrumbs.item href="{{ route('packages.show', $package['slug']) }}">{{ $package['name'] }}</flux:breadcrumbs.item>
        <flux:breadcrumbs.item>{{ $component['name'] }}</flux:breadcrumbs.item>
    </flux:breadcrumbs>

    <flux:heading size="xl" level="1" class="mt-3">{{ $component['name'] }}</flux:heading>
    @if(!empty($component['blurb']))
        <flux:text class="mt-2 max-w-3xl">{{ $component['blurb'] }}</flux:text>
    @endif

    <flux:card class="mt-6">
        <flux:card.header>
            <flux:text size="xs" class="uppercase tracking-wider font-semibold text-zinc-500">Live demo</flux:text>
        </flux:card.header>
        <flux:card.body>
            <div class="grid place-items-center rounded-md border border-dashed border-zinc-300 bg-zinc-50 p-10 text-sm text-zinc-500 dark:border-zinc-700 dark:bg-zinc-900">
                Phase 2 — per-component live demo mounts here.
            </div>
        </flux:card.body>
    </flux:card>

    <flux:card class="mt-6">
        <flux:card.header>
            <flux:text size="xs" class="uppercase tracking-wider font-semibold text-zinc-500">Usage in your project</flux:text>
        </flux:card.header>
        <flux:card.body>
            <pre class="overflow-x-auto rounded-md bg-zinc-950 p-3 text-xs text-zinc-100">{{ "import { {$component['name']} } from \"{$package['npm']}\";" }}</pre>
        </flux:card.body>
    </flux:card>
@endsection

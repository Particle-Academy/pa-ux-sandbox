@extends('layouts.showcase', ['title' => $kit['name'].' · Starter Kit'])

@section('content')
    <flux:breadcrumbs>
        <flux:breadcrumbs.item href="{{ route('starter-kits.index') }}">Starter Kits</flux:breadcrumbs.item>
        <flux:breadcrumbs.item>{{ $kit['name'] }}</flux:breadcrumbs.item>
    </flux:breadcrumbs>

    <flux:heading size="xl" level="1" class="mt-3">{{ $kit['name'] }}</flux:heading>
    <flux:text class="mt-2 max-w-3xl">{{ $kit['blurb'] }}</flux:text>

    <flux:card class="mt-6">
        <div class="grid place-items-center rounded-md border border-dashed border-zinc-300 bg-zinc-50 p-16 text-sm text-zinc-500 dark:border-zinc-700 dark:bg-zinc-900">
            Phase 2 — the running starter kit embeds here (iframe or React mount).<br>
            Built from <code class="font-mono">{{ $kit['pkg'] }}</code> + the rest of the Fancy UI kit.
        </div>
    </flux:card>
@endsection

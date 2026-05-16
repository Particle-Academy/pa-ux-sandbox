@extends('layouts.showcase', ['title' => 'Starter Kits'])

@section('content')
    <flux:heading size="xl" level="1">Starter Kits</flux:heading>
    <flux:text class="mt-2 max-w-2xl">
        Full-app demos built from Fancy UI pieces. Each is a vertical example you can clone, study, and adapt.
    </flux:text>

    <div class="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        @foreach ($kits as $k)
            <a href="{{ route('starter-kits.show', $k['slug']) }}" class="block transition hover:-translate-y-px hover:shadow-lg">
                <flux:card class="h-full">
                    <flux:card.body>
                        <flux:heading size="sm">{{ $k['name'] }}</flux:heading>
                        <flux:text size="sm" class="mt-1">{{ $k['blurb'] }}</flux:text>
                        <flux:text size="xs" class="mt-3 text-zinc-400">Built with {{ $k['pkg'] }}</flux:text>
                    </flux:card.body>
                </flux:card>
            </a>
        @endforeach
    </div>
@endsection

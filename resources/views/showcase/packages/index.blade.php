@extends('layouts.showcase', ['title' => 'Packages'])

@section('content')
    <flux:heading size="xl" level="1">Packages</flux:heading>
    <flux:text class="mt-2">Every Fancy UI package, with a per-component live demo behind each tile.</flux:text>

    <div class="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        @foreach ($packages as $pkg)
            <a href="{{ route('packages.show', $pkg['slug']) }}" class="block transition hover:-translate-y-px hover:shadow-lg">
                <flux:card class="h-full">
                    <flux:card.body>
                        <div class="flex items-center justify-between">
                            <flux:heading size="sm">{{ $pkg['name'] }}</flux:heading>
                            <flux:badge color="zinc" size="sm">{{ $pkg['language'] }}</flux:badge>
                        </div>
                        <flux:text size="sm" class="mt-1">{{ $pkg['tagline'] }}</flux:text>
                        <flux:text size="xs" class="mt-3 text-zinc-400">{{ count($pkg['components'] ?? []) }} components</flux:text>
                    </flux:card.body>
                </flux:card>
            </a>
        @endforeach
    </div>
@endsection

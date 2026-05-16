@extends('layouts.showcase', ['title' => 'Fancy UI Kit'])

@section('content')
    <section class="grid gap-8 lg:grid-cols-[1.4fr_1fr] lg:items-start">
        <div>
            <flux:text size="xs" class="uppercase tracking-wider font-semibold text-zinc-500">
                Particle Academy
            </flux:text>
            <flux:heading size="xl" level="1" class="mt-2">
                Build apps where <span class="brand-gradient-text">humans and agents</span> share the same UI.
            </flux:heading>
            <flux:text class="mt-4 max-w-xl">
                Fancy UI is a constellation of React, PHP, and Babylon packages from Particle Academy built for
                <strong>Human+ UX</strong> — interfaces designed from the ground up for humans and AI agents
                collaborating in the same surface. Every component is bridgeable, not just paintable.
            </flux:text>
            <div class="mt-6 flex flex-wrap gap-2">
                <flux:action color="violet" href="{{ route('packages.index') }}" icon:trailing="arrow-right">
                    Browse packages
                </flux:action>
                <flux:action href="{{ route('starter-kits.index') }}">
                    See starter kits
                </flux:action>
                <flux:link href="/docs/human-plus-ux.md" class="self-center text-sm">
                    Read the whitepaper →
                </flux:link>
            </div>
        </div>

        <flux:card>
            <flux:card.header>
                <flux:heading size="sm">Why this kit</flux:heading>
            </flux:card.header>
            <flux:card.body>
                <ul class="space-y-3 text-sm text-zinc-600 dark:text-zinc-300">
                    <li><strong class="text-zinc-900 dark:text-zinc-100">Authorable.</strong> Tailwind-first; tiny, typed APIs. An LLM that reads a prop signature once can use it correctly.</li>
                    <li><strong class="text-zinc-900 dark:text-zinc-100">Inhabitable.</strong> Every interactive surface ships an MCP bridge so embedded agents drive it via JSON-RPC — no Playwright, no vision pass.</li>
                    <li><strong class="text-zinc-900 dark:text-zinc-100">Composable.</strong> Small npm/PHP packages. Take one, take them all.</li>
                </ul>
            </flux:card.body>
        </flux:card>
    </section>

    <flux:separator class="my-12" />

    <section>
        <div class="flex items-baseline justify-between">
            <flux:heading size="lg" level="2">Packages</flux:heading>
            <flux:text size="sm" class="text-zinc-500">
                {{ count(\App\Support\PackageRegistry::all()) }} packages ·
                {{ collect(\App\Support\PackageRegistry::all())->sum(fn ($p) => count($p['components'] ?? [])) }} components
            </flux:text>
        </div>
        <div class="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            @foreach (\App\Support\PackageRegistry::all() as $pkg)
                <a href="{{ route('packages.show', $pkg['slug']) }}" class="block transition hover:-translate-y-px hover:shadow-lg">
                    <flux:card class="h-full">
                        <flux:card.body>
                            <div class="flex items-center justify-between">
                                <flux:heading size="sm">{{ $pkg['name'] }}</flux:heading>
                                <flux:badge color="zinc" size="sm">{{ $pkg['language'] }}</flux:badge>
                            </div>
                            <flux:text size="xs" class="mt-1 text-zinc-500">{{ $pkg['tagline'] }}</flux:text>
                            <flux:text size="xs" class="mt-3 text-zinc-400">
                                {{ count($pkg['components'] ?? []) }} components
                            </flux:text>
                        </flux:card.body>
                    </flux:card>
                </a>
            @endforeach
        </div>
    </section>

    <flux:separator class="my-12" />

    <section class="grid gap-4 sm:grid-cols-3">
        <a href="{{ route('dreaming.index') }}">
            <flux:card class="h-full transition hover:-translate-y-px hover:shadow-lg">
                <flux:card.body>
                    <flux:heading size="sm">Dreaming</flux:heading>
                    <flux:text size="xs" class="mt-1 text-zinc-500">
                        Speculative components you can vote on. Sign in with GitHub to participate.
                    </flux:text>
                </flux:card.body>
            </flux:card>
        </a>
        <a href="{{ route('showcase.showcase.index') }}">
            <flux:card class="h-full transition hover:-translate-y-px hover:shadow-lg">
                <flux:card.body>
                    <flux:heading size="sm">Designer Showcase</flux:heading>
                    <flux:text size="xs" class="mt-1 text-zinc-500">
                        Sites and repos built with Fancy UI. Submit yours.
                    </flux:text>
                </flux:card.body>
            </flux:card>
        </a>
        <a href="{{ route('leaderboard') }}">
            <flux:card class="h-full transition hover:-translate-y-px hover:shadow-lg">
                <flux:card.body>
                    <flux:heading size="sm">Leaderboard</flux:heading>
                    <flux:text size="xs" class="mt-1 text-zinc-500">
                        Top contributors by merged PRs and votes cast.
                    </flux:text>
                </flux:card.body>
            </flux:card>
        </a>
    </section>
@endsection

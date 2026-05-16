@extends('layouts.showcase', ['title' => 'Fancy UI Kit'])

@section('content')
    <section class="grid gap-8 lg:grid-cols-[1.4fr_1fr] lg:items-start">
        <div>
            <span class="fancy-eyebrow">Particle Academy</span>
            <h1 class="mt-2 text-5xl font-semibold tracking-tight">
                Build apps where <span class="brand-gradient-text">humans and agents</span> share the same UI.
            </h1>
            <p class="mt-4 max-w-xl text-base" style="color: var(--fg-2);">
                Fancy UI is a constellation of React, PHP, and Babylon packages from Particle Academy built for
                <strong>Human+ UX</strong> — interfaces designed from the ground up for humans and AI agents
                collaborating in the same surface. Every component is bridgeable, not just paintable.
            </p>
            <div class="mt-6 flex flex-wrap gap-2">
                <a href="{{ route('packages.index') }}"
                   class="inline-flex items-center rounded-md px-4 py-2 text-sm font-medium text-white"
                   style="background: var(--violet-600);">
                    Browse packages →
                </a>
                <a href="{{ route('starter-kits.index') }}"
                   class="inline-flex items-center rounded-md border px-4 py-2 text-sm font-medium"
                   style="border-color: var(--border-1); color: var(--fg-1);">
                    See starter kits
                </a>
                <a href="/docs/human-plus-ux.md"
                   class="inline-flex items-center rounded-md px-4 py-2 text-sm" style="color: var(--fg-3);">
                    Read the whitepaper →
                </a>
            </div>
        </div>
        <div class="fancy-card p-6">
            <div class="fancy-eyebrow">Why this kit</div>
            <ul class="mt-3 space-y-3 text-sm" style="color: var(--fg-2);">
                <li><strong style="color: var(--fg-1);">Authorable.</strong> Tailwind-first; tiny, typed APIs. An LLM that reads a prop signature once can use it correctly.</li>
                <li><strong style="color: var(--fg-1);">Inhabitable.</strong> Every interactive surface ships an MCP bridge so embedded agents drive it via JSON-RPC — no Playwright, no vision pass.</li>
                <li><strong style="color: var(--fg-1);">Composable.</strong> Small npm/PHP packages. Take one, take them all.</li>
            </ul>
        </div>
    </section>

    <section class="mt-16">
        <h2 class="text-2xl font-semibold tracking-tight">Packages</h2>
        <p class="mt-1 text-sm" style="color: var(--fg-3);">{{ count(\App\Support\PackageRegistry::all()) }} packages, ~{{ collect(\App\Support\PackageRegistry::all())->sum(fn ($p) => count($p['components'] ?? [])) }} components.</p>
        <div class="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            @foreach (\App\Support\PackageRegistry::all() as $pkg)
                <a href="{{ route('packages.show', $pkg['slug']) }}" class="fancy-card p-4 transition hover:translate-y-[-1px] hover:shadow-lg">
                    <div class="flex items-center justify-between">
                        <div class="text-sm font-semibold">{{ $pkg['name'] }}</div>
                        <span class="text-[10px] uppercase tracking-wider" style="color: var(--fg-3);">{{ $pkg['language'] }}</span>
                    </div>
                    <p class="mt-1 text-xs" style="color: var(--fg-3);">{{ $pkg['tagline'] }}</p>
                    <div class="mt-3 text-[11px]" style="color: var(--fg-3);">{{ count($pkg['components'] ?? []) }} components</div>
                </a>
            @endforeach
        </div>
    </section>

    <section class="mt-16 grid gap-4 sm:grid-cols-3">
        <a href="{{ route('dreaming.index') }}" class="fancy-card p-5">
            <div class="text-sm font-semibold">Dreaming</div>
            <p class="mt-1 text-xs" style="color: var(--fg-3);">Speculative components you can vote on. Sign in with GitHub to participate.</p>
        </a>
        <a href="{{ route('showcase.showcase.index') }}" class="fancy-card p-5">
            <div class="text-sm font-semibold">Designer Showcase</div>
            <p class="mt-1 text-xs" style="color: var(--fg-3);">Sites and repos built with Fancy UI. Submit yours.</p>
        </a>
        <a href="{{ route('leaderboard') }}" class="fancy-card p-5">
            <div class="text-sm font-semibold">Leaderboard</div>
            <p class="mt-1 text-xs" style="color: var(--fg-3);">Top contributors by merged PRs and votes cast.</p>
        </a>
    </section>
@endsection

@extends('layouts.showcase', ['title' => 'Designer Showcase'])

@section('content')
    <div class="flex flex-wrap items-end justify-between gap-3">
        <div>
            <flux:heading size="xl" level="1">Designer Showcase</flux:heading>
            <flux:text class="mt-2 max-w-3xl">
                Live sites and public repos built with Fancy UI. Every submission is scanned —
                a website's bundle for <code class="font-mono">@particle-academy/*</code> chunk names, a repo's
                <code class="font-mono">package.json</code> / <code class="font-mono">composer.json</code> for the deps —
                before it's listed.
            </flux:text>
        </div>
        @auth
            <flux:action color="violet" href="{{ route('showcase.showcase.create') }}" icon="plus">
                Submit a site or repo
            </flux:action>
        @else
            <flux:action color="zinc" href="{{ route('auth.github') }}" icon="github">
                Sign in to submit
            </flux:action>
        @endauth
    </div>

    @if($submissions->isEmpty())
        <flux:card class="mt-6">
            <div class="p-10 text-center text-sm text-zinc-500">
                No verified submissions yet. Be the first — sign in and submit your site.
            </div>
        </flux:card>
    @else
        <div class="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            @foreach ($submissions as $s)
                <a href="{{ $s->url }}" target="_blank" rel="noopener">
                    <flux:card class="overflow-hidden transition hover:-translate-y-px hover:shadow-lg">
                        @if($s->thumbnail_url)
                            <img src="{{ $s->thumbnail_url }}" alt="" class="h-32 w-full object-cover">
                        @else
                            <div class="grid h-32 place-items-center bg-zinc-50 text-sm text-zinc-500 dark:bg-zinc-900">
                                {{ $s->kind === 'repo' ? '⎇ repo' : '🌐 site' }}
                            </div>
                        @endif
                        <flux:card.body>
                            <flux:heading size="sm">{{ $s->title ?? parse_url($s->url, PHP_URL_HOST) }}</flux:heading>
                            @if($s->description)
                                <flux:text size="xs" class="mt-1">{{ $s->description }}</flux:text>
                            @endif
                        </flux:card.body>
                    </flux:card>
                </a>
            @endforeach
        </div>
    @endif
@endsection

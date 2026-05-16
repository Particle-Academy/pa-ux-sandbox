@extends('layouts.showcase', ['title' => 'Designer Showcase'])

@section('content')
    <div class="flex flex-wrap items-end justify-between gap-3">
        <div>
            <h1 class="text-3xl font-semibold tracking-tight">Designer Showcase</h1>
            <p class="mt-2 max-w-3xl text-sm" style="color: var(--fg-2);">
                Live sites and public repos built with Fancy UI. Every submission is scanned —
                a website's bundle for <code class="fancy-mono">@particle-academy/*</code> chunk names, a repo's
                <code class="fancy-mono">package.json</code> / <code class="fancy-mono">composer.json</code> for the deps —
                before it's listed.
            </p>
        </div>
        @auth
            <a href="{{ route('showcase.showcase.create') }}"
               class="rounded-md px-3 py-2 text-sm font-medium text-white"
               style="background: var(--violet-600);">
                Submit a site or repo
            </a>
        @else
            <a href="{{ route('auth.github') }}"
               class="rounded-md px-3 py-2 text-sm font-medium text-white"
               style="background: var(--zinc-900);">
                Sign in to submit
            </a>
        @endauth
    </div>

    @if($submissions->isEmpty())
        <div class="mt-6 fancy-card p-10 text-center" style="color: var(--fg-3);">
            No verified submissions yet. Be the first — sign in and submit your site.
        </div>
    @else
        <div class="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            @foreach ($submissions as $s)
                <a href="{{ $s->url }}" target="_blank" rel="noopener" class="fancy-card overflow-hidden transition hover:translate-y-[-1px] hover:shadow-lg">
                    @if($s->thumbnail_url)
                        <img src="{{ $s->thumbnail_url }}" alt="" class="h-32 w-full object-cover">
                    @else
                        <div class="grid h-32 place-items-center" style="background: var(--bg-1); color: var(--fg-3);">
                            {{ $s->kind === 'repo' ? '⎇ repo' : '🌐 site' }}
                        </div>
                    @endif
                    <div class="p-4">
                        <div class="text-sm font-semibold">{{ $s->title ?? parse_url($s->url, PHP_URL_HOST) }}</div>
                        @if($s->description)<p class="mt-1 text-xs" style="color: var(--fg-3);">{{ $s->description }}</p>@endif
                    </div>
                </a>
            @endforeach
        </div>
    @endif
@endsection

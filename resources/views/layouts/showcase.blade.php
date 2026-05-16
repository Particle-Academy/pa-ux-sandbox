<!doctype html>
<html lang="en" class="">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <title>{{ $title ?? 'Fancy UI Kit · Particle Academy' }}</title>

    {{-- Apply persisted theme synchronously to avoid FOUC. --}}
    <script>
        (function () {
            try {
                var saved = localStorage.getItem('fancy-ui.theme');
                var dark = saved
                    ? saved === 'dark'
                    : window.matchMedia('(prefers-color-scheme: dark)').matches;
                if (dark) document.documentElement.classList.add('dark');
                document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
            } catch (e) { /* noop */ }
        })();
    </script>

    @vite(['resources/css/showcase.css', 'resources/js/showcase.ts'])
</head>
<body class="min-h-screen antialiased" style="background: var(--bg-0); color: var(--fg-1);">
    <header class="sticky top-0 z-30 backdrop-blur" style="background: color-mix(in oklch, var(--bg-0) 80%, transparent); border-bottom: 1px solid var(--border-1);">
        <div class="mx-auto flex max-w-7xl items-center gap-4 px-4 py-2.5">
            <a href="{{ route('home') }}" class="flex items-center gap-2">
                <img src="/showcase-assets/fancy-ui-logo.jpg" alt="" class="h-6 w-6 rounded">
                <span class="text-sm font-semibold tracking-tight">Fancy UI Kit</span>
            </a>

            <nav class="ml-2 flex items-center gap-1 text-sm" style="color: var(--fg-2);">
                @php $r = request()->path(); @endphp
                @foreach ([
                    ['packages',     'Packages'],
                    ['starter-kits', 'Starter Kits'],
                    ['dreaming',     'Dreaming'],
                    ['showcase',     'Showcase'],
                    ['leaderboard',  'Leaderboard'],
                ] as [$slug, $label])
                    <a href="/{{ $slug }}"
                       class="rounded-md px-2.5 py-1.5 transition hover:bg-[color:var(--bg-2)]"
                       @if(str_starts_with($r, $slug)) style="background: var(--bg-2); color: var(--fg-1);" @endif>
                        {{ $label }}
                    </a>
                @endforeach
            </nav>

            <div class="ml-auto flex items-center gap-2">
                <button data-theme-toggle
                        class="rounded-md border px-2 py-1.5 text-xs font-medium transition hover:bg-[color:var(--bg-2)]"
                        style="border-color: var(--border-1);"
                        aria-label="Toggle theme">
                    <span class="hidden dark:inline">☀</span>
                    <span class="dark:hidden">☾</span>
                </button>

                @auth
                    <a href="https://github.com/{{ auth()->user()->github_username }}"
                       target="_blank" rel="noopener"
                       class="flex items-center gap-2 rounded-md border px-2 py-1 text-xs"
                       style="border-color: var(--border-1);">
                        @if(auth()->user()->avatar_url)
                            <img src="{{ auth()->user()->avatar_url }}" alt="" class="h-5 w-5 rounded-full">
                        @endif
                        <span>{{ auth()->user()->github_username ?? auth()->user()->name }}</span>
                    </a>
                    <form method="POST" action="{{ route('auth.logout') }}">
                        @csrf
                        <button type="submit"
                                class="rounded-md px-2 py-1.5 text-xs"
                                style="color: var(--fg-3);">
                            Sign out
                        </button>
                    </form>
                @else
                    <a href="{{ route('auth.github') }}"
                       class="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium text-white"
                       style="background: var(--zinc-900);">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.91.58.11.79-.25.79-.55v-2.13c-3.2.7-3.87-1.37-3.87-1.37-.52-1.33-1.27-1.69-1.27-1.69-1.04-.71.08-.7.08-.7 1.15.08 1.76 1.18 1.76 1.18 1.02 1.75 2.68 1.24 3.34.95.1-.74.4-1.24.73-1.53-2.55-.29-5.24-1.28-5.24-5.71 0-1.26.45-2.29 1.18-3.1-.12-.29-.51-1.47.11-3.07 0 0 .97-.31 3.18 1.18a11 11 0 0 1 5.79 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.6.23 2.78.12 3.07.74.81 1.18 1.84 1.18 3.1 0 4.44-2.7 5.41-5.27 5.7.41.36.78 1.06.78 2.14v3.17c0 .31.21.67.8.55C20.21 21.38 23.5 17.07 23.5 12 23.5 5.65 18.35.5 12 .5z"/></svg>
                        Sign in with GitHub
                    </a>
                @endauth
            </div>
        </div>
    </header>

    @if(session('auth_error'))
        <div class="mx-auto max-w-7xl px-4 pt-3">
            <div class="rounded-md px-3 py-2 text-sm" style="background: var(--rose-50); color: var(--red-700); border: 1px solid var(--rose-300);">
                {{ session('auth_error') }}
            </div>
        </div>
    @endif
    @if(session('submitted'))
        <div class="mx-auto max-w-7xl px-4 pt-3">
            <div class="rounded-md px-3 py-2 text-sm" style="background: var(--emerald-50); color: var(--emerald-700); border: 1px solid var(--emerald-500);">
                {{ session('submitted') }}
            </div>
        </div>
    @endif

    <main class="mx-auto max-w-7xl px-4 py-8 fancy-fade-in">
        {{ $slot ?? '' }}
        @yield('content')
    </main>

    <footer class="mt-16 border-t" style="border-color: var(--border-1); color: var(--fg-3);">
        <div class="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-2 px-4 py-4 text-xs">
            <span>Fancy UI Kit · <a href="/docs/human-plus-ux.md" class="underline-offset-2 hover:underline">Human+ UX whitepaper</a></span>
            <span>© Particle Academy · MIT</span>
        </div>
    </footer>
</body>
</html>

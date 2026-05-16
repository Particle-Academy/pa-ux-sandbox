<!doctype html>
<html lang="en">
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

    @fluxAppearance

    @vite(['resources/css/showcase.css', 'resources/js/showcase.ts'])
</head>
<body class="min-h-screen antialiased bg-white text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100">
    <flux:header sticky class="border-b border-zinc-200 bg-white/80 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/80">
        <flux:brand
            href="{{ route('home') }}"
            logo="/showcase-assets/fancy-ui-logo.jpg"
            name="Fancy UI Kit"
            class="mr-6"
        />

        <flux:navbar class="-mb-px">
            @php $r = request()->path(); @endphp
            <flux:navbar.item href="{{ route('packages.index') }}" :current="str_starts_with($r, 'packages')">
                Packages
            </flux:navbar.item>
            <flux:navbar.item href="{{ route('starter-kits.index') }}" :current="str_starts_with($r, 'starter-kits')">
                Starter Kits
            </flux:navbar.item>
            <flux:navbar.item href="{{ route('dreaming.index') }}" :current="str_starts_with($r, 'dreaming')">
                Dreaming
            </flux:navbar.item>
            <flux:navbar.item href="{{ route('showcase.showcase.index') }}" :current="str_starts_with($r, 'showcase')">
                Showcase
            </flux:navbar.item>
            <flux:navbar.item href="{{ route('leaderboard') }}" :current="$r === 'leaderboard'">
                Leaderboard
            </flux:navbar.item>
        </flux:navbar>

        <flux:spacer />

        <div class="flex items-center gap-2">
            <flux:action
                variant="circle"
                size="sm"
                data-theme-toggle
                aria-label="Toggle theme"
                title="Toggle theme"
            >
                <span class="hidden dark:inline">☀</span>
                <span class="dark:hidden">☾</span>
            </flux:action>

            @auth
                <flux:dropdown>
                    <flux:profile
                        avatar="{{ auth()->user()->avatar_url }}"
                        name="{{ auth()->user()->github_username ?? auth()->user()->name }}"
                    />
                    <flux:menu>
                        <flux:menu.item href="https://github.com/{{ auth()->user()->github_username }}" target="_blank">
                            View GitHub profile
                        </flux:menu.item>
                        <flux:menu.separator />
                        <form method="POST" action="{{ route('auth.logout') }}" class="px-1 pb-1">
                            @csrf
                            <flux:menu.item as="button" type="submit" variant="danger">
                                Sign out
                            </flux:menu.item>
                        </form>
                    </flux:menu>
                </flux:dropdown>
            @else
                <flux:action
                    href="{{ route('auth.github') }}"
                    icon="github"
                    size="sm"
                    color="zinc"
                >
                    Sign in with GitHub
                </flux:action>
            @endauth
        </div>
    </flux:header>

    @if(session('auth_error'))
        <flux:container class="pt-3">
            <flux:callout variant="danger" icon="x-circle" inline>
                <flux:callout.text>{{ session('auth_error') }}</flux:callout.text>
            </flux:callout>
        </flux:container>
    @endif
    @if(session('submitted'))
        <flux:container class="pt-3">
            <flux:callout variant="success" icon="check-circle" inline>
                <flux:callout.text>{{ session('submitted') }}</flux:callout.text>
            </flux:callout>
        </flux:container>
    @endif

    <flux:main container class="py-8 fancy-fade-in">
        {{ $slot ?? '' }}
        @yield('content')
    </flux:main>

    <flux:footer container class="border-t border-zinc-200 mt-16 dark:border-zinc-800">
        <div class="flex flex-wrap items-center justify-between gap-2 py-4 text-xs text-zinc-500 dark:text-zinc-400">
            <flux:text>
                Fancy UI Kit · <flux:link href="/docs/human-plus-ux.md">Human+ UX whitepaper</flux:link>
            </flux:text>
            <flux:text>© Particle Academy · MIT</flux:text>
        </div>
    </flux:footer>

    @fluxScripts
</body>
</html>

<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}" class="dark">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="robots" content="noindex">
    <title>Sign in · Particle Academy</title>
    @vite(['resources/css/app.css'])
    <style>
        .auth-bg {
            background:
                radial-gradient(60rem 40rem at 50% -10%, color-mix(in oklab, #8b5cf6 22%, transparent), transparent 60%),
                radial-gradient(50rem 30rem at 100% 100%, color-mix(in oklab, #38bdf8 14%, transparent), transparent 55%),
                #09090b;
        }
        .auth-mark {
            background: linear-gradient(135deg, #7dd3fc, #8b5cf6);
        }
    </style>
</head>
<body class="auth-bg min-h-screen text-zinc-100 antialiased">
    <main class="flex min-h-screen flex-col items-center justify-center px-4 py-10">
        <a href="{{ route('home') }}" class="mb-8 inline-flex items-center gap-3">
            <span class="auth-mark grid h-10 w-10 place-items-center rounded-xl text-lg font-black text-zinc-950 shadow-lg">F</span>
            <span class="text-left">
                <span class="block text-sm font-semibold leading-tight">Particle Academy</span>
                <span class="block text-xs text-zinc-400">Fancy UI showcase</span>
            </span>
        </a>

        <div class="w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-900/70 p-8 shadow-2xl backdrop-blur">
            <h1 class="text-xl font-semibold">Sign in</h1>
            <p class="mt-1 text-sm text-zinc-400">Sign in with GitHub to submit a project, earn XP, and unlock Pro analytics.</p>

            @if ($errors->any())
                <div class="mt-5 rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                    <ul class="list-inside list-disc space-y-1">
                        @foreach ($errors->all() as $error)
                            <li>{{ $error }}</li>
                        @endforeach
                    </ul>
                </div>
            @endif

            {{-- Primary: GitHub OAuth — the real path for showcase members. --}}
            <a href="{{ route('auth.github') }}"
               class="mt-6 flex w-full items-center justify-center gap-3 rounded-lg bg-zinc-100 px-4 py-2.5 text-sm font-semibold text-zinc-900 transition hover:bg-white">
                <svg viewBox="0 0 16 16" width="18" height="18" fill="currentColor" aria-hidden="true">
                    <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8Z"/>
                </svg>
                Continue with GitHub
            </a>

            <div class="my-6 flex items-center gap-3 text-xs text-zinc-500">
                <span class="h-px flex-1 bg-zinc-800"></span>
                or sign in with email
                <span class="h-px flex-1 bg-zinc-800"></span>
            </div>

            {{-- Secondary: email/password (admin + manually-created accounts). --}}
            <form method="POST" action="{{ route('login') }}" id="loginForm" class="space-y-4">
                @csrf
                <div>
                    <label for="email" class="mb-1.5 block text-sm font-medium text-zinc-300">Email</label>
                    <input type="email" name="email" id="email" value="{{ old('email') }}" required autofocus
                           class="w-full rounded-lg border border-zinc-700 bg-zinc-950/60 px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-500/30"
                           placeholder="you@example.com">
                </div>
                <div>
                    <label for="password" class="mb-1.5 block text-sm font-medium text-zinc-300">Password</label>
                    <input type="password" name="password" id="password" required
                           class="w-full rounded-lg border border-zinc-700 bg-zinc-950/60 px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-500/30"
                           placeholder="••••••••">
                </div>
                <label class="flex items-center gap-2 text-sm text-zinc-400">
                    <input type="checkbox" name="remember" class="rounded border-zinc-600 bg-zinc-950 text-violet-500 focus:ring-violet-500/30">
                    Remember me
                </label>
                <button type="submit"
                        class="w-full rounded-lg bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-violet-500">
                    Sign in
                </button>
            </form>

            {{--
                Dev quick-login. Server-rendered only when the app runs in `local`
                ($devAccounts is [] otherwise, set by AuthController from
                DevAccounts::enabled()). In any other environment this HTML is never
                sent and /dev-login does not exist — no client-flippable flag.
            --}}
            @if (! empty($devAccounts))
                <div class="mt-6 border-t border-zinc-800 pt-4">
                    <p class="mb-3 text-center text-xs text-zinc-500">Dev login <span class="opacity-70">(local only)</span></p>
                    <div class="flex gap-2">
                        @foreach ($devAccounts as $account)
                            <form method="POST" action="{{ route('dev-login') }}" class="flex-1">
                                @csrf
                                <input type="hidden" name="email" value="{{ $account['email'] }}">
                                <button type="submit" title="Log in as {{ $account['email'] }}"
                                        class="w-full rounded-lg px-3 py-2 text-sm font-medium text-white transition {{ $account['is_admin'] ? 'bg-violet-700 hover:bg-violet-600' : 'bg-zinc-700 hover:bg-zinc-600' }}">
                                    {{ $account['label'] }}
                                </button>
                            </form>
                        @endforeach
                    </div>
                    <p class="mt-3 text-center text-xs text-zinc-600">
                        Run <code class="font-mono">php artisan db:seed --class=DevUsersSeeder</code> if these don't exist yet.
                    </p>
                </div>
            @endif
        </div>

        <a href="{{ route('home') }}" class="mt-6 text-sm text-zinc-500 transition hover:text-zinc-300">← Back to the showcase</a>
    </main>
</body>
</html>

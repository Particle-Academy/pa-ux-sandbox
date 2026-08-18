<!doctype html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="csrf-token" content="{{ csrf_token() }}">

    {{-- Upgrade any insecure http:// request to https:// instead of blocking it
         as mixed content. Belt-and-suspenders for stale browser-cached 301s — a
         Forge nginx directory-redirect (absolute_redirect) can emit an http://
         Location when it doesn't honor X-Forwarded-Proto; a browser that cached
         such a 301 would otherwise downgrade an Inertia visit to http and get
         blocked. This upgrades it transparently. --}}
    <meta http-equiv="Content-Security-Policy" content="upgrade-insecure-requests">

    {{-- Runtime broadcasting driver. The client gates Laravel Echo on this (see
         resources/js/lib/echo.ts) so prod — which runs no Reverb daemon
         (BROADCAST=null) but still ships the VITE_REVERB_* build keys — never
         opens a doomed websocket and spams the console. --}}
    <meta name="broadcasting-driver" content="{{ config('broadcasting.default') }}">

    {{-- Geist / Geist Mono web fonts. Loaded here (not via a CSS @import) so they
         fetch in parallel and don't block CSS parsing. --}}
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Geist:wght@300;400;500;600;700&family=Geist+Mono:wght@400;500;600&display=swap">

    {{-- Server-rendered SEO baseline (the single server-side head source). Title
         / meta / canonical / OG / Twitter / JSON-LD + the /llms.txt discovery
         link are resolved per-route by particle-academy/fancy-seo (config +
         App\Providers\SeoServiceProvider), each tag carrying a head-key so the
         client <Seo> (@particle-academy/fancy-inertia/seo) cleanly OVERRIDES
         them on hydration / SPA nav. The client <Seo> is client-only (it does
         not render during SSR) so it never DUPLICATES this baseline in the SSR
         first byte — see fancy-inertia's Seo (clientOnly under SSR). --}}
    <x-fancy-seo::head />

    <script>
        (function () {
            try {
                var saved = localStorage.getItem('fancy-ui.theme');
                // Only 'light'/'dark' count as an explicit choice. Anything
                // else -- absent, or junk left by an older build -- means follow
                // the system, which is exactly what react-fancy's initTheme()
                // decides a moment later. If these two disagree the page paints
                // one theme and then flips to the other.
                var dark = (saved === 'light' || saved === 'dark')
                    ? saved === 'dark'
                    : window.matchMedia('(prefers-color-scheme: dark)').matches;
                if (dark) document.documentElement.classList.add('dark');
                document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
            } catch (e) { /* noop */ }
        })();
    </script>

    {{-- React Fast Refresh preamble. No-op in production; without it `npm run dev`
         dies on "@vitejs/plugin-react can't detect preamble" and the whole app
         renders nothing — a break only ever visible in dev, which is exactly why
         it survived: `npm run build` never exercises this path. --}}
    @viteReactRefresh
    @vite(['resources/css/showcase.css', 'resources/js/showcase-app.tsx'])
    @inertiaHead
</head>
<body class="min-h-screen antialiased bg-white text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100">
    @inertia

    {{-- Admin-pasted tracker / Fancy Pixel snippet (Admin → Settings). Raw by
         design — a script embed set by a trusted admin, exactly like an external
         site pasting our snippet into their own HTML. --}}
    {!! $tracker ?? '' !!}

    {{-- No service worker is registered. The showcase is intentionally NOT a
         SW-PWA (it serves dynamic / SSR content). The /sw.js route still exists,
         serving a self-unregistering tombstone so any SW from a prior deploy
         tears itself down on its next update check. See ServiceWorkerController
         and the contained PWA demo at /packages/fancy-pwa. --}}
</body>
</html>

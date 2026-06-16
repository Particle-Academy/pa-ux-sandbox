<!doctype html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="csrf-token" content="{{ csrf_token() }}">

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
                var dark = saved
                    ? saved === 'dark'
                    : window.matchMedia('(prefers-color-scheme: dark)').matches;
                if (dark) document.documentElement.classList.add('dark');
                document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
            } catch (e) { /* noop */ }
        })();
    </script>

    @vite(['resources/css/showcase.css', 'resources/js/showcase-app.tsx'])
    @inertiaHead
</head>
<body class="min-h-screen antialiased bg-white text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100">
    @inertia

    {{-- Admin-pasted tracker / Fancy Pixel snippet (Admin → Settings). Raw by
         design — a script embed set by a trusted admin, exactly like an external
         site pasting our snippet into their own HTML. --}}
    {!! $tracker ?? '' !!}
</body>
</html>

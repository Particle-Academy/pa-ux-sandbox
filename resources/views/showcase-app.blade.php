<!doctype html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="csrf-token" content="{{ csrf_token() }}">

    {{-- Server-rendered SEO baseline. The app is a client-rendered SPA, so this
         is what crawlers / social scrapers / LLM bots see on first byte. Title /
         meta / canonical / OG / Twitter / JSON-LD + the /llms.txt discovery link
         are all resolved per-route by particle-academy/fancy-seo (config +
         App\Providers\SeoServiceProvider). The client <Seo> from
         @particle-academy/fancy-inertia/seo overrides per page on SPA nav. --}}
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

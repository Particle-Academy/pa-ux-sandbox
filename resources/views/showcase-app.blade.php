<!doctype html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="csrf-token" content="{{ csrf_token() }}">

    {{-- Server-rendered SEO. The app is a client-rendered SPA, so this is what
         crawlers / social scrapers / LLM bots see on first byte (see App\Support\Seo). --}}
    @php($seo = $seo ?? \App\Support\Seo::forRequest(request()))
    <title inertia>{{ $seo['title'] }}</title>
    <meta head-key="description" name="description" content="{{ $seo['description'] }}">
    <link head-key="canonical" rel="canonical" href="{{ $seo['canonical'] }}">
    <meta name="theme-color" content="#8b5cf6">
    <meta name="robots" content="index, follow, max-image-preview:large">

    {{-- Open Graph --}}
    <meta head-key="og:type" property="og:type" content="{{ $seo['type'] }}">
    <meta head-key="og:site_name" property="og:site_name" content="{{ $seo['siteName'] }}">
    <meta head-key="og:title" property="og:title" content="{{ $seo['title'] }}">
    <meta head-key="og:description" property="og:description" content="{{ $seo['description'] }}">
    <meta head-key="og:url" property="og:url" content="{{ $seo['canonical'] }}">
    <meta head-key="og:image" property="og:image" content="{{ $seo['image'] }}">

    {{-- Twitter --}}
    <meta head-key="twitter:card" name="twitter:card" content="summary_large_image">
    <meta head-key="twitter:title" name="twitter:title" content="{{ $seo['title'] }}">
    <meta head-key="twitter:description" name="twitter:description" content="{{ $seo['description'] }}">
    <meta head-key="twitter:image" name="twitter:image" content="{{ $seo['image'] }}">

    {{-- LLM / AI discovery --}}
    <link rel="alternate" type="text/markdown" title="llms.txt" href="{{ rtrim(config('app.url'), '/') }}/llms.txt">

    {{-- Structured data --}}
    @foreach ($seo['jsonLd'] as $node)
        <script type="application/ld+json">{!! json_encode($node, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE) !!}</script>
    @endforeach

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
</body>
</html>

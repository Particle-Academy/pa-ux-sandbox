<!doctype html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <title inertia>{{ config('app.name', 'Fancy UI Kit') }}</title>

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

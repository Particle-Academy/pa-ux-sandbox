<!doctype html>
{{--
    Self-contained branded error page. Intentionally has NO @vite / @inertia
    dependency: a 5xx can fire before assets resolve or when the SPA can't
    mount, so everything here (styles, dark-mode toggle) is inline and works
    on the first byte with zero JS required.
--}}
<html lang="en" class="@yield('html_class')">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="robots" content="noindex">
    <title>@yield('code') · @yield('title', 'Error') — Fancy UI</title>
    <meta name="theme-color" content="#8b5cf6">
    <script>
        // Match the showcase's theme bootstrap so the error page honors the
        // visitor's chosen / system theme instead of flashing the wrong one.
        (function () {
            try {
                var saved = localStorage.getItem('fancy-ui.theme');
                var dark = saved ? saved === 'dark'
                    : window.matchMedia('(prefers-color-scheme: dark)').matches;
                if (dark) document.documentElement.classList.add('dark');
            } catch (e) { /* noop */ }
        })();
    </script>
    <style>
        :root {
            --bg: #ffffff; --bg2: #f5f3ff; --fg: #18181b; --muted: #71717a;
            --card: rgba(255,255,255,.7); --border: #e4e4e7;
            --accent: #7c3aed; --accent2: #c026d3;
            --btn-fg: #ffffff; --btn2-bg: #ffffff; --btn2-fg: #3f3f46; --btn2-border: #d4d4d8;
        }
        html.dark {
            --bg: #09090b; --bg2: #0c0a1a; --fg: #f4f4f5; --muted: #a1a1aa;
            --card: rgba(24,24,27,.6); --border: #27272a;
            --accent: #8b5cf6; --accent2: #d946ef;
            --btn-fg: #ffffff; --btn2-bg: #18181b; --btn2-fg: #e4e4e7; --btn2-border: #3f3f46;
        }
        * { box-sizing: border-box; }
        html, body { height: 100%; }
        body {
            margin: 0;
            font-family: ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            color: var(--fg);
            background:
                radial-gradient(60rem 40rem at 50% -10%, var(--bg2), transparent 70%),
                var(--bg);
            display: flex; align-items: center; justify-content: center;
            padding: 1.5rem;
            -webkit-font-smoothing: antialiased;
        }
        .card {
            width: 100%; max-width: 30rem; text-align: center;
            background: var(--card);
            border: 1px solid var(--border);
            border-radius: 1.25rem;
            padding: 2.5rem 2rem;
            backdrop-filter: blur(8px);
            box-shadow: 0 1px 0 rgba(255,255,255,.04) inset, 0 20px 50px -20px rgba(0,0,0,.25);
        }
        .mark {
            display: inline-flex; align-items: center; gap: .5rem;
            font-weight: 700; font-size: .8rem; letter-spacing: .02em;
            color: var(--muted); margin-bottom: 1.5rem;
        }
        .mark .glyph {
            width: 1.4rem; height: 1.4rem; border-radius: .45rem;
            background: linear-gradient(135deg, var(--accent), var(--accent2));
            color: #fff; display: inline-flex; align-items: center; justify-content: center;
            font-size: .85rem;
        }
        .code {
            font-size: 4.5rem; line-height: 1; font-weight: 800; letter-spacing: -.03em;
            background: linear-gradient(135deg, var(--accent), var(--accent2));
            -webkit-background-clip: text; background-clip: text; color: transparent;
            margin: 0;
        }
        h1 { font-size: 1.35rem; font-weight: 700; margin: 1rem 0 .5rem; }
        p { color: var(--muted); font-size: .95rem; line-height: 1.6; margin: 0 auto; max-width: 24rem; }
        .actions { display: flex; flex-wrap: wrap; gap: .75rem; justify-content: center; margin-top: 1.75rem; }
        .btn {
            display: inline-flex; align-items: center; gap: .4rem;
            padding: .6rem 1.1rem; border-radius: .6rem; font-size: .9rem; font-weight: 600;
            text-decoration: none; transition: opacity .15s, border-color .15s;
        }
        .btn-primary { background: linear-gradient(135deg, var(--accent), var(--accent2)); color: var(--btn-fg); }
        .btn-primary:hover { opacity: .9; }
        .btn-ghost { background: var(--btn2-bg); color: var(--btn2-fg); border: 1px solid var(--btn2-border); }
        .btn-ghost:hover { border-color: var(--accent); }
        .ref { margin-top: 1.5rem; font-size: .72rem; color: var(--muted); font-family: ui-monospace, SFMono-Regular, Menlo, monospace; }
    </style>
</head>
<body>
    <main class="card">
        <span class="mark"><span class="glyph">✦</span> Fancy UI</span>
        <p class="code">@yield('code')</p>
        <h1>@yield('title', 'Something went wrong')</h1>
        <p>@yield('message', 'An unexpected error occurred. Please try again.')</p>
        <div class="actions">
            <a class="btn btn-primary" href="/">← Back to home</a>
            <a class="btn btn-ghost" href="/docs">Browse the docs</a>
        </div>
        @hasSection('ref')
            <div class="ref">@yield('ref')</div>
        @endif
    </main>
</body>
</html>

<!doctype html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        html, body { width: 1200px; height: 630px; }
        body {
            font-family: ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
            background: #0a0a0b;
            background-image:
                radial-gradient(900px 500px at 78% -10%, rgba(139, 92, 246, 0.30), transparent 60%),
                radial-gradient(700px 500px at -5% 110%, rgba(56, 189, 248, 0.18), transparent 55%);
            color: #fafafa;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            padding: 72px 80px;
        }
        .eyebrow {
            display: inline-flex; align-items: center; gap: 12px;
            font-size: 24px; font-weight: 600; letter-spacing: 0.04em; text-transform: uppercase;
            color: #c4b5fd;
        }
        .dot { width: 12px; height: 12px; border-radius: 999px; background: #8b5cf6; box-shadow: 0 0 0 6px rgba(139,92,246,0.22); }
        .title { font-size: 84px; font-weight: 700; letter-spacing: -0.03em; line-height: 1.02; margin-top: 28px; }
        .subtitle { font-size: 34px; line-height: 1.32; color: #a1a1aa; margin-top: 28px; max-width: 1000px;
            display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; }
        .footer { display: flex; align-items: center; gap: 18px; }
        .brand { display: flex; align-items: center; gap: 16px; }
        .mark { width: 52px; height: 52px; border-radius: 13px; object-fit: cover; }
        .brand-name { font-size: 30px; font-weight: 700; letter-spacing: -0.01em; }
        .brand-tag { font-size: 24px; color: #71717a; }
        .spacer { flex: 1; }
        .url { font-family: ui-monospace, "SF Mono", Menlo, monospace; font-size: 24px; color: #8b5cf6; }
    </style>
</head>
<body>
    <div>
        @if ($eyebrow)
            <span class="eyebrow"><span class="dot"></span>{{ $eyebrow }}</span>
        @endif
        <div class="title">{{ $title }}</div>
        @if ($subtitle)
            <div class="subtitle">{{ $subtitle }}</div>
        @endif
    </div>
    <div class="footer">
        <div class="brand">
            <img class="mark" src="{{ $logo }}" alt="">
            <span class="brand-name">Fancy UI</span>
            <span class="brand-tag">· Human+ UX</span>
        </div>
        <div class="spacer"></div>
        <span class="url">ui.particle.academy</span>
    </div>
</body>
</html>

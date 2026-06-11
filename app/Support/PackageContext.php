<?php

namespace App\Support;

/**
 * Editorial Why / What / How for each *package* detail page — the package-level
 * sibling of {@see ComponentContext}. Hand-curated entries live in
 * {@see ENTRIES}; a generated JSON sidecar (written by the docs workflow) fills
 * the rest. Hand-curated always wins on a key collision.
 *
 * Why  — the gap in the ecosystem this package fills; why you&apos;d reach for it.
 * What — the shape of the package: its primitives, its contract, its surface.
 * How  — install + the smallest "first render" so a reader can start.
 *
 * Keyed by package slug.
 */
class PackageContext
{
    /** @var array<string, array{why: string, what: string, how: string}> */
    private const ENTRIES = [
        'fancy-diff' => [
            'why' => 'Reviewing and accepting changes is the human&apos;s job in a Human+ app — and the changes increasingly come from an <em>agent</em> that drafts an edit and waits for a person to confirm it. That is the trust-but-verify loop: agents propose, humans accept or reject, hunk by hunk. Every team rebuilds this surface and most ship a read-only diff with no acceptance, or bolt acceptance onto opaque DOM an embedded agent can&apos;t drive. <code>fancy-diff</code> closes the gap with a controlled, client-side diff viewer where a human and an agent operate the <em>same</em> acceptance state — no server processing, no third-party runtime deps, and no DOM scraping.',
            'what' => 'A React side-by-side (or inline) document diff viewer with per-hunk accept/reject and a live merged result. The diff engine — line-level LCS plus intra-line word/char segments — runs in-browser, in-house, with <strong>zero third-party runtime dependencies</strong>. Acceptance is controlled: <code>value</code> is a <code>Record&lt;hunkId, "accepted" | "rejected" | "pending"&gt;</code> map with <code>onChange</code>; <code>getMergedResult()</code> / <code>onResult</code> fold the diff and acceptance into the merged document. The <code>source</code> is a JSON-friendly discriminated union with <strong>three datasources</strong>: <code>{ before, after }</code> (compute the diff in-house), <code>{ unified }</code> (parse a git unified diff), or <code>{ diff }</code> (a pre-built structured <code>Diff</code>). It composes react-fancy primitives (toolbar, buttons, badges, cards), exposes stable <code>data-fancy-diff-hunk</code> handles plus render-prop slots (<code>renderHunk</code> / <code>renderToolbar</code> / <code>renderGutter</code>), supports <code>mode="split" | "inline"</code> and trust-but-verify <code>pendingMode</code>, and emits optional <code>AutoActivity</code> events through <code>@particle-academy/fancy-auto-common</code>. <strong>Git-diff caveat:</strong> a unified diff carries only the changed hunks plus a little context, so parsed files are flagged <code>partial</code> and the merged result reconstructs only the lines in the diff window — feed full <code>{ before, after }</code> documents when you need a fully merged file.',
            'how' => 'Install <code>npm i @particle-academy/fancy-diff</code> (peers: <code>react</code>, <code>react-dom</code>, <code>@particle-academy/react-fancy</code>) and import the stylesheet: <code>import { FancyDiff } from "@particle-academy/fancy-diff"; import "@particle-academy/fancy-diff/styles.css";</code>. Diff two documents: <code>&lt;FancyDiff source={{ before, after }} value={value} onChange={setValue} onResult={(r) =&gt; setMerged(r.text)} /&gt;</code>. Parse a git diff instead: <code>&lt;FancyDiff source={{ unified }} mode="inline" /&gt;</code>. Read the merged document imperatively via a ref — <code>ref.current.getMergedResult().text</code> — and turn on <code>pendingMode</code> so an embedded agent stages proposals a human confirms. A one-sitting MCP bridge maps <code>diff_accept_hunk</code> / <code>diff_reject_hunk</code> onto the same controlled <code>value</code>/<code>onChange</code> loop.',
        ],

        'fancy-pixel' => [
            'why' => 'A site built with Fancy UI wants to <em>prove</em> it — that&apos;s how it earns a listing in the public Showcase, and how the suite stays visible across the web. <code>fancy-pixel</code> is the embeddable badge that does the proving — and the <strong>data pipe</strong> in the same chip: one embed verifies the site <em>and</em> streams its interaction analytics (clicks, scroll, focus heatmaps) to a host&apos;s endpoint, keyed by <code>siteKey</code>. That is how external sites feed a hosting project — the Showcase + the coming Analytics Suite — while a project measuring itself reaches for <code>fancy-heuristics</code> directly. The hard part most badges get wrong is that the host page can simply hide them with one CSS rule — so verification is meaningless. fancy-pixel renders into an <strong>open Shadow DOM</strong> (host CSS can&apos;t reach in), confirms with an <code>IntersectionObserver</code> that it is <em>actually</em> on-screen, and only counts a page as seen once it is. And because the suite is Human+, the badge is <em>inhabitable</em>: it carries a stable handle and dispatches a shown event so an embedded agent reads its presence and state without scraping the DOM.',
            'what' => 'A zero-dependency, vanilla-TypeScript embeddable badge + liveness/collection beacon with <strong>three styles × two placement modes</strong>. <code>style</code> ∈ <code>badge</code> ("Powered by Fancy UI" wordmark + glyph) / <code>mark</code> (glyph only) / <code>beacon</code> (a pulsing dot); <code>mode</code> ∈ <code>placed</code> (inline at a <code>target</code> selector/element) / <code>floating</code> (<code>position: fixed</code> in a corner). Every style renders into an <strong>open Shadow DOM</strong> so host CSS cannot hide it, and emits the <code>data-fancy-badge</code> marker the Showcase scanner detects plus a stable <code>data-fancy-pixel</code> handle and <code>data-fancy-pixel-style</code>. An <code>IntersectionObserver</code> verifies genuine on-screen visibility and dispatches a <code>fancy-pixel:shown</code> <code>CustomEvent</code> on <code>document</code>. The API is one call — <code>mountPixel({ style, mode, target?, siteKey, endpoint?, href? })</code> → a <code>{ host, visible, destroy() }</code> handle — or a single <code>&lt;script&gt;</code> tag that loads <em>and</em> auto-inits from its own <code>data-*</code> attributes (the IIFE global build also exposes <code>window.FancyPixel.mountPixel</code>). <strong>One endpoint, full pipe (opt-in):</strong> set <code>endpoint</code> and the single embed renders the badge, POSTs the verification/liveness ping to <code>${endpoint}/pixel</code>, <em>and</em> starts a bundled <code>fancy-heuristics-js</code> collector that streams interaction events (clicks, scroll, pointer heatmap, dwell — humans and agents) to <code>${endpoint}/collect</code>, keyed by <code>siteKey</code>. Pass <code>data-collect="false"</code> / <code>collect: false</code> for badge + liveness only; omit <code>endpoint</code> and no network request is ever made. The collector is inlined into the IIFE global, so the one external-site <code>&lt;script&gt;</code> is fully self-contained.',
            'how' => 'No build step — drop the one-line tag: <code>&lt;script src="https://unpkg.com/@particle-academy/fancy-pixel/dist/fancy-pixel.global.min.js" data-style="badge" data-mode="floating" data-site="YOUR_SITE_KEY" data-endpoint="https://your-host/heuristics"&gt;&lt;/script&gt;</code>. Or install and mount programmatically: <code>npm i @particle-academy/fancy-pixel</code>, then <code>import { mountPixel } from "@particle-academy/fancy-pixel"; const pixel = mountPixel({ style: "badge", mode: "floating", siteKey: "YOUR_SITE_KEY", endpoint: "https://your-host/heuristics" });</code> — call <code>pixel.destroy()</code> to tear it down. For an inline badge pass <code>mode: "placed"</code> + a <code>target</code> selector/element. <strong>Leave <code>endpoint</code> off</strong> for a pure visual badge with zero network traffic; set it and one embed both verifies the site and streams its interaction analytics to the host (add <code>data-collect="false"</code> for badge + liveness only). Watch presence with <code>document.addEventListener("fancy-pixel:shown", …)</code>.',
        ],

        'fancy-term' => [
            'why' => 'A terminal is where humans and agents do <em>real</em> work — run a command, watch the output, decide what&apos;s next. Most apps embed <code>xterm.js</code> raw: an uncontrolled DOM widget that an embedded agent can only read by scraping pixels and can only drive by faking keystrokes. That breaks the moment the layout shifts. <code>fancy-term</code> makes the terminal a proper Human+ surface — <strong>controlled</strong> so the host owns the buffer, <strong>themeable</strong> so it&apos;s sexy by default, and <strong>bridgeable</strong> so an agent reads the visible buffer and writes input through a stable handle, never the DOM. And because running a command is irreversible, it carries the trust-but-verify affordance: an agent <em>proposes</em> a command and a human confirms before it runs.',
            'what' => 'A React <code>&lt;Terminal&gt;</code> wrapping <code>xterm.js</code>. Output is a <strong>controlled buffer</strong> — pass <code>output</code> and the component writes only the appended delta as it grows (so you can stream command output straight from React state, e.g. via fancy-query&apos;s <code>useFancyStream</code>); <code>onData</code> forwards the user&apos;s keystrokes upstream. It carries a stable <code>data-fancy-terminal</code> handle plus a ref exposing a <code>TerminalHandle</code> — <code>write</code> / <code>writeln</code> / <code>clear</code> / <code>reset</code> / <code>fit</code> / <code>focus</code> / <code>getBuffer()</code> (the visible text an agent "sees") / <code>getSelection()</code> / <code>.xterm</code> (escape hatch). Three hooks ship the headless engine layer: <code>useTerminal</code> (create/own the xterm instance), <code>useTerminalFit</code> (ResizeObserver auto-fit, guarding the hidden-tab / late-mount 0×0 trap), and <code>useTerminalSession</code> (bind to a streamed PTY / command backend). <code>xterm</code> + <code>@xterm/addon-fit</code> are <strong>peer dependencies</strong> — the wrapper stays zero-runtime-dep, the same posture as fancy-echarts over ECharts — and a Fancy dark theme (drawn from the react-fancy Tailwind v4 tokens) is the default.',
            'how' => 'Install <code>npm i @particle-academy/fancy-term @xterm/xterm @xterm/addon-fit</code> and import the xterm stylesheet once: <code>import "@xterm/xterm/css/xterm.css";</code>. The parent needs a height (the terminal fits its container): <code>&lt;div style={{ height: 360 }}&gt;&lt;Terminal output={out} onData={(d) =&gt; backend.send(d)} /&gt;&lt;/div&gt;</code>. Drive it from React state via <code>output</code>, or imperatively through the ref. Bind a backend with <code>useTerminalSession({ transport: { send, subscribe } })</code> → <code>&lt;Terminal output={session.output} onData={session.sendData} /&gt;</code>. To make it <em>inhabitable</em>, register the bridge from <code>@particle-academy/agent-integrations</code>: <code>registerTerminalBridge(server, { adapter })</code> exposes <code>terminal_read</code> / <code>terminal_write</code> / <code>terminal_run</code>; turn on <code>pendingMode</code> and destructive commands are staged for a human to confirm (<code>terminal_confirm</code> / <code>terminal_reject</code>).',
        ],
    ];

    /**
     * @var array<string, array{why: string, what: string, how: string}>|null
     */
    private static ?array $generated = null;

    /** @return array{why: string, what: string, how: string}|null */
    public static function find(string $packageSlug): ?array
    {
        return self::ENTRIES[$packageSlug] ?? self::generated()[$packageSlug] ?? null;
    }

    /**
     * Lazily load + cache the generated entries from the JSON sidecar.
     *
     * @return array<string, array{why: string, what: string, how: string}>
     */
    private static function generated(): array
    {
        if (self::$generated !== null) {
            return self::$generated;
        }

        $path = resource_path('data/package-context.json');
        if (! is_file($path)) {
            return self::$generated = [];
        }

        $decoded = json_decode((string) file_get_contents($path), true);

        return self::$generated = is_array($decoded) ? $decoded : [];
    }
}
